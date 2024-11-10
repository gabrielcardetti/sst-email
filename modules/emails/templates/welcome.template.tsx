import {
  Html,
  Button,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
} from "@react-email/components";
import type { WelcomeTemplateData } from "../email.doc";

interface WelcomeEmailProps {
  data: WelcomeTemplateData
  language?: 'en' | 'es';
}

export function WelcomeTemplate({ data, language = 'en' }: WelcomeEmailProps) {
  const { userName, websiteUrl } = data;
  const translations = {
    en: {
      preview: "Welcome to our platform",
      title: `Welcome ${userName}!`,
      text: "We're excited to have you on board.",
      cta: "Visit our website",
    },
    es: {
      preview: "Bienvenido a nuestra plataforma",
      title: `¡Bienvenido ${userName}!`,
      text: "Estamos emocionados de tenerte con nosotros.",
      cta: "Visita nuestro sitio web",
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
          <Button href={websiteUrl} style={button}>
            {t.cta}
          </Button>
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
  backgroundColor: "#5c6bc0",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "18px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};