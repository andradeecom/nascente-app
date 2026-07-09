/**
 * Option shape for settings pickers. The picker UI now lives in the native
 * `SettingsGroup` molecule (SwiftUI `Form` / Compose); this type is kept here as
 * the shared `{ value, label }` shape consumed by `use-settings-screen`.
 */
export type PickerOption<T extends string> = {
  value: T;
  label: string;
};
