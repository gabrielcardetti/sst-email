import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

const commonColumns = {
  id: int().primaryKey({ autoIncrement: true }),
  createdAt: int("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
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
