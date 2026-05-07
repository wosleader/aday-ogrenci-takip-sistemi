export type SettingRecord = {
  key: string;
  value: string;
  updated_at: string;
};

export type KeyboardShortcutRecord = {
  id?: number;
  action_key: string;
  label: string;
  shortcut: string;
  is_active: boolean;
  updated_at: string;
};
