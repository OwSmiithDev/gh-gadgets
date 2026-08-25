// A API do GitHub ja devolve a cor do Linguist na maioria dos casos.
// Este modulo cobre o resto: linguagem sem cor oficial (o campo vem null)
// nunca pode virar stroke="undefined" e sumir do anel.

const LINGUIST = {
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572A5",
  java: "#b07219",
  "c#": "#178600",
  "c++": "#f34b7d",
  c: "#555555",
  go: "#00ADD8",
  rust: "#dea584",
  ruby: "#701516",
  php: "#4F5D95",
  swift: "#F05138",
  kotlin: "#A97BFF",
  dart: "#00B4AB",
  scala: "#c22d40",
  elixir: "#6e4a7e",
  erlang: "#B83998",
  haskell: "#5e5086",
  lua: "#000080",
  perl: "#0298c3",
  r: "#198CE7",
  julia: "#a270ba",
  zig: "#ec915c",
  nim: "#ffc200",
  ocaml: "#ef7a08",
  clojure: "#db5855",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  less: "#1d365d",
  vue: "#41b883",
  svelte: "#ff3e00",
  astro: "#ff5a03",
  shell: "#89e051",
  powershell: "#012456",
  dockerfile: "#384d54",
  makefile: "#427819",
  cmake: "#DA3434",
  sql: "#e38c00",
  plpgsql: "#336790",
  "vim script": "#199f4b",
  "emacs lisp": "#c065db",
  tex: "#3D6117",
  markdown: "#083fa1",
  "jupyter notebook": "#DA5B0B",
  "objective-c": "#438eff",
  assembly: "#6E4C13",
  solidity: "#AA6746",
  hcl: "#844FBA",
  yaml: "#cb171e",
  json: "#292929",
  batchfile: "#C1F12E",
  groovy: "#4298b8",
  "f#": "#b845fc",
  crystal: "#000100",
  gleam: "#ffaff3",
  mojo: "#ff4c1f",
};

/**
 * Fallback deterministico: mesma linguagem sempre recebe a mesma cor, entre
 * execucoes e entre maquinas, senao o card "piscaria" de cor a cada render.
 */
function fallbackColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  // Saturacao e luminosidade fixas em faixa segura: garante contraste tanto
  // no tema escuro quanto no claro, sem cor lavada nem fluorescente.
  const sat = 58 + (hash >> 9) % 18; // 58-75%
  const light = 52 + (hash >> 17) % 12; // 52-63%
  return hslToHex(hue, sat, light);
}

function hslToHex(h, s, l) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const value = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Cor da API > paleta do Linguist > fallback deterministico. */
export function languageColor(name, apiColor) {
  if (apiColor && /^#[0-9a-f]{3,8}$/i.test(apiColor)) return apiColor;
  const key = String(name || "").toLowerCase();
  return LINGUIST[key] || fallbackColor(key || "unknown");
}

/** Cinza neutro da fatia "Outras" - vem do tema, nao de uma linguagem. */
export const OTHERS_COLOR = "#8b949e";
