// src/services/emailService.ts
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
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
}
