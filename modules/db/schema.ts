import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const emailTable = sqliteTable("email", {
  id: int().primaryKey({ autoIncrement: true }),
  email: text().notNull(),
  messageId: text().notNull().unique(),
  data: text()
});
