import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { Trash2 } from 'lucide-react-native';
import { PostHogMaskView } from 'posthog-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { AppModal } from '@/components/molecules';
import { useTranslate } from '@/i18n';
import { useThemeStore } from '@/stores/theme';
import { BUTTON_VARIANTS } from '../atoms/Button';

type NoteEditorModalProps = {
  visible: boolean;
  /** Reference label, e.g. "João 3:16". */
  reference: string;
  /** Existing note body, or '' for a new note. */
  initialBody: string;
  onSave: (body: string) => void;
  /** Delete the note (only shown when editing an existing note). */
  onDelete: () => void;
  hasExistingNote: boolean;
  onClose: () => void;
};

/**
 * Centered note editor dialog (built on `AppModal`): a multiline field + save,
 * plus delete when editing an existing note. Opened from the `VerseActionSheet`
 * Note action in the Reader.
 */
export function NoteEditorModal({
  visible,
  reference,
  initialBody,
  onSave,
  onDelete,
  hasExistingNote,
  onClose,
}: NoteEditorModalProps) {
  const translate = useTranslate();
  // The parent remounts this via a `key` tied to the target verse, so the field
  // initializes from `initialBody` without a reset effect.
  const [body, setBody] = useState(initialBody);

  const trimmed = body.trim();

  // placeholderTextColor and the delete icon's color are plain props read once at
  // mount, not Unistyles-processed style values — read theme name reactively instead.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.label}>
          {translate('study.note.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.reference}>
          {reference}
        </Text>

        {/*
          Hidden from session replay. `maskAllTextInputs` is already on globally,
          but a note is the most personal content in the app (private reflections
          on scripture), so the guarantee shouldn't rest on a global flag someone
          could later flip. Masking here is explicit and local to the risk.
        */}
        <PostHogMaskView>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={translate('study.note.placeholder')}
            placeholderTextColor={theme.colors.semantic.textSecondary}
            style={styles.input}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </PostHogMaskView>

        <Button
          label={translate('study.note.save')}
          onPress={() => onSave(trimmed)}
          disabled={trimmed.length === 0}
          fullWidth
        />

        {hasExistingNote ? (
          <Button
            variant={BUTTON_VARIANTS.Ghost}
            label={translate('study.note.delete')}
            icon={<Trash2 size={18} color={theme.colors.semantic.danger} strokeWidth={2} />}
            onPress={onDelete}
            fullWidth
            style={styles.delete}
          />
        ) : null}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    gap: theme.spacing[2],
  },
  label: {
    textAlign: 'center',
  },
  reference: {
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.bgSecondary,
    padding: theme.spacing[3],
    fontSize: theme.font.sizes.callout,
    fontFamily: theme.font.family,
    color: theme.colors.semantic.textPrimary,
    marginBottom: theme.spacing[2],
  },
  delete: {
    marginTop: theme.spacing[1],
  },
}));
