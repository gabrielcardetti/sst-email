import type { SQSEvent } from "aws-lambda";
import { eq } from "drizzle-orm";
import db from "./modules/db/db";
import { emailTable, eventTable } from "./modules/db/schema";

export const handler = async (event: SQSEvent) => {
  try {
    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.body);
      const message = JSON.parse(snsMessage.Message);
      const messageId = message.mail?.messageId;

      if (!messageId) {
        console.error("No messageId found in event:", message);
        continue;
      }

      const emailRecord = await db
        .select()
        .from(emailTable)
        .where(eq(emailTable.messageId, messageId))
        .get();

      if (!emailRecord) {
        console.error(`No email record found for messageId: ${messageId}`);
        throw new Error(`No email record found for messageId: ${messageId}`);
      }

      try {
        // Store event in the events table
        await db
          .insert(eventTable)
          .values({
            messageId,
            type: message.eventType,
            timestamp: message.mail?.timestamp || new Date().toISOString(),
            data: JSON.stringify(message),
          })
          .run();

        // Update the email record with the new event data
        const currentData = JSON.parse(emailRecord.data || "{}");
        const updatedData = {
          ...currentData,
          events: [
            ...(currentData.events || []),
            {
              type: message.eventType,
              timestamp: message.mail?.timestamp || new Date().toISOString(),
              data: message,
            },
          ],
        };

        await db
          .update(emailTable)
          .set({ data: JSON.stringify(updatedData) })
          .where(eq(emailTable.messageId, messageId))
          .run();

        console.log(
          `Successfully processed ${message.eventType} event for messageId: ${messageId}`,
        );
      } catch (error) {
        console.error(
          `Error updating record for messageId: ${messageId}`,
          error,
        );
        throw error;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Events processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing SQS events:", error);
    throw error;
  }
};
