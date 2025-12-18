import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { LawyerType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password: string;

  @IsEnum(LawyerType)
  lawyerType: LawyerType;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  fullName: string;

  @IsString()
  @Length(12, 12)
  @Matches(/^\d{12}$/, { message: 'IIN must be exactly 12 digits' })
  iin: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+7\d{10}$/, { message: 'Phone must be in format +7XXXXXXXXXX' })
  phone: string;
}
