// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import * as React from 'npm:react@19.2.8';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@1.0.12';

/**
 * The one branded template behind every auth email.
 *
 * Deliberately a SINGLE component rather than one file per email type: the emails
 * differ only in copy (heading/body/CTA label), which already lives per-locale in
 * copy.ts. Splitting per type would duplicate the identical layout 7x and make a
 * brand tweak a 7-file change. Type-specific behaviour is exactly one branch —
 * link-based vs. code-based (`token`) — handled below.
 *
 * Email-client constraints, on purpose:
 *   - inline styles only (no <style>/CSS classes — Gmail strips much of it)
 *   - table-free flex-free layout via @react-email primitives
 *   - the CTA is repeated as a plain text link, since some clients block buttons
 */

// Mirrors src/theme/colors.ts (light theme) — emails always render light, since
// there's no reliable prefers-color-scheme support across mail clients.
const BRAND = {
  primary: '#4A6C4F',
  primaryForeground: '#FFFFFF',
  background: '#F5F0E6',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9E9E9E',
  border: '#E6E0D4',
};

const styles = {
  body: {
    backgroundColor: BRAND.background,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: 0,
    padding: '32px 12px',
  },
  container: {
    backgroundColor: BRAND.surface,
    borderRadius: '14px',
    border: `1px solid ${BRAND.border}`,
    margin: '0 auto',
    maxWidth: '520px',
    padding: '40px 36px',
  },
  brand: {
    color: BRAND.primary,
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    margin: '0 0 28px',
    textAlign: 'center',
  },
  heading: {
    color: BRAND.textPrimary,
    fontSize: '23px',
    fontWeight: 700,
    lineHeight: '31px',
    margin: '0 0 14px',
  },
  paragraph: {
    color: BRAND.textSecondary,
    fontSize: '16px',
    lineHeight: '25px',
    margin: '0 0 14px',
  },
  buttonSection: { margin: '30px 0 22px', textAlign: 'center' },
  // Not <Button/>: an <a> with explicit padding renders far more consistently in
  // Outlook/Gmail than the component's default block styling.
  button: {
    backgroundColor: BRAND.primary,
    borderRadius: '10px',
    color: BRAND.primaryForeground,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 600,
    padding: '14px 30px',
    textDecoration: 'none',
  },
  code: {
    backgroundColor: BRAND.background,
    borderRadius: '10px',
    color: BRAND.textPrimary,
    fontFamily: "'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: '30px',
    fontWeight: 700,
    letterSpacing: '7px',
    margin: '26px 0',
    padding: '18px 0',
    textAlign: 'center',
  },
  fallbackLabel: {
    color: BRAND.textTertiary,
    fontSize: '13px',
    lineHeight: '19px',
    margin: '0 0 5px',
  },
  fallbackLink: {
    color: BRAND.primary,
    fontSize: '13px',
    lineHeight: '19px',
    wordBreak: 'break-all',
  },
  hr: { borderColor: BRAND.border, margin: '30px 0 18px' },
  footer: {
    color: BRAND.textTertiary,
    fontSize: '13px',
    lineHeight: '19px',
    margin: '0 0 5px',
  },
};

export function AuthEmail({ heading, body, actionLabel, actionUrl, token, common }) {
  const isCode = Boolean(token);

  return (
    <Html>
      <Head />
      {/* Preheader: the grey preview line mail clients show next to the subject. */}
      <Preview>{body[0] ?? common.preheaderFallback}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Nascente</Text>

          <Heading style={styles.heading}>{heading}</Heading>

          {body.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          {isCode ? (
            <Text style={styles.code}>{token}</Text>
          ) : (
            <>
              <Section style={styles.buttonSection}>
                <Link href={actionUrl} style={styles.button}>
                  {actionLabel}
                </Link>
              </Section>

              <Text style={styles.fallbackLabel}>{common.linkFallbackLabel}</Text>
              <Link href={actionUrl} style={styles.fallbackLink}>
                {actionUrl}
              </Link>
            </>
          )}

          <Hr style={styles.hr} />

          <Text style={styles.footer}>{common.expiryNote}</Text>
          <Text style={styles.footer}>{common.ignoreNote}</Text>
          <Text style={styles.footer}>{common.signOff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AuthEmail;
