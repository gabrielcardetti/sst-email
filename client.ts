import { hc } from "hono/client";
import type { EmailRoutes } from "./modules/emails/email.routes";

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("API_URL is required");
}

console.log("API_URL", API_URL);
const client = hc<EmailRoutes>(API_URL);

async function main() {
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

/*   const sendForgotPasswordEmailResponse = await client.email.send.$post({
    json: {
      to: "gabicardetti@gmail.com",
      templateName: "forgot-password",
      language: "en",
      data: {
        resetToken: "abc123",
        expirationMinutes: 15
      }
    }
  });

  console.log(await sendForgotPasswordEmailResponse.json());

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



}

main().catch(console.error);
