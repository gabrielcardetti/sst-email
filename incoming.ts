import { simpleParser } from "mailparser";
import type { S3Event } from "aws-lambda";

import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { EmailRepository } from "./modules/emails/email.repository";


export async function handler(event: S3Event) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const s3 = new S3Client();
  const emailRepository = new EmailRepository();

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      const getCommand = new GetObjectCommand({
        Key: key,
        Bucket: bucket,
      });

      const response = await s3.send(getCommand);

      if (!response.Body) {
        console.error('No email body found');
        continue;
      }

      const bodyContents = await response.Body.transformToString();
      const email = await simpleParser(bodyContents);

      
      const emailId = await emailRepository.createIncomingEmail(email, key, bucket);

      // Save attachments if any
      if (email.attachments.length > 0) {
        await emailRepository.createIncomingAttachments(emailId, email.attachments, key);
      }

      console.log('Email processed and saved:', {
        emailId,
        from: email.from?.text,
        subject: email.subject,
        attachments: email.attachments.length
      });

    } catch (error) {
      console.error('Error processing email:', error);
    }
  }
}