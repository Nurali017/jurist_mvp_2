import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Currency, PreferredContact } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(50, 2000, {
    message: 'Description must be between 50 and 2000 characters',
  })
  description: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  budget: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency = Currency.KZT;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  contactName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+7\d{10}$/, { message: 'Phone must be in format +7XXXXXXXXXX' })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(PreferredContact)
  @IsOptional()
  preferredContact?: PreferredContact = PreferredContact.ANY;
}
