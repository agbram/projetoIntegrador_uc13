import { createClient } from "@neondatabase/serverless";

const client = createClient({
  connectionString: process.env.DATABASE_URL,
});

const result = await client.query("SELECT * FROM users");
console.log(result.rows);