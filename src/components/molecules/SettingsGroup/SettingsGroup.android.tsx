import { useState } from 'react';
import { Host } from '@expo/ui';
import { Column, Row, Text, DropdownMenu, DropdownMenuItem } from '@expo/ui/jetpack-compose';
import {
  weight,
  width as widthMod,
  clickable,
  padding,
  background,
  clip,
  fillMaxWidth,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
import { UnistylesRuntime } from 'react-native-unistyles';
import { hapticSelect } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme';
import type { SettingsGroupProps, SettingsPickerItem } from './SettingsGroup.types';

/**
 * Android: the settings body as a native grouped list built from **themed
 * Compose primitives** (not the universal `FieldGroup`/`Picker`, both of which
 * are hardcoded to Material colors — `surfaceContainer` rows and a purple/blue
 * `TextField`-style picker anchor — and ignore our theme, clashing with sepia
 * and going invisible-on-dark since Compose `Text` defaults to a fixed color
 * rather than following the app theme).
 *
 * The container is a `Column` filled with `bgSecondary`; each section is a
 * rounded `Column` card filled with `bgPrimary`. **Every `Text` gets an explicit
 * themed `color`** (`textPrimary`/`textSecondary`) — Compose does not inherit
 * Unistyles' text color, so omitting it left text unreadable in dark. Picker
 * rows are hand-built from `DropdownMenu`/`DropdownMenuItem` (both support
 * color overrides) instead of the universal `Picker`, so the value pill and
 * popup are fully themed. Nav rows are a clickable `Row` with label + trailing
 * value + `'›'` chevron.
 *
 * One `<Host>` wraps everything (Compose views share a host); `colorScheme`
 * comes from the app theme.
 *
 * Native module → requires a dev/standalone build (not Expo Go).
 */
export function SettingsGroup({ sections }: SettingsGroupProps) {
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);
  const c = colors.semantic;

  return (
    <Host style={{ flex: 1 }} colorScheme={themeName === 'dark' ? 'dark' : 'light'}>
      <Column
        modifiers={[fillMaxWidth(), background(c.bgSecondary), padding(16, 16, 16, 16)]}
        verticalArrangement={{ spacedBy: 16 }}
      >
        {sections.map((section) => (
          <Column
            key={section.key}
            modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(20)), background(c.bgPrimary), padding(16, 4, 16, 4)]}
          >
            {section.items.map((item) =>
              item.type === 'picker' ? (
                <PickerRow key={item.key} item={item} textColor={c.textPrimary} pillBg={c.bgTertiary} />
              ) : (
                <NavRow
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  onPress={item.onPress}
                  textColor={c.textPrimary}
                  secondaryColor={c.textSecondary}
                />
              )
            )}
          </Column>
        ))}
      </Column>
    </Host>
  );
}

function PickerRow({ item, textColor, pillBg }: { item: SettingsPickerItem; textColor: string; pillBg: string }) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel = item.options.find((o) => o.value === item.selectedValue)?.label ?? '';

  return (
    <Row
      modifiers={[fillMaxWidth(), padding(0, 6, 0, 6)]}
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
    >
      <Text color={textColor} modifiers={[weight(1)]}>
        {item.label}
      </Text>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
        color={pillBg}
        modifiers={[widthMod(170)]}
      >
        <DropdownMenu.Trigger>
          <Row
            modifiers={[
              fillMaxWidth(),
              clip(Shapes.RoundedCorner(10)),
              background(pillBg),
              padding(10, 8, 10, 8),
              clickable(() => setExpanded(true)),
            ]}
            verticalAlignment="center"
            horizontalArrangement="spaceBetween"
          >
            <Text color={textColor}>{selectedLabel}</Text>
          </Row>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {item.options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              elementColors={{ textColor }}
              onClick={() => {
                setExpanded(false);
                if (option.value !== item.selectedValue) {
                  hapticSelect();
                  item.onValueChange(option.value);
                }
              }}
            >
              <DropdownMenuItem.Text>
                <Text color={textColor}>{option.label}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Row>
  );
}

function NavRow({
  label,
  value,
  onPress,
  textColor,
  secondaryColor,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <Row
      modifiers={[fillMaxWidth(), clickable(onPress), padding(0, 14, 0, 14)]}
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
    >
      <Text color={textColor} modifiers={[weight(1)]}>
        {label}
      </Text>
      {value ? <Text color={secondaryColor}>{value}</Text> : null}
      <Text color={secondaryColor}>{'  ›'}</Text>
    </Row>
  );
}
