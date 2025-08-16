import postgres from "postgres";
import { serve } from "bun";

// postgres.js จะสร้าง pool ให้อัตโนมัติ
const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,   // ใช้ `username` แทน `user`
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  max: 10,               // จำนวน connection สูงสุด
  idle_timeout: 60,      // วินาที
  connect_timeout: 60,   // วินาที
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

        const [user] = await sql`
          INSERT INTO users (username, email)
          VALUES (${username}, ${email})
          RETURNING user_id
        `;

        return new Response(JSON.stringify({ 
          message: "User created successfully", 
          user_id: user.user_id 
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: "Database error", detail: String(error) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

    } else if (req.method === "GET" && pathname.startsWith("/users/")) {
      const parts = pathname.split("/");
      const intUserId = parts[2];

      if (intUserId && !isNaN(Number(intUserId))) {
        try {
          const [user] = await sql`
            SELECT user_id, username, email
            FROM users
            WHERE user_id = ${intUserId}
          `;

          if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(user), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        } catch (error) {
          return new Response(JSON.stringify({ error: "Database error", detail: String(error) }), {
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
