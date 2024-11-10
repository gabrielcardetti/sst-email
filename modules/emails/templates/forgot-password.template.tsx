import {
  Html,
  Button,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Hr,
} from "@react-email/components";
import type { ForgotPasswordTemplateData } from "../email.doc";

interface ForgotPasswordEmailProps {
  data: ForgotPasswordTemplateData
  language?: 'en' | 'es';
}

export function ForgotPasswordTemplate({ data, language = 'en' }: ForgotPasswordEmailProps) {
  const { resetToken, expirationMinutes } = data;
  const resetUrl = `https://yourapp.com/reset-password?token=${resetToken}`;

  const translations = {
    en: {
      preview: "Reset your password",
      title: "Reset Password Request",
      text: "We received a request to reset your password. Click the button below to create a new password:",
      expiration: `This link will expire in ${expirationMinutes} minutes.`,
      cta: "Reset Password",
      ignore: "If you didn't request this, please ignore this email.",
    },
    es: {
      preview: "Restablece tu contraseña",
      title: "Solicitud de restablecimiento de contraseña",
      text: "Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva contraseña:",
      expiration: `Este enlace expirará en ${expirationMinutes} minutos.`,
      cta: "Restablecer Contraseña",
      ignore: "Si no solicitaste esto, puedes ignorar este correo.",
    },
  };

  const t = translations[language];

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container>
          <Text style={heading}>{t.title}</Text>
          <Text style={paragraph}>{t.text}</Text>
          <Button href={resetUrl} style={button}>
            {t.cta}
          </Button>
          <Text style={paragraph}>{t.expiration}</Text>
          <Hr style={hr} />
          <Text style={footer}>{t.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
};

const paragraph = {
  fontSize: "18px",
  lineHeight: "1.4",
  color: "#484848",
};

const button = {
  backgroundColor: "#e91e63",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "18px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  fontSize: "16px",
  color: "#888888",
};