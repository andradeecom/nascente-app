import { createForgotPasswordSchema } from '../forgot-password';
import { createLoginSchema } from '../login';
import { createProfileSchema } from '../profile';
import { createRegisterSchema } from '../register';
import { createResetPasswordSchema } from '../reset-password';

/**
 * The auth form schemas. Each is a *factory* (not a static export) so validation
 * messages are built against the current i18n locale — the tests below assert on
 * which field failed and how many issues were raised, never on message text,
 * which is locale-dependent and would make these brittle.
 */

const validRegister = {
  firstName: 'Eduardo',
  lastName: 'Andrade',
  email: 'edu@example.com',
  password: 'secret123',
  confirmPassword: 'secret123',
};

/**
 * The distinct field paths that failed, for order-independent assertions.
 * Deduped because one field can raise several issues at once — an empty email
 * fails both `min(1)` and `email()` — and the tests care about *which* fields
 * are invalid, not how many rules each one broke.
 */
function failedPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }): string[] {
  if (result.success) return [];
  return [...new Set(result.error!.issues.map((i) => i.path.join('.')))].sort();
}

describe('createLoginSchema', () => {
  const schema = createLoginSchema();

  it('accepts a valid email and password', () => {
    expect(schema.safeParse({ email: 'edu@example.com', password: 'secret123' }).success).toBe(true);
  });

  it.each([['not-an-email'], ['edu@'], ['@example.com'], ['edu example@x.com']])(
    'rejects the malformed email %p',
    (email) => {
      expect(failedPaths(schema.safeParse({ email, password: 'secret123' }))).toContain('email');
    }
  );

  it('rejects an empty email', () => {
    expect(failedPaths(schema.safeParse({ email: '', password: 'secret123' }))).toContain('email');
  });

  it('rejects a password shorter than 6 characters', () => {
    expect(failedPaths(schema.safeParse({ email: 'edu@example.com', password: '12345' }))).toContain('password');
  });

  it('accepts a password of exactly 6 characters (boundary)', () => {
    expect(schema.safeParse({ email: 'edu@example.com', password: '123456' }).success).toBe(true);
  });

  it('reports both fields when both are empty', () => {
    expect(failedPaths(schema.safeParse({ email: '', password: '' }))).toEqual(['email', 'password']);
  });
});

describe('createRegisterSchema', () => {
  const schema = createRegisterSchema();

  it('accepts a fully valid registration', () => {
    expect(schema.safeParse(validRegister).success).toBe(true);
  });

  it('rejects a mismatched confirmPassword, blaming the confirm field', () => {
    // The refinement sets `path: ['confirmPassword']` so RHF shows the error on
    // the second field rather than the first — if that path regresses, the user
    // sees the error under the wrong input.
    const result = schema.safeParse({ ...validRegister, confirmPassword: 'different' });

    expect(failedPaths(result)).toEqual(['confirmPassword']);
  });

  it.each(['firstName', 'lastName'] as const)('rejects an empty %s', (field) => {
    expect(failedPaths(schema.safeParse({ ...validRegister, [field]: '' }))).toContain(field);
  });

  it('rejects an empty confirmPassword', () => {
    expect(failedPaths(schema.safeParse({ ...validRegister, confirmPassword: '' }))).toContain('confirmPassword');
  });

  it('does not run the match refinement when a base field already failed', () => {
    // Zod short-circuits `.refine` on the object when the shape fails, so a too-short
    // password reports only the length issue — not a confusing extra mismatch error.
    const result = schema.safeParse({ ...validRegister, password: '123', confirmPassword: '123' });

    expect(failedPaths(result)).toEqual(['password']);
  });
});

describe('createResetPasswordSchema', () => {
  const schema = createResetPasswordSchema();

  it('accepts matching valid passwords', () => {
    expect(schema.safeParse({ password: 'secret123', confirmPassword: 'secret123' }).success).toBe(true);
  });

  it('rejects a mismatch on the confirm field', () => {
    expect(failedPaths(schema.safeParse({ password: 'secret123', confirmPassword: 'nope123' }))).toEqual([
      'confirmPassword',
    ]);
  });

  it('enforces the same 6-character minimum as registration', () => {
    // Divergence here would let a reset set a password the register form rejects.
    expect(failedPaths(schema.safeParse({ password: '12345', confirmPassword: '12345' }))).toContain('password');
  });
});

describe('createForgotPasswordSchema', () => {
  const schema = createForgotPasswordSchema();

  it('accepts a valid email', () => {
    expect(schema.safeParse({ email: 'edu@example.com' }).success).toBe(true);
  });

  it('rejects an empty or malformed email', () => {
    expect(schema.safeParse({ email: '' }).success).toBe(false);
    expect(schema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('createProfileSchema', () => {
  const schema = createProfileSchema();

  it('accepts a first and last name', () => {
    expect(schema.safeParse({ firstName: 'Eduardo', lastName: 'Andrade' }).success).toBe(true);
  });

  it('rejects empty names', () => {
    expect(failedPaths(schema.safeParse({ firstName: '', lastName: '' }))).toEqual(['firstName', 'lastName']);
  });

  it('does not require email (display-only on the profile screen)', () => {
    expect(schema.safeParse({ firstName: 'E', lastName: 'A' }).success).toBe(true);
  });
});

describe('schema factories', () => {
  it('return a fresh instance per call so messages track the current locale', () => {
    // If these became static module-level exports, validation messages would
    // freeze at the locale that was active at import time.
    expect(createLoginSchema()).not.toBe(createLoginSchema());
  });
});
