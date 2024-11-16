import { desc, eq } from "drizzle-orm";
import db from "../db/db";
import { bouncedEmailTable, emailTable, eventTable, incomingAttachmentTable, incomingEmailTable } from "../db/schema";
import type { EmailRequest } from "./email.doc";
import type { EmailEvent } from "./email.types";
import type { Attachment, ParsedMail } from "mailparser";

export class EmailRepository {
  async createEmail(email: string, messageId: string, data: EmailRequest) {
    const result = await db
      .insert(emailTable)
      .values({
        email,
        messageId,
        data: JSON.stringify(data),
      })
      .returning({ insertedId: emailTable.id });

    return result[0].insertedId;
  }

  async getEmailEvents(messageId: string): Promise<EmailEvent[]> {
    const events = await db
      .select()
      .from(eventTable)
      .where(eq(eventTable.messageId, messageId))
      .orderBy(eventTable.timestamp)
      .all();

    return events.map((event) => ({
      type: event.type,
      timestamp: event.timestamp,
      data: JSON.parse(event.data ?? "{}"),
    }));
  }

  async addBouncedEmail(email: string, reason: string, bounceType: string) {
    await db
      .insert(bouncedEmailTable)
      .values({
        email,
        reason,
        bounceType,
      })
      .onConflictDoUpdate({ target: [bouncedEmailTable.email], set: { reason, bounceType, lastBounceAt: new Date() } })

  }

  async isEmailBounced(email: string): Promise<boolean> {
    const result = await db
      .select()
      .from(bouncedEmailTable)
      .where(eq(bouncedEmailTable.email, email))
      .get();

    return !!result;
  }

  async createIncomingEmail(email: ParsedMail, s3Key: string, s3Bucket: string) {
    const [insertedEmail] = await db
      .insert(incomingEmailTable)
      .values({
        from: email.from?.text || '',
        fromName: email.from?.value?.[0]?.name || null,
        to: JSON.stringify(Array.isArray(email.to) ? email.to.map((to: any) => to.address) : email.to?.value?.map((to: any) => to.address) || []),
        subject: email.subject || null,
        text: email.text || null,
        html: email.html || null,
        s3Key: s3Key,
        s3Bucket: s3Bucket,
        attachmentCount: email.attachments.length,
        metadata: JSON.stringify({
          headers: email.headers,
          messageId: email.messageId,
          date: email.date,
        }),
      })
      .returning({ insertedId: incomingEmailTable.id });

    return insertedEmail.insertedId;
  }

  async createIncomingAttachments(emailId: number, attachments: Attachment[], baseS3Key: string) {
    const attachmentPromises = attachments.map(attachment => {
      return db
        .insert(incomingAttachmentTable)
        .values({
          emailId: emailId,
          filename: attachment.filename || null,
          contentType: attachment.contentType || null,
          size: attachment.size,
          s3Key: `${baseS3Key}/attachments/${attachment.filename}`,
        });
    });

    await Promise.all(attachmentPromises);
  }

  async getIncomingEmail(id: number) {
    const email = await db
      .select()
      .from(incomingEmailTable)
      .where(eq(incomingEmailTable.id, id))
      .get();

    if (!email) return null;

    return {
      ...email,
      to: JSON.parse(email.to),
      metadata: email.metadata ? JSON.parse(email.metadata) : null,
    };
  }

  async getIncomingEmailAttachments(emailId: number) {
    return db
      .select()
      .from(incomingAttachmentTable)
      .where(eq(incomingAttachmentTable.emailId, emailId))
      .all();
  }

  async getIncomingEmailByS3Key(s3Key: string) {
    const email = await db
      .select()
      .from(incomingEmailTable)
      .where(eq(incomingEmailTable.s3Key, s3Key))
      .get();

    if (!email) return null;

    return {
      ...email,
      to: JSON.parse(email.to),
      metadata: email.metadata ? JSON.parse(email.metadata) : null,
    };
  }

  async getAllIncomingEmails() {
    const emails = await db
      .select()
      .from(incomingEmailTable)
      .orderBy(desc(incomingEmailTable.createdAt))
      .all();

    return emails.map(email => ({
      ...email,
      to: JSON.parse(email.to),
      metadata: email.metadata ? JSON.parse(email.metadata) : null,
    }));
  }

  async getAttachment(id: number) {
    return db
      .select()
      .from(incomingAttachmentTable)
      .where(eq(incomingAttachmentTable.id, id))
      .get();
  }
}
