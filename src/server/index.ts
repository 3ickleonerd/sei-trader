import env from "../../env";
import { generateTncHtml, createAcceptanceRecord } from "./utils/tncHtml.ts";
import { tncRequestsStore } from "../telegram/store/tnc.ts";

const port = parseInt(env.PORT || "3000");

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (url.pathname === "/tnc") {
      const slug = url.searchParams.get("slug");
      const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";

      if (!slug) {
        return new Response("Missing slug parameter", { status: 400 });
      }

      const html = generateTncHtml({
        theme,
        onAcceptUrl: `/api/tnc/accept?slug=${slug}`,
        onDeclineUrl: `/api/tnc/decline?slug=${slug}`,
        title: "Terms & Conditions - Caret Sei Trading Bot",
      });

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    if (url.pathname.startsWith("/api")) {
      if (url.pathname === "/api/ping") {
        return new Response(JSON.stringify({ message: "pong" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (url.pathname === "/api/tnc/accept") {
        if (req.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        try {
          const body = await req.json();
          const slug = url.searchParams.get("slug") || body.slug;

          if (!slug) {
            return new Response(
              JSON.stringify({ error: "Missing slug parameter" }),
              {
                headers: { "Content-Type": "application/json" },
                status: 400,
              }
            );
          }

          const userAgent = req.headers.get("user-agent") || "Unknown";
          const forwardedFor = req.headers.get("x-forwarded-for");
          const realIp = req.headers.get("x-real-ip");
          const ipAddress = forwardedFor?.split(",")[0] || realIp || "Unknown";

          tncRequestsStore[slug] = {
            slug,
            tnc_version: body.version || "tnc/1",
            tnc_hash: generateTncHash(body.version || "tnc/1"),
            accepted_at: new Date().toISOString(),
            ip_address: ipAddress,
            device: userAgent,
          };

          return new Response(
            JSON.stringify({
              success: true,
              message: "Terms accepted successfully",
              slug,
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Invalid request body" }),
            {
              headers: { "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }

      if (url.pathname === "/api/tnc/decline") {
        if (req.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        try {
          const body = await req.json();
          const slug = url.searchParams.get("slug") || body.slug;

          if (!slug) {
            return new Response(
              JSON.stringify({ error: "Missing slug parameter" }),
              {
                headers: { "Content-Type": "application/json" },
                status: 400,
              }
            );
          }

          delete tncRequestsStore[slug];

          return new Response(
            JSON.stringify({
              success: true,
              message: "Terms declined",
              slug,
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Invalid request body" }),
            {
              headers: { "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }

      if (url.pathname === "/api/tnc/status") {
        const slug = url.searchParams.get("slug");

        if (!slug) {
          return new Response(
            JSON.stringify({ error: "Missing slug parameter" }),
            {
              headers: { "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        const tncRequest = tncRequestsStore[slug];

        if (!tncRequest) {
          return new Response(
            JSON.stringify({
              accepted: false,
              slug,
              message: "No TNC acceptance found for this slug",
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            }
          );
        }

        return new Response(
          JSON.stringify({
            accepted: true,
            ...tncRequest,
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      if (url.pathname === "/api/tnc/list") {
        return new Response(
          JSON.stringify({
            requests: Object.values(tncRequestsStore),
            count: Object.keys(tncRequestsStore).length,
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      return new Response(JSON.stringify({ error: "API endpoint not found" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

function generateTncHash(version: string): string {
  let hash = 0;
  const str = version + new Date().toDateString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

console.log(`🚀 Server running on port ${server.port}`);
