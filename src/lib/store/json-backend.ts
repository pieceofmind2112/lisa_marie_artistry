import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { TableBackend } from "./backend";
import type { Row, TabDef } from "./schema";

type Db = Record<string, Row[]>;

/** Demo-mode storage: a JSON file in .data/ so the app can be tried without any Google setup. */
export class JsonBackend implements TableBackend {
  private readonly file = path.join(process.cwd(), ".data", "demo.json");
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<Db> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as Db;
    } catch {
      return {};
    }
  }

  private async write(db: Db): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(db, null, 2));
  }

  /** Serialize writes so concurrent requests don't clobber each other. */
  private mutate<T>(fn: (db: Db) => T): Promise<T> {
    const next = this.queue.then(async () => {
      const db = await this.read();
      const out = fn(db);
      await this.write(db);
      return out;
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  async readAll(tab: TabDef): Promise<Row[]> {
    await this.queue;
    return (await this.read())[tab.name] ?? [];
  }

  append(tab: TabDef, row: Row): Promise<void> {
    return this.mutate((db) => {
      (db[tab.name] ??= []).push(row);
    });
  }

  update(tab: TabDef, id: string, row: Row): Promise<boolean> {
    return this.mutate((db) => {
      const rows = db[tab.name] ?? [];
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) return false;
      rows[i] = row;
      return true;
    });
  }

  remove(tab: TabDef, id: string): Promise<boolean> {
    return this.mutate((db) => {
      const rows = db[tab.name] ?? [];
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) return false;
      rows.splice(i, 1);
      return true;
    });
  }
}
