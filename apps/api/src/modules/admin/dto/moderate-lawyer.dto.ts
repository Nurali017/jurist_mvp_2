import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ApproveLawyerDto {
  // No additional fields needed for approval
}

export class RejectLawyerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason: string;
}
