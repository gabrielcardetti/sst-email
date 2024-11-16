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
      events: [
        {
          name: "sst-email-tracking",
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
            "click",
          ],
          topic: trackingTopic.arn,
        },
      ]
    });

    const trackingHandler = new sst.aws.Function("email-tracking-handler", {
      handler: "tracker.handler",
      environment: {
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
      },
      permissions: [
        {
          actions: [
            "sqs:ReceiveMessage",
            "sqs:DeleteMessage",
            "sqs:GetQueueAttributes",
          ],
          resources: [trackingQueue.arn],
        },
      ],
      timeout: "2 minutes"
    });

    trackingQueue.subscribe(trackingHandler.arn);
    trackingTopic.subscribeQueue("email-tracking-queue-topic", trackingQueue);

    const emailBucket = new sst.aws.Bucket("incoming-emails-v2");


    const api = new sst.aws.Function("sst-email", {
      url: true,
      handler: "index.handler",
      link: [email, emailBucket],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
      },
      permissions: [
        {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        },
        {
          actions: ["s3:GetObject"],
          resources: [emailBucket.arn],
        }
      ],
      timeout: "2 minutes"
    });

    // // Create SES rule set using AWS provider
    const ruleSet = new aws.ses.ReceiptRuleSet("emailRuleSet", {
      ruleSetName: `sst-email-rules`,
    });

    // Activate this specific rule set - only ONE rule set can be active at a time
    const activeRuleSet = new aws.ses.ActiveReceiptRuleSet("activeEmailRuleSet", {
      ruleSetName: ruleSet.ruleSetName,
    });


    // const emailBucketPolicy = new aws.s3.BucketPolicy("incoming-emails-ses-policy", {
    //   bucket: emailBucket.name,
    //   policy: JSON.stringify({
    //     Version: "2012-10-17",
    //     Statement: [
    //       {
    //         Effect: "Allow",
    //         Principal: {
    //           Service: "ses.amazonaws.com",
    //         },
    //         Action: "s3:PutObject",
    //         Resource: `${emailBucket.arn}/*`,
    //       },
    //     ],
    //   }),
    // });

    const incomingEmailHandler = new sst.aws.Function("incoming-email-handler", {
      handler: "incoming.handler",
      environment: {
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
      },
      permissions: [
        {
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [emailBucket.arn],
        },
      ],
      link: [emailBucket],
      timeout: "2 minutes"
    });



    const rule = new aws.ses.ReceiptRule("emailRule", {
      ruleSetName: ruleSet.ruleSetName,
      enabled: true,
      scanEnabled: true,
      recipients: ["incoming@cafecafe.com.ar"],
      s3Actions: [{
        bucketName: emailBucket.name,
        objectKeyPrefix: "incoming/",
        position: 1,
      }],
    });

    // TODO: if domain is registered on Route53, add MX record to the domain

    // TODO: add sqs in the middle of the hablde
    emailBucket.subscribe(incomingEmailHandler.arn);

    return {
      api: api.url,
      s3Bucket: emailBucket.domain,
      s3name: emailBucket.name,
    };
  },
});
