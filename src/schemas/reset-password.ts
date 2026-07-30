import { z } from 'zod';
import { translate } from '@/i18n';

export const createResetPasswordSchema = () =>
  z
    .object({
      password: z
        .string()
        .min(1, translate('validation.passwordRequired'))
        .min(6, translate('validation.passwordMinLength', { count: 6 })),
      confirmPassword: z.string().min(1, translate('validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: translate('validation.passwordsDontMatch'),
      path: ['confirmPassword'],
    });

export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
