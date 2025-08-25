import hono from "./api";
import path from "path";
import { serve } from "bun";
import { existsSync, statSync } from "fs";
import { getMimeType } from "./utils";
import env from "../../env";

export function createStaticFileHandler() {
  return (req: Request) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/api")) {
      return null;
    }

    if (pathname === "/") {
      const indexPath = path.join(import.meta.dir, "dist", "index.html");
      if (!existsSync(indexPath)) {
        console.warn("Static files not found. Please build the client first with: bun run build");
        return new Response("Static files not built. Please run: bun run build", { status: 503 });
      }
      const file = Bun.file(indexPath);
      return new Response(file, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache",
        },
      });
    }

    const filePath = path.join(import.meta.dir, "dist", pathname);

    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      if (stats.isDirectory()) {
        const indexPath = path.join(import.meta.dir, "dist", "index.html");
        if (!existsSync(indexPath)) {
          return new Response("Static files not built. Please run: bun run build", { status: 503 });
        }
        const file = Bun.file(indexPath);
        return new Response(file, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-cache",
          },
        });
      }
      
      const file = Bun.file(filePath);
      const mimeType = getMimeType(filePath);

      return new Response(file, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control":
            pathname === "/" || pathname.endsWith(".html")
              ? "no-cache"
              : "public, max-age=31536000",
        },
      });
    }

    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
    if (hasFileExtension) {
      const fileName = path.basename(pathname);
      const rootFilePath = path.join(import.meta.dir, "dist", fileName);
      
      if (existsSync(rootFilePath)) {
        const file = Bun.file(rootFilePath);
        const mimeType = getMimeType(rootFilePath);
        
        return new Response(file, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000",
          },
        });
      }
      
      return new Response("Not Found", { status: 404 });
    }

    const indexPath = path.join(import.meta.dir, "dist", "index.html");
    if (!existsSync(indexPath)) {
      return new Response("Static files not built. Please run: bun run build", { status: 503 });
    }
    const file = Bun.file(indexPath);
    return new Response(file, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    });
  };
}

export { hono as apiHandler };

const server = serve({
  development: false,
  port: parseInt(env.CLIENT_PORT),

  routes: {
    "/api": new Response(
      JSON.stringify({
        message: "Bun Server",
        version: "v1.0.0",
      })
    ),
    "/api/v1/*": (req) => {
      return hono.fetch(req);
    },

    "/*": (req) => {
      const staticHandler = createStaticFileHandler();
      return staticHandler(req) || new Response("Not Found", { status: 404 });
    },
  },

  fetch(req) {
    if (req.url.includes("/api/v1")) {
      return hono.fetch(req);
    }

    const staticHandler = createStaticFileHandler();
    const staticResponse = staticHandler(req);
    if (staticResponse) {
      return staticResponse;
    }

    return new Response("Not Found", { status: 404 });
  },

  error(error) {
    console.error(error);
    return new Response(`Internal Error: ${error.message}`, { status: 500 });
  },
});

console.log(`Prod server running at ${server.url} 🚀`);
console.log(`BUN VERSION: ${Bun.version}`);
