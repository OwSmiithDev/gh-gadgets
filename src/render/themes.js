// Todo hex do projeto nasce aqui. Nenhum render inventa cor propria.

export const FONT_STACK =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, Ubuntu, 'Helvetica Neue', Helvetica, sans-serif";

/**
 * ink      fundo do card
 * surface  trilho do anel, barras de fundo, divisorias solidas
 * hairline borda do card
 * text     numeros e valores
 * muted    rotulos e legendas
 * accent   titulo e destaques
 */
const THEMES = {
  obsidian: {
    ink: "#0d1117",
    surface: "#21262d",
    hairline: "#30363d",
    text: "#e6edf3",
    muted: "#8b949e",
    accent: "#58a6ff",
  },
  paper: {
    ink: "#ffffff",
    surface: "#eaeef2",
    hairline: "#d0d7de",
    text: "#1f2328",
    muted: "#636c76",
    accent: "#0969da",
  },
  contel: {
    ink: "#111214",
    surface: "#23252a",
    hairline: "#33363d",
    text: "#f2f3f5",
    muted: "#9aa0a8",
    accent: "#ff7a18",
  },
  dracula: {
    ink: "#282a36",
    surface: "#44475a",
    hairline: "#44475a",
    text: "#f8f8f2",
    muted: "#6272a4",
    accent: "#ff79c6",
  },
  nord: {
    ink: "#2e3440",
    surface: "#3b4252",
    hairline: "#434c5e",
    text: "#eceff4",
    muted: "#81a1c1",
    accent: "#88c0d0",
  },
};

export const THEME_NAMES = Object.keys(THEMES);

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Aceita hex com ou sem "#" - na query string o "#" viraria fragmento de URL. */
function normalizeHex(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (!HEX.test(v)) return null;
  return v.startsWith("#") ? v : `#${v}`;
}

/**
 * resolveTheme("contel", { accent: "FF7A18" })
 * Nome invalido cai em obsidian; override invalido e simplesmente ignorado.
 */
export function resolveTheme(name, overrides = {}) {
  const base = THEMES[String(name || "").toLowerCase()] || THEMES.obsidian;
  const theme = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const hex = normalizeHex(value);
    if (hex && key in theme) theme[key] = hex;
  }
  return theme;
}

/**
 * Luminancia relativa do fundo decide a variante do icone (-Dark / -Light).
 * Calculado em vez de marcado a mao no tema: assim um override de bg_color
 * para uma cor clara ainda escolhe o icone certo.
 */
export function isDarkTheme(theme) {
  const hex = (theme?.ink || "#000000").replace("#", "").slice(0, 6);
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.padEnd(6, "0");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4;
}
