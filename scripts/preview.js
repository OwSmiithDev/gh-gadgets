// Renderiza os tres cards com dados falsos, sem token e sem rede.
// Serve para ajustar o visual: e o loop rapido do projeto.
//
//   node scripts/preview.js                  # tema obsidian -> preview/
//   node scripts/preview.js paper            # tema claro
//   node scripts/preview.js obsidian docs    # grava noutra pasta
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MOCK } from "./mock-data.js";
import { aggregate, topLanguages, reposWithCode } from "../src/stats.js";
import { resolveTheme, THEME_NAMES } from "../src/render/themes.js";
import { renderStatsCard } from "../src/render/stats-card.js";
import { renderLangsCard } from "../src/render/langs-card.js";
import { renderDonutCard } from "../src/render/donut-card.js";

const themeName = process.argv[2] || "obsidian";
if (!THEME_NAMES.includes(themeName)) {
  console.error(`Tema desconhecido: "${themeName}". Disponíveis: ${THEME_NAMES.join(", ")}`);
  process.exit(1);
}

const { stats, repos } = aggregate(MOCK);
const base = { theme: resolveTheme(themeName), locale: "pt-BR" };
const outDir = process.argv[3] || "preview";

mkdirSync(outDir, { recursive: true });

const files = {
  "stats.svg": renderStatsCard(stats, base),
  "donut.svg": renderDonutCard(topLanguages(repos, { limit: 6, mode: "repo" }), {
    ...base,
    centerValue: reposWithCode(repos),
    centerLabel: "Com código",
  }),
  "langs.svg": renderLangsCard(topLanguages(repos, { limit: 6, mode: "bytes" }), base),
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(outDir, name), svg);
  console.log(`✓ ${join(outDir, name)}`);
}

console.log(`\nTema "${themeName}" — dados falsos, nenhuma chamada de rede.`);
