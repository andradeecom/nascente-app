import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useGenerateAiPlan, useSaveAiPlan } from '@/hooks/use-ai-plan-generate';
import { useReaderStore } from '@/stores/reader';
import { getBookName } from '@/services/bible';
import { useTranslate } from '@/i18n';
import {
  AI_PLAN_MAX_DAYS,
  AI_PLAN_MIN_DAYS,
  daysUntilReset,
  isAiPlanQuotaError,
  type AiPlanPreview,
} from '@/types/ai-plan';
import { isPlanLimitError } from '@/types/subscription';

const DEFAULT_DAYS = 7;

type Step = 'input' | 'preview';

/** A preview day with its display label already resolved for rendering. */
export type PreviewDayVm = { day: number; label: string };

/** A plain informational dialog (no Pro CTA) — out-of-credits or active-plan-cap. */
type Notice = { title: string; message: string };

export default function useCreatePlanScreen() {
  const router = useRouter();
  const translate = useTranslate();
  const generate = useGenerateAiPlan();
  const save = useSaveAiPlan();
  const translationId = useReaderStore((s) => s.translationId);

  const [step, setStep] = useState<Step>('input');
  const [topic, setTopic] = useState('');
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [preview, setPreview] = useState<AiPlanPreview | null>(null);
  const [previewDays, setPreviewDays] = useState<PreviewDayVm[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  const canGenerate = topic.trim().length > 0 && !generate.isPending;

  const handleSelectExample = useCallback((example: string) => {
    setTopic(example);
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    try {
      const result = await generate.mutateAsync({ topic: trimmed, days });

      // Resolve localized book names once (from the user's current translation)
      // so the preview shows "João 3-5", not raw ids.
      const bookIds = [...new Set(result.days.map((d) => d.book_id))];
      const nameByBook: Record<number, string> = {};
      await Promise.all(
        bookIds.map(async (id) => {
          nameByBook[id] = await getBookName(translationId, id);
        })
      );
      const vms: PreviewDayVm[] = result.days.map((d) => {
        const chapters = d.chapter_end > d.chapter_start ? `${d.chapter_start}-${d.chapter_end}` : `${d.chapter_start}`;
        return { day: d.day, label: `${nameByBook[d.book_id] || ''} ${chapters}`.trim() };
      });

      setPreview(result);
      setPreviewDays(vms);
      setStep('preview');
    } catch (error) {
      if (isAiPlanQuotaError(error)) {
        // Out of AI credits for this cycle. No "buy more" product yet (V2), so
        // just inform + show when the quota resets.
        const remaining = daysUntilReset(error.resetAt);
        setNotice({
          title: translate('aiPlan.quota.title'),
          message: translate('aiPlan.quota.message', { count: remaining }),
        });
      } else {
        Toast.show({ type: 'error', text1: translate('aiPlan.errors.generateFailed') });
      }
    }
  }, [topic, days, generate, translationId, translate]);

  const handleBackToInput = useCallback(() => {
    setStep('input');
    setPreview(null);
    setPreviewDays([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!preview) return;
    try {
      const plan = await save.mutateAsync(preview);
      Toast.show({ type: 'success', text1: translate('aiPlan.saved') });
      // Replace so the back button from the plan doesn't return to the generator.
      router.replace(`/(tabs)/plans/${plan.id}`);
    } catch (error) {
      if (isPlanLimitError(error)) {
        // Already Pro (the whole tab is Pro-gated) and at the 50 active-plan cap —
        // there's nothing to upsell, so inform them to remove a plan first.
        setNotice({
          title: translate('aiPlan.planCap.title'),
          message: translate('aiPlan.planCap.message', { count: error.limit }),
        });
      } else {
        Toast.show({ type: 'error', text1: translate('aiPlan.errors.saveFailed') });
      }
    }
  }, [preview, save, router, translate]);

  return {
    translate,
    step,
    topic,
    setTopic,
    days,
    setDays,
    minDays: AI_PLAN_MIN_DAYS,
    maxDays: AI_PLAN_MAX_DAYS,
    canGenerate,
    generating: generate.isPending,
    saving: save.isPending,
    preview,
    previewDays,
    handleSelectExample,
    handleGenerate,
    handleBackToInput,
    handleSave,
    notice,
    closeNotice: () => setNotice(null),
  };
}
