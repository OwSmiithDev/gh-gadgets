// Servidor local de desenvolvimento. Em producao quem serve e api/ (Vercel),
// mas os dois chamam o mesmo handle() - o que voce ve aqui e o que sobe la.
//
//   node server.js  ->  http://localhost:3000/donut?username=SEU_USER
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { handle } from "./src/handler.js";

// .env sem dependencia: dotenv seria a unica dependencia do projeto inteiro.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.PORT) || 3000;
const KINDS = new Set(["stats", "donut", "langs", "spread", "graph"]);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const segment = url.pathname.replace(/^\/+|\/+$/g, "");

  if (segment === "favicon.ico") {
    res.writeHead(204).end();
    return;
  }

  // "/" sem tipo cai no donut, que e o card assinatura.
  const kind = segment === "" ? "donut" : segment;
  if (!KINDS.has(kind)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Rotas: ${[...KINDS].map((k) => `/${k}?username=SEU_USER`).join("  ")}\n`);
    return;
  }

  const query = Object.fromEntries(url.searchParams);
  const { status, headers, body } = await handle(kind, query);
  res.writeHead(status, headers);
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`gh-gadgets em http://localhost:${PORT}`);
  for (const k of KINDS) console.log(`  http://localhost:${PORT}/${k}?username=SEU_USER`);
  if (!process.env.PAT_1 && !process.env.GITHUB_TOKEN) {
    console.log("\nAviso: nenhum PAT_1 definido — os cards vão renderizar erro.");
    console.log("Copie .env.example para .env e cole o token.");
  }
});
