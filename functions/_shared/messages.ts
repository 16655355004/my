import { ensureSchema } from "./db";
import type { Env } from "./shortlinks";

export interface Message {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

const maxMessages = 100;

type MessageRow = {
  id: string;
  name: string;
  content: string;
  created_at: string;
};

export const listMessages = async (env: Env, limit = maxMessages): Promise<Message[]> => {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM messages ORDER BY created_at DESC LIMIT ?",
  ).bind(limit).all<MessageRow>();
  return (results || []).map((row) => ({
    id: row.id,
    name: row.name,
    content: row.content,
    createdAt: row.created_at,
  }));
};

export const insertMessage = async (env: Env, message: Message) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO messages (id, name, content, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      content = excluded.content,
      created_at = excluded.created_at
  `).bind(message.id, message.name, message.content, message.createdAt).run();

  // Keep newest N messages.
  await env.DB.prepare(`
    DELETE FROM messages
    WHERE id NOT IN (
      SELECT id FROM messages ORDER BY created_at DESC LIMIT ?
    )
  `).bind(maxMessages).run();
};

export const countMessages = async (env: Env): Promise<number> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM messages").first<{ count: number }>();
  return row?.count || 0;
};
