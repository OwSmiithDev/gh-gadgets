import { handle } from "../src/handler.js";

// Assinatura (req, res) da Vercel. req.query já vem parseado pelos helpers
// do runtime Node. setHeader em vez de writeHead: assim os headers ficam
// legíveis por qualquer camada que inspecione a resposta antes do flush.
export default async function handler(req, res) {
  const { status, headers, body } = await handle("langs", req.query || {});
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.statusCode = status;
  res.end(body);
}
