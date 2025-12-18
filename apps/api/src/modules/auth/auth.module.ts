import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    StorageModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtStrategy],
  exports: [AuthService, EmailService, JwtStrategy],
})
export class AuthModule {}
