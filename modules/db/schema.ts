import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

const commonColumns = {
  id: int().primaryKey({ autoIncrement: true }),
  createdAt: int("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ).notNull(),
};

export const emailTable = sqliteTable("email", {
  ...commonColumns,
  email: text().notNull(),
  messageId: text().notNull().unique(),
  data: text(),
});

export const eventTable = sqliteTable("events", {
  ...commonColumns,
  messageId: text("message_id").notNull(),
  type: text("type").notNull(),
  timestamp: text("timestamp").notNull(),
  data: text("data")
});

export const bouncedEmailTable = sqliteTable("bounced_emails", {
  ...commonColumns,
  email: text().notNull().unique(),
  reason: text().notNull(),
  bounceType: text().notNull(),
  lastBounceAt: int("last_bounce_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const incomingEmailTable = sqliteTable("incoming_email", {
  ...commonColumns,
  from: text("from").notNull(),
  fromName: text("from_name"),
  to: text("to").notNull(),
  subject: text("subject"),
  text: text("text"),
  html: text("html"),
  s3Key: text("s3_key").notNull().unique(),
  s3Bucket: text("s3_bucket").notNull(),
  attachmentCount: int("attachment_count").default(0),
  metadata: text("metadata"),
});

export const incomingAttachmentTable = sqliteTable("incoming_attachment", {
  ...commonColumns,
  emailId: int("email_id").references(() => incomingEmailTable.id),
  filename: text("filename"),
  contentType: text("content_type"),
  size: int("size").notNull(),
  s3Key: text("s3_key").notNull().unique(),
});
