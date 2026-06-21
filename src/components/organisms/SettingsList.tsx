import { Children, Fragment, isValidElement } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type SettingsListProps = {
  children: React.ReactNode;
};

export function SettingsList({ children }: SettingsListProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.card}>
      {items.map((child, index) => (
        <Fragment key={child.key ?? index}>
          {child}
          {index < items.length - 1 && <View style={styles.separator} />}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing[4],
    ...theme.shadows.lg,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.semantic.bgTertiary,
  },
}));
