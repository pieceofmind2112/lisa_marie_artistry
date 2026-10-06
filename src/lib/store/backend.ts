import type { Row, TabDef } from "./schema";

/** Minimal table storage: the Google Sheet in production, a JSON file in demo mode. */
export interface TableBackend {
  readAll(tab: TabDef): Promise<Row[]>;
  append(tab: TabDef, row: Row): Promise<void>;
  /** Replaces the row whose `id` matches. Returns false when no such row exists. */
  update(tab: TabDef, id: string, row: Row): Promise<boolean>;
  remove(tab: TabDef, id: string): Promise<boolean>;
}
