import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';

// Supabase JWT payload structure
interface SupabaseJwtPayload {
  sub: string; // Supabase user ID
  email?: string;
  user_metadata?: {
    full_name?: string;
    user_type?: 'lawyer' | 'admin';
    role?: string;
  };
  aud: string;
  role: string;
  exp: number;
  iat: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('supabase.jwtSecret') || configService.get<string>('jwt.secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    const supabaseId = payload.sub;
    const userType = payload.user_metadata?.user_type;

    // Try to find user by Supabase ID
    if (userType === 'admin') {
      const admin = await this.prisma.adminUser.findUnique({
        where: { supabaseId },
        select: {
          id: true,
          supabaseId: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      if (!admin.isActive) {
        throw new UnauthorizedException('Admin account is deactivated');
      }

      return { ...admin, userType: 'admin' };
    }

    // Default to lawyer
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { supabaseId },
      select: {
        id: true,
        supabaseId: true,
        email: true,
        fullName: true,
        lawyerType: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!lawyer) {
      // If no lawyer found, try admin as fallback (in case user_metadata wasn't set)
      const admin = await this.prisma.adminUser.findUnique({
        where: { supabaseId },
        select: {
          id: true,
          supabaseId: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      });

      if (admin) {
        if (!admin.isActive) {
          throw new UnauthorizedException('Admin account is deactivated');
        }
        return { ...admin, userType: 'admin' };
      }

      throw new UnauthorizedException('User not found');
    }

    return { ...lawyer, userType: 'lawyer' };
  }
}
