// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.

/**
 * Per-locale copy for every auth email Supabase can ask us to send.
 *
 * Deliberately kept OUT of the app's `src/i18n/translations/*` bundle: this text
 * ships to the Deno edge runtime, not to the device, and bundling app translations
 * into an edge function (or vice-versa) would couple two build targets that have
 * no reason to share one. The app never renders these strings.
 *
 * `pt` is the default/fallback locale (primary market — see product-spec.md).
 */

export const FALLBACK_LOCALE = 'pt';
export const SUPPORTED_LOCALES = ['pt', 'es', 'en'];

/**
 * The `email_action_type` values Supabase sends that we render a real email for.
 * Anything outside this list is a notification-type event the project doesn't use
 * (or doesn't want to email about) — the hook no-ops on those rather than sending
 * a broken/blank email. See index.ts.
 */
export const SUPPORTED_ACTION_TYPES = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email_change_new',
  'reauthentication',
];

/**
 * Action types that verify a CODE the user types back in, rather than a link they
 * tap. These render the 6-digit `token` instead of a confirmation button.
 */
export const CODE_ACTION_TYPES = ['reauthentication'];

/**
 * Copy shape per action type:
 *   subject     — email subject line
 *   heading     — <h1> at the top of the card
 *   body        — main paragraph(s); array = one <p> per entry
 *   action      — CTA button label (omitted for code-based emails)
 *   footerNote  — small print under the CTA (e.g. "if you didn't request this…")
 *
 * `{{email}}` is interpolated at render time (used by the email-change templates).
 */
export const COPY = {
  pt: {
    common: {
      preheaderFallback: 'Nascente',
      linkFallbackLabel: 'Ou copie e cole este link no seu navegador:',
      expiryNote: 'Este link expira em breve e só pode ser usado uma vez.',
      signOff: 'Equipe Nascente',
      ignoreNote: 'Se você não solicitou isso, pode ignorar este e-mail com segurança.',
    },
    signup: {
      subject: 'Confirme seu e-mail — Nascente',
      heading: 'Bem-vindo à Nascente',
      body: ['Falta só um passo para começar. Confirme seu e-mail para ativar sua conta.'],
      action: 'Confirmar e-mail',
    },
    invite: {
      subject: 'Você foi convidado para a Nascente',
      heading: 'Você foi convidado',
      body: ['Você recebeu um convite para criar sua conta na Nascente.'],
      action: 'Aceitar convite',
    },
    magiclink: {
      subject: 'Seu link de acesso — Nascente',
      heading: 'Entrar na Nascente',
      body: ['Use o botão abaixo para entrar na sua conta. Nenhuma senha necessária.'],
      action: 'Entrar',
    },
    recovery: {
      subject: 'Redefinir sua senha — Nascente',
      heading: 'Redefinir sua senha',
      body: ['Recebemos um pedido para redefinir a senha da sua conta. Escolha uma nova senha pelo botão abaixo.'],
      action: 'Redefinir senha',
    },
    email_change: {
      subject: 'Confirme seu novo e-mail — Nascente',
      heading: 'Confirme seu novo e-mail',
      body: ['Confirme que {{email}} é o novo endereço de e-mail da sua conta Nascente.'],
      action: 'Confirmar novo e-mail',
    },
    email_change_new: {
      subject: 'Confirme seu novo e-mail — Nascente',
      heading: 'Confirme seu novo e-mail',
      body: ['Confirme que {{email}} é o novo endereço de e-mail da sua conta Nascente.'],
      action: 'Confirmar novo e-mail',
    },
    reauthentication: {
      subject: 'Seu código de verificação — Nascente',
      heading: 'Seu código de verificação',
      body: ['Use o código abaixo para confirmar sua identidade.'],
    },
  },

  es: {
    common: {
      preheaderFallback: 'Nascente',
      linkFallbackLabel: 'O copia y pega este enlace en tu navegador:',
      expiryNote: 'Este enlace caduca pronto y solo se puede usar una vez.',
      signOff: 'Equipo Nascente',
      ignoreNote: 'Si no solicitaste esto, puedes ignorar este correo con tranquilidad.',
    },
    signup: {
      subject: 'Confirma tu correo — Nascente',
      heading: 'Bienvenido a Nascente',
      body: ['Solo falta un paso para empezar. Confirma tu correo para activar tu cuenta.'],
      action: 'Confirmar correo',
    },
    invite: {
      subject: 'Te han invitado a Nascente',
      heading: 'Te han invitado',
      body: ['Has recibido una invitación para crear tu cuenta en Nascente.'],
      action: 'Aceptar invitación',
    },
    magiclink: {
      subject: 'Tu enlace de acceso — Nascente',
      heading: 'Iniciar sesión en Nascente',
      body: ['Usa el botón de abajo para iniciar sesión en tu cuenta. No necesitas contraseña.'],
      action: 'Iniciar sesión',
    },
    recovery: {
      subject: 'Restablecer tu contraseña — Nascente',
      heading: 'Restablecer tu contraseña',
      body: [
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Elige una nueva con el botón de abajo.',
      ],
      action: 'Restablecer contraseña',
    },
    email_change: {
      subject: 'Confirma tu nuevo correo — Nascente',
      heading: 'Confirma tu nuevo correo',
      body: ['Confirma que {{email}} es la nueva dirección de correo de tu cuenta Nascente.'],
      action: 'Confirmar nuevo correo',
    },
    email_change_new: {
      subject: 'Confirma tu nuevo correo — Nascente',
      heading: 'Confirma tu nuevo correo',
      body: ['Confirma que {{email}} es la nueva dirección de correo de tu cuenta Nascente.'],
      action: 'Confirmar nuevo correo',
    },
    reauthentication: {
      subject: 'Tu código de verificación — Nascente',
      heading: 'Tu código de verificación',
      body: ['Usa el código de abajo para confirmar tu identidad.'],
    },
  },

  en: {
    common: {
      preheaderFallback: 'Nascente',
      linkFallbackLabel: 'Or copy and paste this link into your browser:',
      expiryNote: 'This link expires soon and can only be used once.',
      signOff: 'The Nascente team',
      ignoreNote: "If you didn't request this, you can safely ignore this email.",
    },
    signup: {
      subject: 'Confirm your email — Nascente',
      heading: 'Welcome to Nascente',
      body: ['One step left to get started. Confirm your email to activate your account.'],
      action: 'Confirm email',
    },
    invite: {
      subject: "You've been invited to Nascente",
      heading: "You've been invited",
      body: ['You have been invited to create your Nascente account.'],
      action: 'Accept invitation',
    },
    magiclink: {
      subject: 'Your sign-in link — Nascente',
      heading: 'Sign in to Nascente',
      body: ['Use the button below to sign in to your account. No password needed.'],
      action: 'Sign in',
    },
    recovery: {
      subject: 'Reset your password — Nascente',
      heading: 'Reset your password',
      body: ['We received a request to reset your account password. Choose a new one using the button below.'],
      action: 'Reset password',
    },
    email_change: {
      subject: 'Confirm your new email — Nascente',
      heading: 'Confirm your new email',
      body: ['Confirm that {{email}} is the new email address for your Nascente account.'],
      action: 'Confirm new email',
    },
    email_change_new: {
      subject: 'Confirm your new email — Nascente',
      heading: 'Confirm your new email',
      body: ['Confirm that {{email}} is the new email address for your Nascente account.'],
      action: 'Confirm new email',
    },
    reauthentication: {
      subject: 'Your verification code — Nascente',
      heading: 'Your verification code',
      body: ['Use the code below to confirm your identity.'],
    },
  },
};

/**
 * Resolve a locale string (possibly `pt-BR`, `ES`, null, or something unsupported)
 * down to one of SUPPORTED_LOCALES, falling back to `pt`.
 */
export function resolveLocale(raw) {
  if (!raw || typeof raw !== 'string') return FALLBACK_LOCALE;
  const base = raw.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(base) ? base : FALLBACK_LOCALE;
}
