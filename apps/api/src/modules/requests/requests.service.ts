import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { CreateRequestDto } from './dto';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateRequestDto, ipAddress: string) {
    // Check rate limit (10 requests per hour from same IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await this.prisma.request.count({
      where: {
        ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentRequests >= 10) {
      throw new BadRequestException(
        'Too many requests. Please try again later.',
      );
    }

    // Generate request number
    const requestNumber = await this.generateRequestNumber();

    // Create request
    const request = await this.prisma.request.create({
      data: {
        requestNumber,
        description: dto.description,
        budget: dto.budget,
        currency: dto.currency,
        contactName: dto.contactName,
        phone: dto.phone,
        email: dto.email,
        preferredContact: dto.preferredContact,
        ipAddress,
      },
    });

    // Send confirmation email if provided
    if (dto.email) {
      await this.emailService.sendRequestConfirmationEmail(
        dto.email,
        dto.contactName,
        requestNumber,
      );
    }

    // Send notification to admin
    await this.emailService.sendNewRequestNotificationToAdmin(
      requestNumber,
      dto.description,
      dto.contactName,
      dto.phone,
    );

    // Send notifications to approved lawyers (async, don't wait)
    this.notifyLawyers(requestNumber, dto.description, dto.budget, dto.currency || 'KZT');

    return {
      message: 'Request submitted successfully',
      requestNumber: request.requestNumber,
    };
  }

  private async notifyLawyers(
    requestNumber: string,
    description: string,
    budget: number,
    currency: string,
  ) {
    try {
      // Get all approved lawyers
      const lawyers = await this.prisma.lawyerProfile.findMany({
        where: { status: 'APPROVED' },
        select: { email: true },
      });

      if (lawyers.length > 0) {
        const budgetStr = `${budget.toLocaleString()} ${currency}`;
        await this.emailService.sendNewRequestNotificationToLawyers(
          lawyers.map((l) => l.email),
          requestNumber,
          description,
          budgetStr,
        );
      }
    } catch (error) {
      // Log but don't fail the request
      console.error('Failed to notify lawyers:', error);
    }
  }

  async findAll(options: {
    status?: RequestStatus;
    page?: number;
    limit?: number;
  }) {
    const { status } = options;
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    return request;
  }

  async updateStatus(id: string, status: RequestStatus) {
    const request = await this.prisma.request.update({
      where: { id },
      data: { status },
    });

    return request;
  }

  async delete(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    await this.prisma.request.delete({
      where: { id },
    });

    return { message: 'Request deleted successfully' };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, todayCount, weekCount, byStatus] = await Promise.all([
      this.prisma.request.count(),
      this.prisma.request.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.request.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.request.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    return {
      total,
      today: todayCount,
      thisWeek: weekCount,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  private async generateRequestNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of today's requests
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.request.count({
      where: { createdAt: { gte: todayStart } },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `REQ-${dateStr}-${sequence}`;
  }

}
