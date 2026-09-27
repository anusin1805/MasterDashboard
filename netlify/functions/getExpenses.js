import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  // Initialize Neon connection using your Netlify environment variable
  const sql = neon(process.env.NEON_AUTH_TOKEN);

  try {
    // Run a SQL query against Neon Postgres
    const expenses = await sql`SELECT * FROM expenses ORDER BY id DESC;`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenses),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
