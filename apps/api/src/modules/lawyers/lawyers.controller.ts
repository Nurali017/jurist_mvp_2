import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { LawyersService } from './lawyers.service';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedLawyerGuard } from '../auth/guards/approved-lawyer.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequestStatus } from '@prisma/client';

interface LawyerUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  userType: 'lawyer';
}

@Controller('lawyer')
@UseGuards(JwtAuthGuard)
export class LawyersController {
  constructor(private lawyersService: LawyersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: LawyerUser) {
    return this.lawyersService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: LawyerUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.lawyersService.updateProfile(user.id, dto);
  }

  @Post('documents')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photo', maxCount: 1 },
      { name: 'diploma', maxCount: 1 },
      { name: 'license', maxCount: 1 },
    ]),
  )
  async updateDocuments(
    @CurrentUser() user: LawyerUser,
    @UploadedFiles()
    files: {
      photo?: Express.Multer.File[];
      diploma?: Express.Multer.File[];
      license?: Express.Multer.File[];
    },
  ) {
    return this.lawyersService.updateDocuments(user.id, {
      photo: files.photo?.[0],
      diploma: files.diploma?.[0],
      license: files.license?.[0],
    });
  }

  @Get('requests')
  @UseGuards(ApprovedLawyerGuard)
  async getRequests(
    @CurrentUser() user: LawyerUser,
    @Query('status') status?: RequestStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.lawyersService.getRequests(user.id, { status, page, limit });
  }

  @Get('requests/:id')
  @UseGuards(ApprovedLawyerGuard)
  async getRequestDetails(
    @CurrentUser() user: LawyerUser,
    @Param('id') requestId: string,
  ) {
    return this.lawyersService.getRequestDetails(user.id, requestId);
  }

  @Post('requests/:id/take')
  @UseGuards(ApprovedLawyerGuard)
  async takeRequest(
    @CurrentUser() user: LawyerUser,
    @Param('id') requestId: string,
  ) {
    return this.lawyersService.takeRequest(user.id, requestId);
  }

  @Post('requests/:id/release')
  @UseGuards(ApprovedLawyerGuard)
  async releaseRequest(
    @CurrentUser() user: LawyerUser,
    @Param('id') requestId: string,
  ) {
    return this.lawyersService.releaseRequest(user.id, requestId);
  }

  @Get('my-requests')
  @UseGuards(ApprovedLawyerGuard)
  async getMyRequests(
    @CurrentUser() user: LawyerUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.lawyersService.getMyRequests(user.id, { page, limit });
  }
}
