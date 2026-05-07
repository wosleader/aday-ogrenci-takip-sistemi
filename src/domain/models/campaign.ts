import type { BaseEntity } from "./base";

export type CampaignRecord = BaseEntity & {
  name: string;
  is_default: boolean;
  is_active: boolean;
};
