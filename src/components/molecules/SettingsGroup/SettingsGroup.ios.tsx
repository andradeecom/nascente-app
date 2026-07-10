import {
  Host,
  Form,
  Section,
  Picker as SwiftUIPicker,
  Button as SwiftUIButton,
  HStack,
  Spacer,
  Image,
  Text,
} from '@expo/ui/swift-ui';
import {
  tag,
  foregroundStyle,
  buttonStyle,
  listStyle,
  scrollContentBackground,
  listRowBackground,
} from '@expo/ui/swift-ui/modifiers';
import { UnistylesRuntime } from 'react-native-unistyles';
import { hapticSelect } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme';
import type { SettingsGroupProps, SettingsGroupItem } from './SettingsGroup.types';

/**
 * iOS: the settings body as a single native SwiftUI **Form** (inset-grouped
 * list) — pickers (Language/Theme) render as labeled menu rows, nav rows render
 * as tappable `Button`s with a trailing value + chevron, matching the native
 * iOS Settings look. This replaces stacking a RN card list next to a separate
 * picker card (which floated in an ugly grey box).
 *
 * One `<Host>` wraps the whole Form (SwiftUI views share a host). It fills the
 * available space (`useViewportSizeMeasurement` — `Form` wants to fill, so its
 * grouped background becomes the screen area below the profile card).
 *
 * **Theming the background:** SwiftUI `Form` paints its own `.systemGrouped`
 * background (light grey), which ignores our Unistyles theme (clashes with
 * sepia). We hide it with `scrollContentBackground('hidden')` + a transparent
 * Host, so the RN `SafeAreaView`'s `bgSecondary` shows through as the container;
 * the row cards get `listRowBackground(bgPrimary)`. `colorScheme` +
 * `seedColor`(accent) come from the app theme.
 *
 * Native module → requires a dev/standalone build (not Expo Go).
 */
export function SettingsGroup({ sections }: SettingsGroupProps) {
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);
  const rowBackground = listRowBackground(colors.semantic.bgPrimary);

  return (
    <Host
      style={{ flex: 1, backgroundColor: 'transparent' }}
      useViewportSizeMeasurement
      colorScheme={themeName === 'dark' ? 'dark' : 'light'}
      seedColor={colors.semantic.accent}
    >
      <Form modifiers={[listStyle('insetGrouped'), scrollContentBackground('hidden')]}>
        {sections.map((section) => (
          <Section key={section.key} modifiers={[rowBackground]}>
            {section.items.map((item) => renderItem(item, colors.semantic.textSecondary))}
          </Section>
        ))}
      </Form>
    </Host>
  );
}

function renderItem(item: SettingsGroupItem, secondaryColor: string) {
  if (item.type === 'picker') {
    return (
      <SwiftUIPicker
        key={item.key}
        label={item.label}
        selection={item.selectedValue}
        onSelectionChange={(value) => {
          if (value != null && value !== item.selectedValue) {
            hapticSelect();
            item.onValueChange(value as string);
          }
        }}
      >
        {item.options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </SwiftUIPicker>
    );
  }

  // Nav row: full-width tappable button laid out as `label … value ›`.
  return (
    <SwiftUIButton key={item.key} modifiers={[buttonStyle('plain')]} onPress={item.onPress}>
      <HStack spacing={8}>
        <Text>{item.label}</Text>
        <Spacer />
        {item.value ? <Text modifiers={[foregroundStyle(secondaryColor)]}>{item.value}</Text> : null}
        <Image systemName="chevron.right" size={13} color={secondaryColor} />
      </HStack>
    </SwiftUIButton>
  );
}
