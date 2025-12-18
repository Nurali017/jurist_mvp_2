import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RejectLawyerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { LawyerStatus, LawyerType, RequestStatus } from '@prisma/client';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  userType: 'admin';
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==================== LAWYERS ====================

  @Get('lawyers')
  async getLawyers(
    @Query('status') status?: LawyerStatus,
    @Query('type') type?: LawyerType,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getLawyers({ status, type, search, page, limit });
  }

  @Get('lawyers/:id')
  async getLawyerDetails(@Param('id') lawyerId: string) {
    return this.adminService.getLawyerDetails(lawyerId);
  }

  @Patch('lawyers/:id/approve')
  async approveLawyer(
    @Param('id') lawyerId: string,
    @CurrentUser() admin: AdminUser,
    @Ip() ip: string,
  ) {
    return this.adminService.approveLawyer(lawyerId, admin.id, ip);
  }

  @Patch('lawyers/:id/reject')
  async rejectLawyer(
    @Param('id') lawyerId: string,
    @Body() dto: RejectLawyerDto,
    @CurrentUser() admin: AdminUser,
    @Ip() ip: string,
  ) {
    return this.adminService.rejectLawyer(lawyerId, admin.id, dto, ip);
  }

  // ==================== REQUESTS ====================

  @Get('requests')
  async getRequests(
    @Query('status') status?: RequestStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getRequests({ status, page, limit });
  }

  @Get('requests/:id')
  async getRequestDetails(@Param('id') requestId: string) {
    return this.adminService.getRequestDetails(requestId);
  }

  @Patch('requests/:id')
  async updateRequestStatus(
    @Param('id') requestId: string,
    @Body('status') status: RequestStatus,
    @CurrentUser() admin: AdminUser,
    @Ip() ip: string,
  ) {
    return this.adminService.updateRequestStatus(requestId, status, admin.id, ip);
  }

  @Delete('requests/:id')
  async deleteRequest(
    @Param('id') requestId: string,
    @CurrentUser() admin: AdminUser,
    @Ip() ip: string,
  ) {
    return this.adminService.deleteRequest(requestId, admin.id, ip);
  }
}
