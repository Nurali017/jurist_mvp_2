import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { StorageService } from '../storage/storage.service';
import { RegisterDto, LoginDto, ForgotPasswordDto } from './dto';
import { Public } from '@/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private storageService: StorageService,
  ) {}

  @Public()
  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photo', maxCount: 1 },
      { name: 'diploma', maxCount: 1 },
      { name: 'license', maxCount: 1 },
    ]),
  )
  async register(
    @Body() dto: RegisterDto,
    @UploadedFiles()
    files: {
      photo?: Express.Multer.File[];
      diploma?: Express.Multer.File[];
      license?: Express.Multer.File[];
    },
  ) {
    // Validate files are present
    if (!files.photo?.[0] || !files.diploma?.[0] || !files.license?.[0]) {
      throw new Error('All documents are required: photo, diploma, license');
    }

    // Upload files to storage
    const photoUrl = await this.storageService.uploadFile(
      files.photo[0],
      'photos',
    );
    const diplomaUrl = await this.storageService.uploadFile(
      files.diploma[0],
      'diplomas',
    );
    const licenseUrl = await this.storageService.uploadFile(
      files.license[0],
      'licenses',
    );

    return this.authService.register(dto, {
      photoUrl,
      diplomaUrl,
      licenseUrl,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.unifiedLogin(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body('email') email: string) {
    return this.authService.checkEmailAvailability(email);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Public()
  @Post('create-admin')
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(
    @Body() body: { email: string; password: string; fullName: string; secret: string },
  ) {
    // Protect with secret key
    const adminSecret = process.env.ADMIN_SECRET || 'super-secret-admin-key-2024';
    if (body.secret !== adminSecret) {
      throw new Error('Invalid secret');
    }
    return this.authService.createAdmin(body.email, body.password, body.fullName, 'SUPER_ADMIN');
  }
}
