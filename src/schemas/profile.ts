import { z } from 'zod';
import { translate } from '@/i18n';

export const createProfileSchema = () =>
  z.object({
    firstName: z.string().min(1, translate('validation.firstNameRequired')),
    lastName: z.string().min(1, translate('validation.lastNameRequired')),
  });

export type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>;
