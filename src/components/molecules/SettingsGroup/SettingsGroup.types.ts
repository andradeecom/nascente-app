/** A labeled inline menu-picker row (e.g. Language, Theme). */
export type SettingsPickerItem = {
  type: 'picker';
  key: string;
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onValueChange: (value: string) => void;
};

/** A tappable row that navigates / acts, showing an optional trailing value + chevron. */
export type SettingsNavItem = {
  type: 'nav';
  key: string;
  label: string;
  /** Optional right-aligned value shown before the chevron (e.g. "16 pt"). */
  value?: string;
  onPress: () => void;
};

export type SettingsGroupItem = SettingsPickerItem | SettingsNavItem;

export type SettingsGroupSection = {
  key: string;
  items: SettingsGroupItem[];
};

export type SettingsGroupProps = {
  /** One or more native grouped sections rendered inside a single Form/list. */
  sections: SettingsGroupSection[];
};
