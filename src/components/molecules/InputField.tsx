import { View, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants, Input } from '@/components/atoms';

type InputFieldProps = TextInputProps & {
  label: string;
  rightLabel?: string;
  onRightLabelPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
};

export function InputField({
  label,
  rightLabel,
  onRightLabelPress,
  leftIcon,
  rightIcon,
  error,
  ...inputProps
}: InputFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text variant={TextVariants.Label}>{label}</Text>
        {rightLabel && (
          <Text variant={TextVariants.Label} color="textSecondary" onPress={onRightLabelPress}>
            {rightLabel}
          </Text>
        )}
      </View>
      <Input leftIcon={leftIcon} rightIcon={rightIcon} error={!!error} {...inputProps} />
      {error && (
        <Text variant={TextVariants.Caption} color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));
