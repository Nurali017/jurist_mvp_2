import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { LawyerStatus } from '@prisma/client';

@Injectable()
export class ApprovedLawyerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.userType !== 'lawyer') {
      throw new ForbiddenException('Lawyer access required');
    }

    if (user.status !== LawyerStatus.APPROVED) {
      throw new ForbiddenException('Your account is not approved yet');
    }

    return true;
  }
}
