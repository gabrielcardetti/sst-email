import type { OpenAPIHono } from "@hono/zod-openapi";
import {
  getEmailEventsRoute,
  getEmailRoute,
  sendEmailRoute,
} from "./email.doc";
import { EmailService } from "./email.service";

export const emailRoutes = (app: OpenAPIHono) => {
  const emailService = new EmailService();

  return app
    .openapi(getEmailRoute, (c) => {
      const { name } = c.req.valid("query");
      return c.json({
        message: `Hello! ${name}`,
      });
    })
    .openapi(sendEmailRoute, async (c) => {
      try {
        const emailData = c.req.valid("json");
        const result = await emailService.sendEmail(emailData);
        return c.json({
          ...result,
          message: "Email sent successfully",
        });
      } catch (error) {
        console.error("Error sending email:", error);
        return c.json(
          {
            success: false,
            message:
              error instanceof Error ? error.message : "Failed to send email",
          },
          500,
        );
      }
    })
    .openapi(getEmailEventsRoute, async (c) => {
      const messageId = c.req.param("messageId");

      try {
        const result = await emailService.getEmailEvents(messageId);
        return c.json(result, 200);
      } catch (error) {
        console.error("Error fetching events:", error);
        return c.json(
          {
            error:
              error instanceof Error ? error.message : "Internal server error",
          },
          error instanceof Error && error.message.includes("No events found")
            ? 404
            : 500,
        );
      }
    });
};

export type EmailRoutes = ReturnType<typeof emailRoutes>;
