import { TextInput, type TextInputProps, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type InputProps = TextInputProps & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
};

export function Input({ leftIcon, rightIcon, error, style, ...rest }: InputProps) {
  return (
    <View style={[styles.container, error && styles.error]}>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <TextInput style={[styles.input, style]} placeholderTextColor={styles.placeholder.color} {...rest} />
      {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.bgSecondary,
    paddingHorizontal: theme.spacing[4],
    minHeight: 52,
  },
  error: {
    borderColor: theme.colors.semantic.danger,
  },
  iconContainer: {
    marginRight: theme.spacing[2],
  },
  input: {
    flex: 1,
    fontSize: theme.font.sizes.callout,
    fontFamily: theme.font.family,
    color: theme.colors.semantic.textPrimary,
    alignSelf: 'stretch',
  },
  placeholder: {
    color: theme.colors.semantic.textSecondary,
  },
}));
