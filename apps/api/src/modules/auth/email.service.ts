import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    const fromName = process.env.EMAIL_FROM_NAME || 'Jurist';
    const fromAddress = process.env.EMAIL_FROM || 'noreply@example.com';
    this.fromEmail = `${fromName} <${fromAddress}>`;
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async sendApprovalEmail(email: string, fullName: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Ваша заявка одобрена! ✓',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Поздравляем, ${fullName}!</h2>
            <p>Ваша заявка на регистрацию в качестве юриста была <strong>одобрена</strong>.</p>
            <p>Теперь вы можете войти в систему и начать принимать заявки от клиентов.</p>
            <a href="${this.frontendUrl}/ru/login"
               style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              Войти в систему
            </a>
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              Если у вас есть вопросы, свяжитесь с нами.
            </p>
          </div>
        `,
      });
      this.logger.log(`Approval email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send approval email to ${email}`, error);
      throw error;
    }
  }

  async sendRejectionEmail(
    email: string,
    fullName: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Заявка отклонена',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Здравствуйте, ${fullName}</h2>
            <p>К сожалению, ваша заявка на регистрацию в качестве юриста была <strong>отклонена</strong>.</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0;">
              <strong>Причина:</strong> ${reason}
            </div>
            <p>Вы можете исправить указанные проблемы и подать заявку повторно.</p>
            <a href="${this.frontendUrl}/ru/register"
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              Подать заявку повторно
            </a>
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              Если у вас есть вопросы, свяжитесь с нами.
            </p>
          </div>
        `,
      });
      this.logger.log(`Rejection email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send rejection email to ${email}`, error);
      throw error;
    }
  }

  async sendRequestConfirmationEmail(
    email: string,
    contactName: string,
    requestNumber: string,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Заявка #${requestNumber} принята`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Здравствуйте, ${contactName}!</h2>
            <p>Ваша заявка <strong>#${requestNumber}</strong> успешно принята.</p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
              Наши юристы рассмотрят вашу заявку и свяжутся с вами в ближайшее время.
            </div>
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              Спасибо, что выбрали нас!
            </p>
          </div>
        `,
      });
      this.logger.log(`Request confirmation sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send request confirmation to ${email}`,
        error,
      );
      throw error;
    }
  }
}
