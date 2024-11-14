import type { SQSEvent } from "aws-lambda";
import { eq } from "drizzle-orm";
import db from "./modules/db/db";
import { emailTable, eventTable } from "./modules/db/schema";
import { EmailService } from "./modules/emails/email.service";

export const handler = async (event: SQSEvent) => {
  const emailService = new EmailService();
  try {
    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.body);
      const message = JSON.parse(snsMessage.Message);
      const messageId = message.mail?.messageId;

      if (!messageId) {
        console.error("No messageId found in event:", message);
        continue;
      }

      try {
        // Handle bounce events
        if (message.eventType === "Bounce") {
          await emailService.handleBounce(messageId, message);
        }
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
