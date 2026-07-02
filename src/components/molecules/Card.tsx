import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';

function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

function CardBody({ style, ...props }: ViewProps) {
  return <View style={[styles.body, style]} {...props} />;
}

function CardFooter({ style, ...props }: ViewProps) {
  return <View style={[styles.footer, style]} {...props} />;
}

const sections = { Header: CardHeader, Body: CardBody, Footer: CardFooter };

function CardRoot({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

/** Static, non-tappable card surface. */
export const Card = Object.assign(CardRoot, sections);

type PressableScaleProps = Omit<React.ComponentProps<typeof PressableScale>, 'style' | 'children'>;
type PressableCardProps = PressableScaleProps & Pick<ViewProps, 'style' | 'children'>;

function PressableCardRoot({ style, children, ...pressableProps }: PressableCardProps) {
  return (
    <PressableScale {...pressableProps}>
      <Card style={style}>{children}</Card>
    </PressableScale>
  );
}

/**
 * Tappable card — wraps the minimal `Card` surface in `PressableScale` (press-scale
 * animation). Press props (`onPress`, `accessibilityRole`, …) go to the pressable;
 * `style` overrides the inner `Card` surface. Shares `.Header`/`.Body`/`.Footer` with `Card`.
 */
export const PressableCard = Object.assign(PressableCardRoot, sections);

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    gap: theme.spacing[3],
    ...theme.shadows.lg,
  },
  header: {
    gap: theme.spacing[1],
  },
  body: {
    gap: theme.spacing[2],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing[2],
  },
}));
