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

  async sendNewRequestNotificationToLawyers(
    lawyerEmails: string[],
    requestNumber: string,
    description: string,
    budget: string,
  ): Promise<void> {
    const shortDescription = description.length > 200
      ? description.substring(0, 200) + '...'
      : description;

    for (const email of lawyerEmails) {
      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject: `Новая заявка #${requestNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Новая заявка!</h2>
              <p>Поступила новая заявка <strong>#${requestNumber}</strong></p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;">
                <p><strong>Бюджет:</strong> ${budget}</p>
                <p><strong>Описание:</strong> ${shortDescription}</p>
              </div>
              <a href="${this.frontendUrl}/ru/dashboard"
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                Посмотреть заявку
              </a>
              <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
                Войдите в личный кабинет, чтобы взять заявку в работу.
              </p>
            </div>
          `,
        });
        this.logger.log(`New request notification sent to ${email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send new request notification to ${email}`,
          error,
        );
        // Don't throw - continue sending to other lawyers
      }
    }
  }

  async sendNewRequestNotificationToAdmin(
    requestNumber: string,
    description: string,
    contactName: string,
    phone: string,
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'a.bastaubayev@gmail.com';
    const shortDescription = description.length > 300
      ? description.substring(0, 300) + '...'
      : description;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: adminEmail,
        subject: `[Admin] Новая заявка #${requestNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Новая заявка на платформе</h2>
            <p>Поступила новая заявка <strong>#${requestNumber}</strong></p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
              <p><strong>Клиент:</strong> ${contactName}</p>
              <p><strong>Телефон:</strong> ${phone}</p>
              <p><strong>Описание:</strong> ${shortDescription}</p>
            </div>
            <a href="${this.frontendUrl}/ru/admin/requests"
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              Открыть админ-панель
            </a>
          </div>
        `,
      });
      this.logger.log(`Admin notification sent to ${adminEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send admin notification`, error);
      // Don't throw - this is a non-critical notification
    }
  }

  async sendNewLawyerNotificationToAdmin(
    lawyerEmail: string,
    fullName: string,
    lawyerType: string,
    phone: string,
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'a.bastaubayev@gmail.com';
    const typeLabel = lawyerType === 'ADVOCATE' ? 'Адвокат' : 'Юридический консультант';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: adminEmail,
        subject: `[Admin] Новая регистрация юриста`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Новая регистрация юриста</h2>
            <p>На платформе зарегистрировался новый юрист и ожидает проверки.</p>
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;">
              <p><strong>ФИО:</strong> ${fullName}</p>
              <p><strong>Тип:</strong> ${typeLabel}</p>
              <p><strong>Email:</strong> ${lawyerEmail}</p>
              <p><strong>Телефон:</strong> ${phone}</p>
            </div>
            <a href="${this.frontendUrl}/ru/admin/lawyers"
               style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              Проверить документы
            </a>
          </div>
        `,
      });
      this.logger.log(`New lawyer notification sent to admin`);
    } catch (error) {
      this.logger.error(`Failed to send new lawyer notification to admin`, error);
      // Don't throw - this is a non-critical notification
    }
  }
}
