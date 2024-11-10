import type { OpenAPIHono } from "@hono/zod-openapi";
import { type EmailResponseSchema, getEmailRoute, sendEmailRoute } from "./email.doc";

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();
import { Resource } from "sst";
import { getTemplate } from "./templates";

export const emailRoutes = (app: OpenAPIHono) => {
  app.openapi(getEmailRoute, (c) => {
    const { name } = c.req.valid("query");
    return c.json({
      message: `Hello! ${name}`,
    });
  });

  app.openapi(sendEmailRoute, async (c) => {
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

      return c.json({
        success: true,
        messageId: emailResponse.MessageId,
        message: "Email sent successfully",
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
  });

  return app;
};

export type EmailRoutes = ReturnType<typeof emailRoutes>;
