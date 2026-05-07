export type SyncStatus = "local" | "pending_sync" | "synced" | "sync_error";

export type TimestampFields = {
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sync_status: SyncStatus;
};

export type BaseEntity = TimestampFields & {
  id?: number;
  uuid: string;
};
