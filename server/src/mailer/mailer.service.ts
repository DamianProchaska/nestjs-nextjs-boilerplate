import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private ses: AWS.SES;

  constructor(private configService: ConfigService) {
    this.ses = new AWS.SES({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async sendMagicLinkAndOTP(email: string, magicLink: string, otp: string): Promise<void> {
    const emailContent = `
      <p>Click here to log in: <a href="${magicLink}">Login</a></p>
      <p>Or use the OTP: <strong>${otp}</strong></p>
      <p>This OTP is valid for 15 minutes.</p>
    `;

    const params = {
      Source: this.configService.get<string>('EMAIL_FROM'),
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Your Magic Link and OTP',
        },
        Body: {
          Html: {
            Data: emailContent,
          },
        },
      },
    };

    try {
      await this.ses.sendEmail(params).promise();
    } catch (error) {
      console.error(`Failed to send email to ${email}`, error);
      throw new Error('Error sending email');
    }
  }
}