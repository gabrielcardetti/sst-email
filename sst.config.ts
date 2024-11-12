/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sst-email",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: "sst-email",
        },
      },
    };
  },
  async run() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }

    if (!process.env.DATABASE_AUTH_TOKEN) {
      throw new Error("DATABASE_AUTH_TOKEN is required");
    }


    const trackingQueue = new sst.aws.Queue("email-tracking-queue");
    const trackingTopic = new sst.aws.SnsTopic("email-tracking-topic");

    const email = new sst.aws.Email("cafecafe", {
      sender: "cafecafe.com.ar",
      dns: false,
      events: [{
        name: 'sst-email-tracking',
        types: [
          "send",
          "reject",
          "bounce",
          "complaint",
          "delivery",
          "delivery-delay",
          "rendering-failure",
          "subscription",
          "open",
          "click"],
        topic: trackingTopic.arn
      }]
    });

    const trackingHandler = new sst.aws.Function("email-tracking-handler", {
      handler: "tracker.handler",
      environment: {
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN
      },
      permissions: [
        {
          actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
          resources: [trackingQueue.arn],
        }
      ]
    });

    trackingQueue.subscribe(trackingHandler.arn);
    trackingTopic.subscribeQueue('email-tracking-queue-topic', trackingQueue);


    const api = new sst.aws.Function("sst-email", {
      url: true,
      handler: "index.handler",
      link: [email],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN
      },
      permissions: [
        {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        },
      ],
    });

    return {
      api: api.url,
    };
  },
});
