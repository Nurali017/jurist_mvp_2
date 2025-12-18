import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(2, 200)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+7\d{10}$/, { message: 'Phone must be in format +7XXXXXXXXXX' })
  phone?: string;
}
