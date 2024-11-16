import type { OpenAPIHono } from "@hono/zod-openapi";
import {
  getEmailEventsRoute,
  getEmailRoute,
  sendEmailRoute,
  getIncomingEmailsRoute,
  getIncomingEmailRoute,
  downloadAttachmentRoute,
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

        if (!result.success) {
          return c.json({
            success: false,
            message: result.message ?? result.code ?? "Failed to send email",
          }, 400);
        }


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
    })
    .openapi(getIncomingEmailsRoute, async (c) => {
      try {
        const emails = await emailService.getAllIncomingEmails();
        return c.json({ emails }, 200);
      } catch (error) {
        console.error("Error fetching incoming emails:", error);
        return c.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          500
        );
      }
    })
    .openapi(getIncomingEmailRoute, async (c) => {
      const id = c.req.valid("param").id;

      try {
        const email = await emailService.getIncomingEmailDetails(id);
        return c.json(email, 200);
      } catch (error) {
        console.error("Error fetching incoming email details:", error);
        return c.json(
          {
            error: error instanceof Error ? error.message : "Internal server error",
          },
          error instanceof Error && error.message.includes("not found") ? 404 : 500
        );
      }
    })
    .openapi(downloadAttachmentRoute, async (c) => {
      const attachmentId = c.req.valid("param").attachmentId;
    
      try {
        const { data, filename, contentType } = await emailService.downloadAttachment(attachmentId);
    
        return new Response(data, {
          headers: {
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Type": contentType,
          }
        }) as any;
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json(
            { error: error.message },
            404
          );
        }
        
        console.error("Error downloading attachment:", error);
        return c.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          500
        );
      }
    });
};

export type EmailRoutes = ReturnType<typeof emailRoutes>;
