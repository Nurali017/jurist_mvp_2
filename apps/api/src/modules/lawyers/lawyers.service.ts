import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateProfileDto } from './dto';
import { LawyerStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class LawyersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async getProfile(lawyerId: string) {
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: {
        id: true,
        email: true,
        lawyerType: true,
        fullName: true,
        iin: true,
        phone: true,
        photoUrl: true,
        diplomaUrl: true,
        licenseUrl: true,
        emailVerified: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    if (!lawyer) {
      throw new NotFoundException('Profile not found');
    }

    return lawyer;
  }

  async updateProfile(lawyerId: string, dto: UpdateProfileDto) {
    const lawyer = await this.prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        updatedAt: true,
      },
    });

    return lawyer;
  }

  async updateDocuments(
    lawyerId: string,
    files: {
      photo?: Express.Multer.File;
      diploma?: Express.Multer.File;
      license?: Express.Multer.File;
    },
  ) {
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
    });

    if (!lawyer) {
      throw new NotFoundException('Profile not found');
    }

    const updates: Record<string, string> = {};

    if (files.photo) {
      // Delete old file
      await this.storageService.deleteFile(
        this.storageService.extractPathFromUrl(lawyer.photoUrl),
      );
      updates.photoUrl = await this.storageService.uploadFile(
        files.photo,
        'photos',
      );
    }

    if (files.diploma) {
      await this.storageService.deleteFile(
        this.storageService.extractPathFromUrl(lawyer.diplomaUrl),
      );
      updates.diplomaUrl = await this.storageService.uploadFile(
        files.diploma,
        'diplomas',
      );
    }

    if (files.license) {
      await this.storageService.deleteFile(
        this.storageService.extractPathFromUrl(lawyer.licenseUrl),
      );
      updates.licenseUrl = await this.storageService.uploadFile(
        files.license,
        'licenses',
      );
    }

    // If rejected, reset to pending for re-review
    if (lawyer.status === LawyerStatus.REJECTED && Object.keys(updates).length > 0) {
      (updates as any)['status'] = LawyerStatus.PENDING;
      (updates as any)['rejectionReason'] = null;
    }

    const updatedLawyer = await this.prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: updates,
      select: {
        id: true,
        photoUrl: true,
        diplomaUrl: true,
        licenseUrl: true,
        status: true,
        updatedAt: true,
      },
    });

    return updatedLawyer;
  }

  async getRequests(
    lawyerId: string,
    options: {
      status?: RequestStatus;
      page?: number;
      limit?: number;
    },
  ) {
    // Verify lawyer is approved
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { status: true },
    });

    if (!lawyer || lawyer.status !== LawyerStatus.APPROVED) {
      throw new ForbiddenException('You must be approved to view requests');
    }

    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const { status } = options;
    const skip = (page - 1) * limit;

    // Only show NEW requests that are not assigned to anyone
    const baseWhere = {
      status: status || RequestStatus.NEW,
      assignedLawyerId: null,
    };

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          description: true,
          budget: true,
          currency: true,
          contactName: true,
          preferredContact: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.request.count({ where: baseWhere }),
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

  async getRequestDetails(lawyerId: string, requestId: string) {
    // Verify lawyer is approved
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { status: true },
    });

    if (!lawyer || lawyer.status !== LawyerStatus.APPROVED) {
      throw new ForbiddenException('You must be approved to view requests');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Don't show contact details for spam or closed requests
    if (
      request.status === RequestStatus.SPAM ||
      request.status === RequestStatus.CLOSED
    ) {
      throw new ForbiddenException('This request is no longer available');
    }

    return request;
  }

  async takeRequest(lawyerId: string, requestId: string) {
    // Verify lawyer is approved
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { status: true, fullName: true },
    });

    if (!lawyer || lawyer.status !== LawyerStatus.APPROVED) {
      throw new ForbiddenException('You must be approved to take requests');
    }

    // Get the request
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check if request is available (NEW status and not assigned)
    if (request.status !== RequestStatus.NEW) {
      throw new BadRequestException('This request is not available for taking');
    }

    if (request.assignedLawyerId) {
      throw new BadRequestException('This request is already taken by another lawyer');
    }

    // Assign the request to the lawyer
    const updatedRequest = await this.prisma.request.update({
      where: { id: requestId },
      data: {
        assignedLawyerId: lawyerId,
        assignedAt: new Date(),
        status: RequestStatus.IN_PROGRESS,
      },
    });

    return {
      message: 'Request taken successfully',
      request: {
        id: updatedRequest.id,
        requestNumber: updatedRequest.requestNumber,
        status: updatedRequest.status,
        assignedAt: updatedRequest.assignedAt,
      },
    };
  }

  async releaseRequest(lawyerId: string, requestId: string) {
    // Verify lawyer is approved
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { status: true },
    });

    if (!lawyer || lawyer.status !== LawyerStatus.APPROVED) {
      throw new ForbiddenException('You must be approved to manage requests');
    }

    // Get the request
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check if this lawyer owns the request
    if (request.assignedLawyerId !== lawyerId) {
      throw new ForbiddenException('You can only release requests assigned to you');
    }

    // Release the request
    const updatedRequest = await this.prisma.request.update({
      where: { id: requestId },
      data: {
        assignedLawyerId: null,
        assignedAt: null,
        status: RequestStatus.NEW,
      },
    });

    return {
      message: 'Request released successfully',
      request: {
        id: updatedRequest.id,
        requestNumber: updatedRequest.requestNumber,
        status: updatedRequest.status,
      },
    };
  }

  async getMyRequests(
    lawyerId: string,
    options: {
      page?: number;
      limit?: number;
    },
  ) {
    // Verify lawyer is approved
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { status: true },
    });

    if (!lawyer || lawyer.status !== LawyerStatus.APPROVED) {
      throw new ForbiddenException('You must be approved to view requests');
    }

    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { assignedLawyerId: lawyerId };

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          description: true,
          budget: true,
          currency: true,
          contactName: true,
          phone: true,
          email: true,
          preferredContact: true,
          status: true,
          assignedAt: true,
          createdAt: true,
        },
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
}
