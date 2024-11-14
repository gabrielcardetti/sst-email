import { eq } from "drizzle-orm";
import db from "../db/db";
import { emailTable, eventTable } from "../db/schema";
import type { EmailRequest } from "./email.doc";
import type { EmailEvent } from "./email.types";

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
}
