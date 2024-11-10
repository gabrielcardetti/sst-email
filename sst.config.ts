/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sst-email",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: 'sst-email'
        }
      }
    };
  },
  async run() {

    const email = new sst.aws.Email("cafecafe", {
      sender: 'cafecafe.com.ar',
      dns: false
    });


    const lambda = new sst.aws.Function("sst-email", {
      url: true,
      handler: "index.handler",
      link: [email],
      environment: {
      },
      permissions: [
        {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        }
      ]
    });

    return {
      api: lambda.url,
    };
  },
});
