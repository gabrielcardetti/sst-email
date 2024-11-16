import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

export const EmailTemplateType = z.enum([
  "welcome",
  "forgot-password",
  "magic-link",
]);

const TemplateData = {
  welcome: z.object({
    userName: z.string(),
    websiteUrl: z.string().url(),
  }),
  "forgot-password": z.object({
    resetToken: z.string(),
    expirationMinutes: z.number(),
  }),
  "magic-link": z.object({
    loginToken: z.string(),
    expirationMinutes: z.number(),
  }),
} as const;

// Export types for each template data
export type WelcomeTemplateData = z.infer<typeof TemplateData.welcome>;
export type ForgotPasswordTemplateData = z.infer<
  (typeof TemplateData)["forgot-password"]
>;
export type MagicLinkTemplateData = z.infer<
  (typeof TemplateData)["magic-link"]
>;

const BaseEmailSchema = z.object({
  to: z.string().email("Invalid email format"),
  templateName: z.enum(["welcome", "forgot-password", "magic-link"]),
  language: z.enum(["en", "es"]).default("en"),
});

export const EmailRequestSchema = BaseEmailSchema.and(
  z.discriminatedUnion("templateName", [
    z.object({
      templateName: z.literal("welcome"),
      data: TemplateData.welcome,
    }),
    z.object({
      templateName: z.literal("forgot-password"),
      data: TemplateData["forgot-password"],
    }),
    z.object({
      templateName: z.literal("magic-link"),
      data: TemplateData["magic-link"],
    }),
  ]),
);

export type EmailRequest = z.infer<typeof EmailRequestSchema>;

// Schema for the email response
export const EmailResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  message: z.string(),
  emailId: z.number().optional(),
});

const tags = ["Email"];

export const getEmailRoute = createRoute({
  method: "get",
  path: "/email",
  request: {
    query: z.object({
      name: z.string().describe("The name to say hello to"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Success",
    },
  },
  tags,
  description: "Get a hello message with the provided name",
});

export const sendEmailRoute = createRoute({
  method: "post",
  path: "/email/send",
  request: {
    body: {
      content: {
        "application/json": {
          schema: EmailRequestSchema,
        },
      },
      description: "Email details",
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EmailResponseSchema,
        },
      },
      description: "Email sent successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: EmailResponseSchema,
        },
      },
      description: "Invalid request parameters",
    },
    500: {
      content: {
        "application/json": {
          schema: EmailResponseSchema,
        },
      },
      description: "Server error while sending email",
    },
  },
  tags,
  description: "Send an email to the specified destination",
});

export const EmailEventSchema = z.object({
  type: z.string(),
  timestamp: z.string(),
  data: z.any(),
});

export const EmailEventsResponseSchema = z.object({
  messageId: z.string(),
  events: z.array(EmailEventSchema),
});

export const getEmailEventsRoute = createRoute({
  method: "get",
  path: "/email/{messageId}/events",
  request: {
    params: z.object({
      messageId: z.string().describe("The message ID to fetch events for"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EmailEventsResponseSchema,
        },
      },
      description: "Successfully retrieved email events",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Message ID not found",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Server error while fetching events",
    },
  },
  tags,
  description: "Get all events for a specific email message ID",
});

// Add these schemas after the existing ones
export const IncomingEmailResponse = z.object({
  id: z.number(),
  from: z.string(),
  fromName: z.string().nullable(),
  to: z.array(z.string()),
  subject: z.string().nullable(),
  text: z.string().nullable(),
  html: z.string().nullable(),
  s3Key: z.string(),
  s3Bucket: z.string(),
  attachmentCount: z.number(),
  createdAt: z.string(),
  metadata: z.record(z.any()).nullable(),
});

export type IncomingEmailResponse = z.infer<typeof IncomingEmailResponse>;

export const IncomingAttachmentSchema = z.object({
  id: z.number(),
  filename: z.string().nullable(),
  contentType: z.string().nullable(),
  size: z.number(),
  s3Key: z.string(),
  createdAt: z.string(),
});

export const IncomingEmailDetailResponse = IncomingEmailResponse.extend({
  attachments: z.array(IncomingAttachmentSchema),
});

export type IncomingEmailDetailResponse = z.infer<typeof IncomingEmailDetailResponse>;

export const getIncomingEmailsRoute = createRoute({
  method: "get",
  path: "/email/incoming",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            emails: z.array(IncomingEmailResponse)
          }),
        },
      },
      description: "Successfully retrieved incoming emails",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Server error while fetching incoming emails",
    },
  },
  tags,
  description: "Get all incoming emails",
});

export const getIncomingEmailRoute = createRoute({
  method: "get",
  path: "/email/incoming/{id}",
  request: {
    params: z.object({
      id: z.string().transform((val) => parseInt(val, 10)),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: IncomingEmailDetailResponse,
        },
      },
      description: "Successfully retrieved incoming email details",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Incoming email not found",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Server error while fetching incoming email details",
    },
  },
  tags,
  description: "Get detailed information about a specific incoming email",
});

export const downloadAttachmentRoute = createRoute({
  method: "get",
  path: "/email/attachment/{attachmentId}/download",
  request: {
    params: z.object({
      attachmentId: z.string().transform((val) => parseInt(val, 10)),
    }),
  },
  responses: {
    200: {
      content: {
        "*/*": {
          schema: z.any().openapi({
            type: "string",
            format: "binary"
          })
        },
      },
      headers: z.object({
        "Content-Disposition": z.string().openapi({
          example: 'attachment; filename="example.pdf"',
          description: "Indicates file should be downloaded and specifies filename"
        }),
        "Content-Type": z.string().openapi({
          example: "application/pdf",
          description: "MIME type of the attachment"
        }),
      }),
      description: "Successfully downloaded the attachment",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({
              example: "Attachment not found",
              description: "Error message describing why the attachment couldn't be found"
            }),
          }),
        },
      },
      description: "Attachment not found",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({
              example: "Internal server error",
              description: "Error message describing the server error"
            }),
          }),
        },
      },
      description: "Server error while downloading attachment",
    },
  },
  tags,
  description: "Download an email attachment",
});