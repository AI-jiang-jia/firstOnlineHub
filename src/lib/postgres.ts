import { Pool } from "pg";

let pool: Pool | null = null;

export function getSessionPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_URL.includes("sslmode=require")
        ? undefined
        : { rejectUnauthorized: false }
    });
  }

  return pool;
}

export async function saveRegistrationForm(input: {
  authUserId: string;
  email: string;
  fullName: string;
  source: string;
}) {
  const pool = getSessionPool();

  await pool.query(
    `
      insert into public.registrations (
        auth_user_id,
        email,
        full_name,
        source,
        form_payload
      )
      values ($1, $2, $3, $4, $5::jsonb)
      on conflict (auth_user_id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        source = excluded.source,
        form_payload = excluded.form_payload,
        updated_at = now()
    `,
    [
      input.authUserId,
      input.email,
      input.fullName,
      input.source,
      JSON.stringify({
        email: input.email,
        fullName: input.fullName
      })
    ]
  );
}
