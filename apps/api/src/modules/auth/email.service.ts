import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendApprovalEmail(email: string, fullName: string): Promise<void> {
    this.logger.log(`[APPROVAL] ${email} - ${fullName} одобрен`);
  }

  async sendRejectionEmail(
    email: string,
    fullName: string,
    reason: string,
  ): Promise<void> {
    this.logger.log(`[REJECTION] ${email} - ${fullName} отклонён: ${reason}`);
  }

  async sendRequestConfirmationEmail(
    email: string,
    contactName: string,
    requestNumber: string,
  ): Promise<void> {
    this.logger.log(`[REQUEST] ${email} - ${contactName}, заявка ${requestNumber}`);
  }
}
