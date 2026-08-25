// Baixa de tandpfun/skill-icons apenas os icones referenciados em icon-map.js
// e gera src/render/icon-data.js com cada um em base64.
//
//   node scripts/fetch-icons.js
//
// Por que base64 num modulo JS, e nao arquivos lidos em runtime:
//   - SVG exibido via <img> (como o GitHub faz) nao carrega recurso externo;
//     o icone precisa viajar dentro do proprio card.
//   - data: URI isola cada icone. 156 dos icones do repositorio usam ids de
//     gradiente gerados pelo Figma ("paint0_linear_..."), que colidiriam entre si
//     se fossem inlinados como SVG aninhado no mesmo documento.
//   - modulo JS funciona igual em Vercel, Workers, Deno e no Actions, sem
//     depender de fs nem de configuracao de bundling.
import { writeFileSync } from "node:fs";
import { requiredFiles } from "../src/render/icon-map.js";

const REPO = "tandpfun/skill-icons";
const REF = process.env.ICONS_REF || "main";
const BASE = `https://raw.githubusercontent.com/${REPO}/${REF}/icons`;
const OUT = "src/render/icon-data.js";

async function fetchIcon(name) {
  const res = await fetch(`${BASE}/${name}.svg`);
  if (!res.ok) throw new Error(`${name}.svg → HTTP ${res.status}`);
  const svg = await res.text();
  if (!svg.trimStart().startsWith("<svg")) throw new Error(`${name}.svg não é um SVG`);
  return svg.trim();
}

const files = requiredFiles();
console.log(`Baixando ${files.length} ícones de ${REPO}@${REF}...`);

const entries = [];
let failures = 0;

// Em lotes: 94 requisicoes de uma vez levam o raw.githubusercontent a recusar.
const BATCH = 8;
for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  const results = await Promise.allSettled(batch.map(fetchIcon));
  results.forEach((r, j) => {
    const name = batch[j];
    if (r.status === "fulfilled") {
      entries.push([name, Buffer.from(r.value, "utf8").toString("base64")]);
    } else {
      console.error(`  ✗ ${name}: ${r.reason.message}`);
      failures++;
    }
  });
  process.stdout.write(`\r  ${Math.min(i + BATCH, files.length)}/${files.length}`);
}
process.stdout.write("\n");

if (failures) {
  console.error(`\n${failures} ícone(s) falharam — icon-data.js não foi regravado.`);
  process.exit(1);
}

entries.sort((a, b) => a[0].localeCompare(b[0]));

const body = entries.map(([name, b64]) => `  ${JSON.stringify(name)}: "${b64}",`).join("\n");
const header = `// GERADO por scripts/fetch-icons.js — não edite à mão.
// Ícones de https://github.com/${REPO} (@${REF}), licença MIT.
// Cada valor é o SVG original em base64, pronto para virar data: URI.

export const ICON_DATA = {
${body}
};
`;

writeFileSync(OUT, header);
const kb = (Buffer.byteLength(header) / 1024).toFixed(0);
console.log(`✓ ${OUT} — ${entries.length} ícones, ${kb} KB`);
