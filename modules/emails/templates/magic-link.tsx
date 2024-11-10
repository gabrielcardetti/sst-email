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
import type { MagicLinkTemplateData } from "../email.doc";

interface MagicLinkEmailProps {
  data: MagicLinkTemplateData
  language?: 'en' | 'es';
}

export function MagicLinkTemplate({ data, language = 'en' }: MagicLinkEmailProps) {
  const { loginToken, expirationMinutes } = data;
  const loginUrl = `https://yourapp.com/login?token=${loginToken}`;

  const translations = {
    en: {
      preview: "Your magic link to sign in",
      title: "Sign in to Your Account",
      text: "Click the button below to sign in to your account. No password needed!",
      expiration: `This link will expire in ${expirationMinutes} minutes.`,
      cta: "Sign In",
      security: "For security reasons, this link can only be used once.",
    },
    es: {
      preview: "Tu enlace mágico para iniciar sesión",
      title: "Inicia sesión en tu cuenta",
      text: "Haz clic en el botón para iniciar sesión en tu cuenta. ¡No necesitas contraseña!",
      expiration: `Este enlace expirará en ${expirationMinutes} minutos.`,
      cta: "Iniciar Sesión",
      security: "Por razones de seguridad, este enlace solo puede usarse una vez.",
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
          <Button href={loginUrl} style={button}>
            {t.cta}
          </Button>
          <Text style={paragraph}>{t.expiration}</Text>
          <Hr style={hr} />
          <Text style={footer}>{t.security}</Text>
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
  backgroundColor: "#2196f3",
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