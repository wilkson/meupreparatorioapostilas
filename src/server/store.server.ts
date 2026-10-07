import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/** Funnel event persisted to the append-only log (one JSON line per event). */
export interface StoredEvent {
  id: string;
  /** ISO timestamp stamped by the server. */
  ts: string;
  session_id: string;
  event: string;
  step?: number;
  answer?: string;
  name?: string;
  utm?: Record<string, string>;
  referrer?: string;
  user_agent?: string;
}

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");
const EVENTS_FILE = join(DATA_DIR, "events.jsonl");

/** Serializes writes so concurrent appends never interleave lines. */
let writeChain: Promise<unknown> = Promise.resolve();

export async function appendEvent(event: Omit<StoredEvent, "id" | "ts">): Promise<StoredEvent> {
  const stored: StoredEvent = { ...event, id: randomUUID(), ts: new Date().toISOString() };
  const write = writeChain.then(() =>
    mkdir(DATA_DIR, { recursive: true }).then(() =>
      appendFile(EVENTS_FILE, `${JSON.stringify(stored)}\n`, "utf8"),
    ),
  );
  writeChain = write.catch(() => undefined); // the queue survives individual failures
  await write;
  return stored;
}

export async function readEvents(): Promise<StoredEvent[]> {
  let raw: string;
  try {
    raw = await readFile(EVENTS_FILE, "utf8");
  } catch {
    return []; // log file does not exist yet
  }
  const events: StoredEvent[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as StoredEvent);
    } catch {
      /* corrupted line — skip */
    }
  }
  return events;
}
