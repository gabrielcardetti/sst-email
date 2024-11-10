import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

export const EmailTemplateType = z.enum([
  "welcome",
  "forgot-password",
  "magic-link"
]);

const TemplateData = {
  welcome: z.object({
    userName: z.string(),
    websiteUrl: z.string().url(),
  }),
  'forgot-password': z.object({
    resetToken: z.string(),
    expirationMinutes: z.number(),
  }),
  'magic-link': z.object({
    loginToken: z.string(),
    expirationMinutes: z.number(),
  }),
} as const;

// Export types for each template data
export type WelcomeTemplateData = z.infer<typeof TemplateData.welcome>;
export type ForgotPasswordTemplateData = z.infer<typeof TemplateData['forgot-password']>;
export type MagicLinkTemplateData = z.infer<typeof TemplateData['magic-link']>;

const BaseEmailSchema = z.object({
  to: z.string().email('Invalid email format'),
  templateName: z.enum(['welcome', 'forgot-password', 'magic-link']),
  language: z.enum(['en', 'es']).default('en'),
});

export const EmailRequestSchema = BaseEmailSchema.and(
  z.discriminatedUnion('templateName', [
    z.object({ templateName: z.literal('welcome'), data: TemplateData.welcome }),
    z.object({ templateName: z.literal('forgot-password'), data: TemplateData['forgot-password'] }),
    z.object({ templateName: z.literal('magic-link'), data: TemplateData['magic-link'] }),
  ])
);

export type EmailRequest = z.infer<typeof EmailRequestSchema>;

// Schema for the email response
export const EmailResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  message: z.string()
});

const tags = ['Email'];

export const getEmailRoute = createRoute({
  method: 'get',
  path: '/email',
  request: {
    query: z.object({
      name: z.string().describe('The name to say hello to')
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string()
          })
        }
      },
      description: 'Success'
    }
  },
  tags,
  description: 'Get a hello message with the provided name'
});

export const sendEmailRoute = createRoute({
  method: 'post',
  path: '/email/send',
  request: {
    body: {
      content: {
        'application/json': {
          schema: EmailRequestSchema
        }
      },
      description: 'Email details'
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: EmailResponseSchema
        }
      },
      description: 'Email sent successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: EmailResponseSchema
        }
      },
      description: 'Invalid request parameters'
    },
    500: {
      content: {
        'application/json': {
          schema: EmailResponseSchema
        }
      },
      description: 'Server error while sending email'
    }
  },
  tags,
  description: 'Send an email to the specified destination'
});
