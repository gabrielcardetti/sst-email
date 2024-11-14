// src/services/emailService.ts
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Resource } from "sst";
import { EmailRepository } from "./email.repository";
import { getTemplate } from "./templates";
import type { EmailRequest } from "./email.doc";

export class EmailService {
  private sesClient: SESv2Client;
  private emailRepository: EmailRepository;

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
}
