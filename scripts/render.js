// Renderiza os cards em arquivos SVG, sem servidor.
// Usado pelo GitHub Actions para commitar os cards direto no repositorio,
// o que contorna o cache do camo (o arquivo vive no repo, nao numa URL externa).
//
//   node scripts/render.js --user=smiith --out=assets --theme=obsidian
//
// Cada card pode receber parametros proprios via --donut="count_mode=repo&center=code"
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getUserData, topLanguages, reposWithCode } from "../src/stats.js";
import { resolveTheme } from "../src/render/themes.js";
import { renderStatsCard } from "../src/render/stats-card.js";
import { renderLangsCard } from "../src/render/langs-card.js";
import { renderDonutCard } from "../src/render/donut-card.js";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=") || "true"];
  })
);

const user = args.user || process.env.GH_USER;
if (!user) {
  console.error("Uso: node scripts/render.js --user=SEU_LOGIN [--out=assets] [--theme=obsidian] [--suffix=-light]");
  process.exit(1);
}

const outDir = args.out || "assets";
// --suffix=-light grava donut-light.svg na mesma pasta, para o par <picture>
// do README apontar para um caminho so.
const suffix = args.suffix || "";
const extra = (name) => Object.fromEntries(new URLSearchParams(args[name] || ""));

const base = {
  theme: resolveTheme(args.theme || "obsidian"),
  locale: args.locale || "pt-BR",
  hideBorder: args.hide_border === "true",
  disableAnimations: args.disable_animations === "true",
};

let stats, repos;
try {
  if (args.mock === "true") {
    const { MOCK } = await import("./mock-data.js");
    const { aggregate } = await import("../src/stats.js");
    ({ stats, repos } = aggregate(MOCK));
  } else {
    ({ stats, repos } = await getUserData(user, { force: true }));
  }
} catch (e) {
  // Mensagem limpa em vez de stack trace: o log do Actions fica legível.
  console.error(`\nErro ao buscar dados de "${user}": ${e.message}`);
  if (!process.env.PAT_1 && !process.env.GITHUB_TOKEN) {
    console.error("Dica: o secret PAT_1 não chegou ao workflow. Confira Settings → Secrets → Actions.");
  }
  process.exit(1);
}

const donutOpts = extra("donut");
const langsOpts = extra("langs");

const langsForDonut = topLanguages(repos, {
  limit: Number(donutOpts.langs_count) || 6,
  mode: donutOpts.count_mode === "repo" ? "repo" : "bytes",
  exclude: (donutOpts.exclude_langs || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
});

const langsForBar = topLanguages(repos, {
  limit: Number(langsOpts.langs_count) || 6,
  mode: langsOpts.count_mode === "repo" ? "repo" : "bytes",
  exclude: (langsOpts.exclude_langs || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
});

const centerValue =
  donutOpts.center === "code"
    ? reposWithCode(repos)
    : donutOpts.center === "stars"
      ? stats.stars
      : donutOpts.center === "contributions"
        ? stats.contributions
        : stats.repos;

mkdirSync(outDir, { recursive: true });

const files = {
  [`stats${suffix}.svg`]: renderStatsCard(stats, base),
  [`donut${suffix}.svg`]: renderDonutCard(langsForDonut, {
    ...base,
    centerValue,
    centerLabel:
      donutOpts.center_label ||
      { stars: "Estrelas", contributions: "Contribuições", code: "Com código" }[donutOpts.center] ||
      "Repositórios",
  }),
  [`langs${suffix}.svg`]: renderLangsCard(langsForBar, base),
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(outDir, name), svg);
  console.log(`✓ ${join(outDir, name)}`);
}

console.log(
  `\n${stats.name}: ${stats.repos} repos · ${stats.stars} estrelas · ${stats.contributions} contribuições`
);
