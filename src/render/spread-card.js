import { card, stagger } from "./card.js";
import { markerFor } from "./legend.js";
import { glyph } from "./glyphs.js";
import { readableOn } from "../colors.js";
import { escapeXml, truncate, textWidth } from "../utils.js";
import { FONT_STACK } from "./themes.js";

const ROW_H = 46;
const ROW_GAP = 10;
const TILE = 30;
const BAR_H = 10;

/**
 * Alcance de cada linguagem: em quantos repositorios ela aparece.
 *
 * Cada barra e INDEPENDENTE, de 0 a 100% dos repositorios. Nao ha todo a
 * compor: uma linguagem conta em varios repositorios ao mesmo tempo, entao a
 * soma passa de 100%. Por isso barras separadas em vez de anel ou barra
 * composta - as duas formas afirmam visualmente "isto soma 100%", e aqui isso
 * seria mentira.
 *
 * spread: { total, langs: [{ name, color, repos, share }] } vindo de
 * languageSpread() em src/stats.js.
 */
export function renderSpreadCard(spread, opts = {}) {
  const {
    theme,
    width = 760,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    title = "Linguagens por alcance",
    locale = "pt-BR",
  } = opts;

  const pad = 28;
  const contentW = width - pad * 2;
  const { total = 0, langs = [] } = spread || {};

  if (!langs.length) {
    return card({
      width,
      height: 128,
      title,
      theme,
      hideBorder,
      hideTitle,
      disableAnimations,
      pad,
      body: `<text x="0" y="16" class="t-label">Nenhuma linguagem pública encontrada.</text>`,
    });
  }

  // ─── Colunas ──────────────────────────────────────────────────────────────
  // O nome ganha largura fixa para as barras começarem todas no mesmo x —
  // barras desalinhadas não são comparáveis a olho, que é o ponto do card.
  const nameX = TILE + 12;
  const nameW = Math.round(contentW * 0.2);
  const barX = nameX + nameW + 16;
  const rightW = 104;
  const barW = contentW - barX - rightW;

  const rows = langs
    .map((l, i) => {
      const y = i * (ROW_H + ROW_GAP);
      const mid = ROW_H / 2;

      // Piso de 3px: uma linguagem em 1 de 84 repositórios daria uma barra de
      // meio pixel e sumiria, quando o que o card quer dizer é justamente que
      // ela existe e é rara.
      const fill = Math.max(3, (l.share / 100) * barW);
      const pct = l.share.toFixed(0).replace(".", locale.startsWith("pt") ? "," : ".");
      const contagem = `${l.repos} / ${total}`;
      const label = truncate(l.name, nameW, 14, 500);

      return `<g transform="translate(0, ${y})" class="fade"${stagger(i, disableAnimations)}>
        <g transform="translate(0, ${(ROW_H - TILE) / 2})">
          ${markerFor(l, theme, TILE, 0)}
        </g>
        <text x="${nameX}" y="${mid + 5}" class="t-name">${escapeXml(label)}</text>

        <rect x="${barX}" y="${mid - BAR_H / 2}" width="${barW.toFixed(1)}" height="${BAR_H}"
              rx="${BAR_H / 2}" fill="${theme.surface}" />
        <rect x="${barX}" y="${mid - BAR_H / 2}" width="${fill.toFixed(1)}" height="${BAR_H}"
              rx="${BAR_H / 2}" fill="${l.color}" />

        <text x="${(contentW - 44).toFixed(1)}" y="${mid + 5}" text-anchor="end"
              class="t-count">${escapeXml(contagem)}</text>
        <text x="${contentW}" y="${mid + 5}" text-anchor="end"
              class="t-pct" fill="${readableOn(l.color, theme.ink)}">${pct}%</text>

        <title>${escapeXml(l.name)} — em ${l.repos} de ${total} repositórios</title>
      </g>`;
    })
    .join("\n      ");

  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  const headerH = hideTitle ? 0 : 62;
  const totalTexto = `${total} ${total === 1 ? "repositório" : "repositórios"}`;
  const header = hideTitle
    ? ""
    : `<g>
      <rect x="0" y="0" width="42" height="42" rx="11"
            fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1" opacity="0.9" />
      ${glyph("repo", 20, theme.accent, { x: 11, y: 11 })}
      <text x="56" y="29" class="t-h1">${escapeXml(
        truncate(title, contentW - 60 - textWidth(totalTexto, 12.5, 400) - 20, 20, 700)
      )}</text>
      <text x="${contentW}" y="29" text-anchor="end" class="t-total">${escapeXml(totalTexto)}</text>
    </g>`;

  const height =
    pad * 2 + headerH + 14 + langs.length * ROW_H + (langs.length - 1) * ROW_GAP;

  const body = `<style>
      .t-h1    { font: 700 20px ${FONT_STACK}; fill: ${theme.text}; }
      .t-total { font: 400 12.5px ${FONT_STACK}; fill: ${theme.muted}; }
      .t-name  { font: 500 14px ${FONT_STACK}; fill: ${theme.text}; }
      .t-count { font: 400 12.5px ${FONT_STACK}; fill: ${theme.muted};
                 font-variant-numeric: tabular-nums; }
      .t-pct   { font: 700 14px ${FONT_STACK}; font-variant-numeric: tabular-nums; }
    </style>

    ${header}

    <g transform="translate(0, ${headerH + 14})">
      ${rows}
    </g>`;

  return card({
    width,
    height,
    theme,
    hideBorder,
    hideTitle: true, // o cabeçalho é desenhado aqui, não pela casca
    disableAnimations,
    pad,
    body,
  });
}
