import { hc } from "hono/client";
import type { EmailRoutes } from "./modules/emails/email.routes";
import { inspect } from "bun";

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("API_URL is required");
}

console.log("API_URL", API_URL);
const client = hc<EmailRoutes>(API_URL);


// sending emails to this emails NOT trigger the event that we want :(, but if we do it from the console it works, replace the domain in the url
// https://us-east-1.console.aws.amazon.com/ses/home?region=us-east-1#/identities/{{domain}}/send-test-email

const mockEmails = {
  success: "success@simulator.amazonses.com",
  bounce: "bounce@simulator.amazonses.com",
  complaint: "complaint@simulator.amazonses.com"
}
async function main() {
  /*

  const sendWelcomeEmailResponse = await client.email.send.$post({
    json: {
      to: "gabicardetti@gmail.com",
      templateName: "welcome",
      language: "en",
      data: {
        userName: "John Doe",
        websiteUrl: "https://example.com"
      }
    }
  });

  console.log(await sendWelcomeEmailResponse.json());



  const sendMagicLinkEmailResponse = await client.email.send.$post({
    json: {
      to: "gabicardetti@gmail.com",
      templateName: "magic-link",
      language: "en",
      data: {
        loginToken: "xyz456",
        expirationMinutes: 10
      }
    }
  });

  console.log(await sendMagicLinkEmailResponse.json()); */
/* 
  const sendForgotPasswordEmailResponse = await client.email.send.$post({
    json: {
      to: mockEmails.bounce,
      templateName: "forgot-password",
      language: "en",
      data: {
        resetToken: "abc123",
        expirationMinutes: 15,
      },
    },
  });

  console.log(sendForgotPasswordEmailResponse)
  const response = await sendForgotPasswordEmailResponse.json();

  if (!response.success) {
    console.error("Failed to send email", response);
    return;
  }

  console.log("Email sent successfully", response);

  if (!response.messageId) {
    console.error("No message ID found in response", response);
    return;
  }
 */
  // const messageId = "010001932cd97d6d-881ae931-3734-4b7d-a603-3d7c4ffe5b03-00000";

  // console.log("Message ID", messageId);

  // const emailEvents = await client.email[":messageId"].events.$get({
  //   param: {
  //     messageId,
  //   },
  // });

  // const events = await emailEvents.json();

  // console.log(events);

  // console.log(inspect(events, { depth: Number.POSITIVE_INFINITY }));


// <<  const incomingEmails = await client.email.incoming.$get();
//   const incomingEmailsResponse = await incomingEmails.json() as { emails?: { text: string | null; to: string[]; id: number; createdAt: string; from: string; fromName: string | null; subject: string | null; html: string | null; s3Key: string; s3Bucket: string; attachmentCount: number; metadata: Record<string, unknown> | null; }[]; error?: string; };

//   if ('error' in incomingEmailsResponse) {
//     console.error('Failed to fetch incoming emails:', incomingEmailsResponse.error);
//     return;
//   }

//   if (!incomingEmailsResponse.emails) {
//     console.error('No emails found in response');
//     return;
//   }


//   const lastEmail = incomingEmailsResponse.emails[0];

//   // console.log(incomingEmailsResponse.emails);

//   const lastEmailDeteails = await client.email.incoming[":id"].$get({
//     param: {
//       id: lastEmail.id.toString(),
//     },
//   });

//   const deatilsResponse = await lastEmailDeteails.json();

//   console.log(deatilsResponse);>>

  // const incomingEmailDetails = await client.email.incoming[":id"].$get({
  //   param: {
  //     id: "2",
  //   },
  // });
  // console.log(await incomingEmailDetails.json());


  // const attachment = await client.email.attachment[":attachmentId"].download.$get({
  //   param: {
  //     attachmentId: "2",
  //   },
  // });
  // console.log(attachment);


  const verifyEmailResponse = await client.email["verify-email"].$post({
    json: {
      email: "gabicardetti@gmail.com",
    },
  });
  console.log(verifyEmailResponse);

  const response = await verifyEmailResponse.json();
  console.log(response);
}

main().catch(console.error);
