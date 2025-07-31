import { Pool } from "pg";
import { serve } from "bun";

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  max: 10,              // จำนวน connection สูงสุด
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000
});

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/") {
      return new Response(JSON.stringify({ message: "Hello World from Bun" }), {
        headers: { "Content-Type": "application/json" },
      });

    } else if (req.method === "POST" && pathname === "/users") {
      try {
        const { username, email } = await req.json();
        if (!username || !email) {
          return new Response(JSON.stringify({ error: "username and email are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const result = await pool.query(
          "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING user_id",
          [username, email]
        );

        return new Response(JSON.stringify({ message: "User created successfully", user_id: result.rows[0].user_id }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: "Database error", detail: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

    } else if (req.method === "GET" && pathname.startsWith("/users/")) {
      const parts = pathname.split("/");
      const intUserId = parts[2];

      if (intUserId && !isNaN(Number(intUserId))) {
        try {
          const result = await pool.query(
            "SELECT user_id, username, email FROM users WHERE user_id = $1",
            [intUserId]
          );

          if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.rows[0]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        } catch (error) {
          return new Response(JSON.stringify({ error: "Database error", detail: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

      } else {
        return new Response(JSON.stringify({ error: "Invalid user_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

    } else {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
