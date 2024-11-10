import { render } from "@react-email/render";
import type { EmailRequest } from "../email.doc";
import { ForgotPasswordTemplate } from "./forgot-password.template";
import { MagicLinkTemplate } from "./magic-link";
import { WelcomeTemplate } from "./welcome.template";

const TEMPLATE_COMPONENTS = {
  welcome: WelcomeTemplate,
  "forgot-password": ForgotPasswordTemplate,
  "magic-link": MagicLinkTemplate,
} as const;

type RenderOptions = {
  plainText?: boolean;
};

const renderTemplate = async (
  TemplateComponent: React.ComponentType<any>,
  data: unknown,
  language: string,
  options?: RenderOptions
) => {
  return render(<TemplateComponent data={data} language={language} />, options);
};

export const getTemplate = async (emailRequest: EmailRequest) => {
  const TemplateComponent = TEMPLATE_COMPONENTS[emailRequest.templateName];

  if (!TemplateComponent) {
    throw new Error(`Template not found: ${emailRequest.templateName}`);
  }

  const [html, text] = await Promise.all([
    renderTemplate(TemplateComponent, emailRequest.data, emailRequest.language),
    renderTemplate(TemplateComponent, emailRequest.data, emailRequest.language, {
      plainText: true,
    }),
  ]);

  return { html, text };
};
