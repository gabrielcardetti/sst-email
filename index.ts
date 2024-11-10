import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { emailRoutes } from "./modules/emails/email.routes";

const app = new OpenAPIHono();

app.use(logger());
app.use(prettyJSON());
app.use(cors());

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

// Custom middleware, refer https://hono.dev/concepts/middleware
app.use(async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  c.res.headers.set("X-Response-Time", `${end - start}`);
});

emailRoutes(app);

app.get("/ui", swaggerUI({ url: "/doc" }));
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "sst-email",
  },
});

export const handler = handle(app);
