import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { RequestsService } from '../requests/requests.service';
import { RejectLawyerDto } from './dto';
import { LawyerStatus, LawyerType, RequestStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private requestsService: RequestsService,
  ) {}

  // ==================== LAWYERS ====================

  async getLawyers(options: {
    status?: LawyerStatus;
    type?: LawyerType;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, type, search } = options;
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.lawyerType = type;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { iin: { contains: search } },
      ];
    }

    const [lawyers, total] = await Promise.all([
      this.prisma.lawyerProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          lawyerType: true,
          fullName: true,
          phone: true,
          status: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.lawyerProfile.count({ where }),
    ]);

    return {
      data: lawyers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLawyerDetails(lawyerId: string) {
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      include: {
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    return lawyer;
  }

  async approveLawyer(lawyerId: string, adminId: string, ipAddress: string) {
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
    });

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    // Update lawyer status
    const updatedLawyer = await this.prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: {
        status: LawyerStatus.APPROVED,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorType: 'admin',
        action: 'approve_lawyer',
        targetType: 'LawyerProfile',
        targetId: lawyerId,
        ipAddress,
      },
    });

    // Send approval email
    await this.emailService.sendApprovalEmail(lawyer.email, lawyer.fullName);

    return {
      message: 'Lawyer approved successfully',
      lawyer: {
        id: updatedLawyer.id,
        email: updatedLawyer.email,
        fullName: updatedLawyer.fullName,
        status: updatedLawyer.status,
      },
    };
  }

  async rejectLawyer(
    lawyerId: string,
    adminId: string,
    dto: RejectLawyerDto,
    ipAddress: string,
  ) {
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
    });

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    // Update lawyer status
    const updatedLawyer = await this.prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: {
        status: LawyerStatus.REJECTED,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorType: 'admin',
        action: 'reject_lawyer',
        targetType: 'LawyerProfile',
        targetId: lawyerId,
        details: { reason: dto.reason },
        ipAddress,
      },
    });

    // Send rejection email
    await this.emailService.sendRejectionEmail(
      lawyer.email,
      lawyer.fullName,
      dto.reason,
    );

    return {
      message: 'Lawyer rejected successfully',
      lawyer: {
        id: updatedLawyer.id,
        email: updatedLawyer.email,
        fullName: updatedLawyer.fullName,
        status: updatedLawyer.status,
      },
    };
  }

  // ==================== REQUESTS ====================

  async getRequests(options: {
    status?: RequestStatus;
    page?: number;
    limit?: number;
  }) {
    return this.requestsService.findAll(options);
  }

  async getRequestDetails(requestId: string) {
    return this.requestsService.findOne(requestId);
  }

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    adminId: string,
    ipAddress: string,
  ) {
    const request = await this.requestsService.updateStatus(requestId, status);

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorType: 'admin',
        action: 'update_request_status',
        targetType: 'Request',
        targetId: requestId,
        details: { newStatus: status },
        ipAddress,
      },
    });

    return request;
  }

  async deleteRequest(requestId: string, adminId: string, ipAddress: string) {
    // Create audit log before deletion
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorType: 'admin',
        action: 'delete_request',
        targetType: 'Request',
        targetId: requestId,
        ipAddress,
      },
    });

    return this.requestsService.delete(requestId);
  }

  // ==================== STATS ====================

  async getDashboardStats() {
    const [requestStats, lawyerStats] = await Promise.all([
      this.requestsService.getStats(),
      this.getLawyerStats(),
    ]);

    return {
      requests: requestStats,
      lawyers: lawyerStats,
    };
  }

  private async getLawyerStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.lawyerProfile.count(),
      this.prisma.lawyerProfile.count({
        where: { status: LawyerStatus.PENDING },
      }),
      this.prisma.lawyerProfile.count({
        where: { status: LawyerStatus.APPROVED },
      }),
      this.prisma.lawyerProfile.count({
        where: { status: LawyerStatus.REJECTED },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }
}
