import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    this.frontendUrl = this.configService.get<string>('frontend.url') || 'http://localhost:3000';
  }

  // ==================== LAWYER AUTH ====================

  async register(
    dto: RegisterDto,
    documentUrls: {
      photoUrl: string;
      diplomaUrl: string;
      licenseUrl: string;
    },
  ) {
    // Check if email already exists in our database
    const existingLawyer = await this.prisma.lawyerProfile.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingLawyer) {
      throw new ConflictException('Email already registered');
    }

    // Validate IIN (Kazakhstan IIN checksum)
    if (!this.validateIIN(dto.iin)) {
      throw new BadRequestException('Invalid IIN');
    }

    // Create user in Supabase Auth using signUp (sends verification email automatically)
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: dto.email.toLowerCase(),
      password: dto.password,
      options: {
        emailRedirectTo: `${this.frontendUrl}/ru/login`,
        data: {
          full_name: dto.fullName,
          user_type: 'lawyer',
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email already registered');
      }
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestException('Failed to create user');
    }

    // Create lawyer profile linked to Supabase user
    const lawyer = await this.prisma.lawyerProfile.create({
      data: {
        supabaseId: authData.user.id,
        email: dto.email.toLowerCase(),
        lawyerType: dto.lawyerType,
        fullName: dto.fullName,
        iin: dto.iin,
        phone: dto.phone,
        photoUrl: documentUrls.photoUrl,
        diplomaUrl: documentUrls.diplomaUrl,
        licenseUrl: documentUrls.licenseUrl,
      },
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      email: lawyer.email,
    };
  }

  async login(dto: LoginDto) {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: dto.email.toLowerCase(),
      password: dto.password,
    });

    if (authError) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Find lawyer profile
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { supabaseId: authData.user.id },
    });

    if (!lawyer) {
      throw new UnauthorizedException('User profile not found');
    }

    // Sync email verification status
    if (!lawyer.emailVerified) {
      await this.prisma.lawyerProfile.update({
        where: { id: lawyer.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(authData.user.email_confirmed_at),
        },
      });
    }

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        id: lawyer.id,
        supabaseId: lawyer.supabaseId,
        email: lawyer.email,
        fullName: lawyer.fullName,
        lawyerType: lawyer.lawyerType,
        status: lawyer.status,
      },
      userType: 'lawyer',
    };
  }

  // ==================== UNIFIED LOGIN ====================

  async unifiedLogin(dto: LoginDto) {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: dto.email.toLowerCase(),
      password: dto.password,
    });

    if (authError) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const userType = authData.user.user_metadata?.user_type;

    // Check if admin
    if (userType === 'admin') {
      const admin = await this.prisma.adminUser.findUnique({
        where: { supabaseId: authData.user.id },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin profile not found');
      }

      if (!admin.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Update last login
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLogin: new Date() },
      });

      return {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        user: {
          id: admin.id,
          supabaseId: admin.supabaseId,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
        },
        userType: 'admin',
      };
    }

    // Default to lawyer
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { supabaseId: authData.user.id },
    });

    if (!lawyer) {
      throw new UnauthorizedException('User profile not found');
    }

    // Sync email verification status
    if (!lawyer.emailVerified && authData.user.email_confirmed_at) {
      await this.prisma.lawyerProfile.update({
        where: { id: lawyer.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(authData.user.email_confirmed_at),
        },
      });
    }

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        id: lawyer.id,
        supabaseId: lawyer.supabaseId,
        email: lawyer.email,
        fullName: lawyer.fullName,
        lawyerType: lawyer.lawyerType,
        status: lawyer.status,
      },
      userType: 'lawyer',
    };
  }

  // ==================== ADMIN AUTH ====================

  async createAdmin(email: string, password: string, fullName: string, role: 'SUPER_ADMIN' | 'MODERATOR') {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm admin emails
      user_metadata: {
        full_name: fullName,
        user_type: 'admin',
        role,
      },
    });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    // Create admin profile
    const admin = await this.prisma.adminUser.create({
      data: {
        supabaseId: authData.user.id,
        email: email.toLowerCase(),
        fullName,
        role,
      },
    });

    return admin;
  }

  // ==================== PASSWORD RESET ====================

  async forgotPassword(email: string) {
    console.log(`[ForgotPassword] Request for email: ${email.toLowerCase()}`);

    // Check if user exists (lawyer or admin)
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { email: email.toLowerCase() },
    });

    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!lawyer && !admin) {
      console.log(`[ForgotPassword] User not found: ${email.toLowerCase()}`);
      return { message: 'If the email exists, a reset link has been sent' };
    }

    console.log(`[ForgotPassword] User found, sending reset email. RedirectTo: ${this.frontendUrl}/ru/reset-password`);

    // Send password reset email via Supabase
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${this.frontendUrl}/ru/reset-password`,
    });

    if (error) {
      console.error('[ForgotPassword] Supabase error:', error.message, error);
    } else {
      console.log('[ForgotPassword] Supabase response:', data);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  // ==================== TOKEN MANAGEMENT ====================

  async refreshTokens(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
    };
  }

  async logout(accessToken: string) {
    // Sign out from Supabase
    const { error } = await this.supabase.auth.admin.signOut(accessToken);

    if (error) {
      // Log but don't fail
      console.error('Logout error:', error);
    }

    return { message: 'Logged out successfully' };
  }

  // ==================== USER LOOKUP ====================

  async getLawyerBySupabaseId(supabaseId: string) {
    return this.prisma.lawyerProfile.findUnique({
      where: { supabaseId },
    });
  }

  async getAdminBySupabaseId(supabaseId: string) {
    return this.prisma.adminUser.findUnique({
      where: { supabaseId },
    });
  }

  async getUserBySupabaseId(supabaseId: string) {
    // Try lawyer first
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { supabaseId },
    });

    if (lawyer) {
      return { user: lawyer, userType: 'lawyer' as const };
    }

    // Try admin
    const admin = await this.prisma.adminUser.findUnique({
      where: { supabaseId },
    });

    if (admin) {
      return { user: admin, userType: 'admin' as const };
    }

    return null;
  }

  // ==================== EMAIL CHECK ====================

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const existingLawyer = await this.prisma.lawyerProfile.findUnique({
      where: { email: email.toLowerCase() },
    });

    return { available: !existingLawyer };
  }

  // ==================== HELPERS ====================

  private validateIIN(iin: string): boolean {
    if (!/^\d{12}$/.test(iin)) return false;

    // Kazakhstan IIN checksum validation
    const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

    const digits = iin.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 11; i++) {
      sum += digits[i] * weights1[i];
    }

    let checksum = sum % 11;

    if (checksum === 10) {
      sum = 0;
      for (let i = 0; i < 11; i++) {
        sum += digits[i] * weights2[i];
      }
      checksum = sum % 11;
    }

    return checksum === digits[11];
  }
}
