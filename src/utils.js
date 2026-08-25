// Helpers sem dependencia externa. Tudo que entra em SVG passa por aqui primeiro.

const XML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

/** Escapa para conteudo de texto e valor de atributo em SVG. */
export function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

export function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** "true"/"1"/"" presente na query vale true; ausente ou "false" vale false. */
export function parseBool(value) {
  if (value === undefined || value === null) return false;
  const v = String(value).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "";
}

/** "html, css , scss" -> ["html","css","scss"] */
export function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** pt-BR usa separador de milhar "."; en usa ",". Acima de 1e5 abrevia com "k". */
export function formatNumber(n, locale = "pt-BR") {
  const num = Number(n) || 0;
  if (Math.abs(num) >= 100000) {
    const k = num / 1000;
    const rounded = k >= 100 ? Math.round(k) : Math.round(k * 10) / 10;
    return String(rounded).replace(".", locale.startsWith("pt") ? "," : ".") + "k";
  }
  return num.toLocaleString(locale.startsWith("pt") ? "pt-BR" : "en-US");
}

// Larguras relativas ao font-size, medidas na Segoe UI / Helvetica em peso 400.
// Nao precisa ser exato: serve para decidir onde truncar e alinhar a legenda.
const NARROW = new Set([..."iljtfIr.,:;'`|!()[]{}/\-"]);
const WIDE = new Set([..."mwMW@%"]);
const DEFAULT_RATIO = 0.52;

/** Largura aproximada do texto em px. `weight` >= 600 engorda ~4%. */
export function textWidth(text, size = 12, weight = 400) {
  let units = 0;
  for (const ch of String(text ?? "")) {
    if (NARROW.has(ch)) units += 0.31;
    else if (WIDE.has(ch)) units += 0.84;
    else if (ch === " ") units += 0.27;
    else if (ch >= "0" && ch <= "9") units += 0.55;
    else if (ch >= "A" && ch <= "Z") units += 0.63;
    else units += DEFAULT_RATIO;
  }
  const bold = weight >= 600 ? 1.04 : 1;
  return units * size * bold;
}

/**
 * Corta o texto para caber em `maxWidth` px, com reticencias.
 * `weight` tem default porque handler.js chama com 3 args e donut-card.js com 4.
 */
export function truncate(text, maxWidth, fontSize = 12, weight = 400) {
  const str = String(text ?? "");
  if (maxWidth <= 0) return "";
  if (textWidth(str, fontSize, weight) <= maxWidth) return str;

  const ellipsis = "…";
  const budget = maxWidth - textWidth(ellipsis, fontSize, weight);
  if (budget <= 0) return ellipsis;

  let out = "";
  let width = 0;
  for (const ch of str) {
    const w = textWidth(ch, fontSize, weight);
    if (width + w > budget) break;
    out += ch;
    width += w;
  }
  return out.trimEnd() + ellipsis;
}
