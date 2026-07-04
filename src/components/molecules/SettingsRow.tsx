import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { ChevronRight } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

const ThemedChevronRight = withUnistyles(ChevronRight, (theme) => ({ color: theme.colors.semantic.textTertiary }));

type SettingsRowProps = Omit<PressableProps, 'children'> & {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
};

export function SettingsRow({
  icon,
  label,
  value,
  showChevron = true,
  destructive = false,
  style,
  ...rest
}: SettingsRowProps) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed, style as ViewStyle]} {...rest}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text variant={TEXT_VARIANTS.Body} color={destructive ? 'danger' : 'textPrimary'} style={styles.label}>
        {label}
      </Text>
      {value && (
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
          {value}
        </Text>
      )}
      {showChevron && <ThemedChevronRight size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[3],
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
}));
