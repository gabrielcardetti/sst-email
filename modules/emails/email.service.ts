// src/services/emailService.ts
import { SESv2Client, SendEmailCommand, CreateEmailTemplateCommand, CreateCustomVerificationEmailTemplateCommand, type CreateCustomVerificationEmailTemplateRequest, CreateEmailIdentityCommand } from "@aws-sdk/client-sesv2";
import { Resource } from "sst";
import { EmailRepository } from "./email.repository";
import { getTemplate } from "./templates";
import type { EmailRequest, IncomingEmailDetailResponse, IncomingEmailResponse } from "./email.doc";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export class EmailService {
  private sesClient: SESv2Client;
  private emailRepository: EmailRepository;
  private s3Client = new S3Client();

  constructor() {
    this.sesClient = new SESv2Client();
    this.emailRepository = new EmailRepository();
  }

  async sendEmail(emailData: EmailRequest) {
    const isBounced = await this.emailRepository.isEmailBounced(emailData.to);
    if (isBounced) {
      return {
        success: false,
        message: "This email address has previously bounced and cannot receive emails",
        code: "EMAIL_BOUNCED",
      }
    }

    const emailTemplate = await getTemplate(emailData);

    console.log("Sending email", emailData);

    const command = new SendEmailCommand({
      FromEmailAddress: `noreply@${Resource.cafecafe.sender}`,
      Destination: {
        ToAddresses: ["gabicardetti@gmail.com"],
      },
      Content: {
        Simple: {
          Subject: {
            Data: "Hello World!",
          },
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: emailTemplate.html,
            },
            Text: {
              Charset: "UTF-8",
              Data: emailTemplate.text,
            },
          },
        },
      },
    });

    const response = await this.sesClient.send(command);

    if (!response.MessageId) {
      throw new Error("Failed to send email");
    }

    console.log("Email sent", response.MessageId);

    const emailId = await this.emailRepository.createEmail(
      emailData.to,
      response.MessageId,
      emailData,
    );

    console.log("Email saved", emailId);

    return {
      success: true,
      messageId: response.MessageId,
      emailId,
    };
  }

  async getEmailEvents(messageId: string) {
    const events = await this.emailRepository.getEmailEvents(messageId);

    if (events.length === 0) {
      throw new Error(`No events found for message ID: ${messageId}`);
    }

    return {
      messageId,
      events,
    };
  }

  async handleBounce(messageId: string, bounceData: any) { // TODO: add bounceData type
    const bouncedRecipients = bounceData.bounce?.bouncedRecipients || [];

    for (const recipient of bouncedRecipients) {
      await this.emailRepository.addBouncedEmail(
        recipient.emailAddress,
        recipient.diagnosticCode || "Unknown reason",
        bounceData.bounce.bounceType,
      );
    }
  }

  async getAllIncomingEmails(): Promise<IncomingEmailResponse[]> {
    const emails = await this.emailRepository.getAllIncomingEmails();
    return emails.map(email => ({
      ...email,
      createdAt: email.createdAt.toISOString(),
      attachmentCount: email.attachmentCount ?? 0,
    }));
  }

  async getIncomingEmailDetails(id: number): Promise<IncomingEmailDetailResponse> {
    const email = await this.emailRepository.getIncomingEmail(id);
    if (!email) {
      throw new Error("Incoming email not found");
    }

    const attachments = await this.emailRepository.getIncomingEmailAttachments(id);

    return {
      ...email,
      createdAt: email.createdAt.toISOString(),
      attachmentCount: email.attachmentCount ?? 0,
      attachments: attachments.map(attachment => ({
        ...attachment,
        createdAt: attachment.createdAt.toISOString(),
      })),
    };
  }

  async downloadAttachment(attachmentId: number): Promise<{
    data: Buffer;
    filename: string;
    contentType: string;
  }> {
    const attachment = await this.emailRepository.getAttachment(attachmentId);
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    console.log("Downloading attachment", attachment.s3Key);
    console.log(Resource["incoming-emails-v2"].name);
    console.log(attachment);
    const command = new GetObjectCommand({
      Bucket: Resource["incoming-emails-v2"].name,
      Key: attachment.s3Key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error("Failed to get attachment from S3");
    }

    // Convert the response body to a Buffer
    const data = await response.Body.transformToByteArray();

    return {
      data: Buffer.from(data),
      filename: attachment.filename || 'download',
      contentType: attachment.contentType || 'application/octet-stream',
    };
  }

  /* 
  *
  * https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html#send-email-verify-address-custom-creating
  * https://docs.aws.amazon.com/ses/latest/APIReference/API_CreateCustomVerificationEmailTemplate.html
  * Note: To use this feature, your Amazon SES account has to be out of the sandbox. For more information, see Request production access (Moving out of the Amazon SES sandbox).
   */
  async createCustomVerificationEmailTemplate() {
    const templateParams: CreateCustomVerificationEmailTemplateRequest = {
      TemplateName: "ModernVerificationTemplate",
      FromEmailAddress: "verification@cafecafe.com.ar", // TODO: get domain from config
      TemplateSubject: "Verify Your Email Address",
      TemplateContent: `
        <html>
        <body style="margin: 0; padding: 40px 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
            <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; width: 100%;">
                <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                        <h1 style="color: #2b3481; font-size: 24px; font-weight: 600; margin: 0;">
                            Your Company Name
                        </h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px 40px;">
                        <h2 style="color: #2b3481; font-size: 20px; font-weight: 600; margin: 0 0 20px; text-align: center;">
                            Verify Your Email Address
                        </h2>
                        <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px; text-align: center;">
                            Thank you for signing up! To complete your registration and ensure the security of your account, please verify your email address by clicking the link below:
                        </p>
                        <div style="margin: 30px 0; text-align: center;">
                            <p style="background-color: #5c6bc0; padding: 12px 30px; color: #ffffff; text-decoration: none; display: inline-block; font-size: 16px;">
                                
                            </p>
                        </div>
                        <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0; text-align: center;">
                            This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 40px; text-align: center;">
                        <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0;">
                            Your Company Name. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
      SuccessRedirectionURL: "https://yourdomain.com/verification-success",
      FailureRedirectionURL: "https://yourdomain.com/verification-failure"
    };

    try {
      const response = await this.sesClient.send(new CreateCustomVerificationEmailTemplateCommand(templateParams));
      console.log(response);
      console.log('Template created successfully');
      return response;
    } catch (error) {
      console.error('Error creating template:', error);
      return error
    }
  }

  async verifyEmail(email: string) {
    try {
      const command = new CreateEmailIdentityCommand({
        EmailIdentity: email,
      });

      const response = await this.sesClient.send(command);

      return {
        success: true,
        message: "Verification email sent successfully",
        identityType: response.IdentityType,
        response: response,
      };
    } catch (error) {
      console.error("Error verifying email:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to verify email",
      };
    }
  }
}
