import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

export const EmailRequestSchema = z.object({
  to: z.string().email('Invalid email format')
});

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
