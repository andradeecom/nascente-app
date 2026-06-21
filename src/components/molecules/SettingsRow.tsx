import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/atoms';

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
      <Text variant="body" color={destructive ? 'danger' : 'textPrimary'} style={styles.label}>
        {label}
      </Text>
      {value && (
        <Text variant="callout" color="textSecondary">
          {value}
        </Text>
      )}
      {showChevron && <ChevronRight size={18} color={styles.chevron.color} />}
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
  chevron: {
    color: theme.colors.semantic.textTertiary,
  },
}));
