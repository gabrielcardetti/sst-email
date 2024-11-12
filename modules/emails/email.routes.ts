import type { OpenAPIHono } from "@hono/zod-openapi";
import { getEmailEventsRoute, getEmailRoute, sendEmailRoute } from "./email.doc";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();
import { Resource } from "sst";
import { getTemplate } from "./templates";
import db from "../db/db";
import { emailTable, eventTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const emailRoutes = (app: OpenAPIHono) => {
  return app
    .openapi(getEmailRoute, (c) => {
      const { name } = c.req.valid("query");
      return c.json({
        message: `Hello! ${name}`,
      });
    })
    .openapi(sendEmailRoute, async (c) => {
      try {
        const body = c.req.valid("json");
        const emailTemplate = await getTemplate(body);

        console.log("Sending email...");
        console.log("client", Resource.cafecafe.sender);
        const emailResponse = await client.send(
          new SendEmailCommand({
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
          })
        );

        const emailData = c.req.valid("json");

        console.log("Sending email to:", emailData.to);

        if (!emailResponse.MessageId) {
          return c.json(
            {
              success: false,
              message: "Failed to send email",
            },
            500
          );
        }

        const insertResult = await db.insert(emailTable).values({
          email: emailData.to,
          messageId: emailResponse.MessageId,
          data: JSON.stringify(emailData),
        }).returning({ insertedId: emailTable.id });

        const emailId = insertResult[0].insertedId;

        return c.json({
          success: true,
          messageId: emailResponse.MessageId,
          message: "Email sent successfully",
          emailId,
        });
      } catch (error) {
        // Error handling
        return c.json(
          {
            success: false,
            message: error instanceof Error ? error.message : "Failed to send email",
          },
          500
        );
      }
    })
    .openapi(getEmailEventsRoute, async (c) => {
      const messageId = c.req.param('messageId');

      try {
        const events = await db
          .select()
          .from(eventTable)
          .where(eq(eventTable.messageId, messageId))
          .orderBy(eventTable.timestamp)
          .all();

        if (events.length === 0) {
          return c.json(
            { error: `No events found for message ID: ${messageId}` },
            404
          );
        }

        const formattedEvents = events.map(event => ({
          type: event.type,
          timestamp: event.timestamp,
          data: JSON.parse(event.data ?? "{}")
        }));

        return c.json({
          messageId,
          events: formattedEvents
        }, 200);

      } catch (error) {
        console.error('Error fetching events:', error);
        return c.json(
          { error: 'Internal server error' },
          500
        );
      }
    });
};

export type EmailRoutes = ReturnType<typeof emailRoutes>;
