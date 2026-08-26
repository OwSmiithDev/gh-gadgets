import { card, stagger } from "./card.js";
import { markerFor } from "./legend.js";
import { glyph } from "./glyphs.js";
import { readableOn } from "../colors.js";
import { escapeXml, truncate, textWidth } from "../utils.js";
import { FONT_STACK } from "./themes.js";

const ROW_H = 32;
const ROW_GAP = 8;
const COL_GAP = 22;
const TILE = 22;
const BAR_H = 8;

/**
 * Alcance de cada linguagem: em quantos repositorios ela aparece.
 *
 * Cada barra e INDEPENDENTE, de 0 a 100% dos repositorios. Nao ha todo a
 * compor: uma linguagem conta em varios repositorios ao mesmo tempo, entao a
 * soma passa de 100%. Por isso barras separadas em vez de anel ou barra
 * composta - as duas formas afirmam visualmente "isto soma 100%", e aqui isso
 * seria mentira.
 *
 * O numero exibido e a contagem, nao o percentual: "6/8" diz mais que "75%", e
 * a proporcao ja esta na barra. O percentual fica no tooltip, sem gastar
 * largura repetindo o que a barra mostra.
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

  const pad = 24;
  const contentW = width - pad * 2;
  const { total = 0, langs = [] } = spread || {};

  if (!langs.length) {
    return card({
      width,
      height: 116,
      title,
      theme,
      hideBorder,
      hideTitle,
      disableAnimations,
      pad,
      body: `<text x="0" y="14" class="t-label">Nenhuma linguagem pública encontrada.</text>`,
    });
  }

  // ─── Grade ────────────────────────────────────────────────────────────────
  // Duas colunas a partir de quatro linguagens, como no /langs. Abaixo disso a
  // segunda coluna ficaria vazia e a linha, esticada.
  const cols = langs.length >= 4 ? 2 : 1;
  const colW = (contentW - COL_GAP * (cols - 1)) / cols;
  const rows = Math.ceil(langs.length / cols);

  // A maior contagem define a largura reservada à direita, para as barras de
  // todas as linhas terminarem no mesmo x. Barras com fins diferentes não são
  // comparáveis a olho, que é o ponto do card.
  const maiorContagem = `${Math.max(...langs.map((l) => l.repos))}/${total}`;
  const countW = Math.ceil(textWidth(maiorContagem, 12.5, 700)) + 10;

  const nameX = TILE + 10;
  const nameW = Math.round(colW * 0.34);
  const barX = nameX + nameW + 12;
  const barW = colW - barX - countW;

  // Preenche coluna por coluna: a leitura desce em ranking, como uma lista, em
  // vez de zigue-zaguear entre as colunas.
  const linhas = langs
    .map((l, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const x = col * (colW + COL_GAP);
      const y = row * (ROW_H + ROW_GAP);
      const mid = ROW_H / 2;

      // Piso de 3px: uma linguagem em 1 de 84 repositórios daria menos de um
      // pixel e sumiria, quando o que o card diz é justamente que ela existe.
      const fill = Math.max(3, (l.share / 100) * barW);
      const contagem = `${l.repos}/${total}`;
      const pct = l.share.toFixed(0).replace(".", locale.startsWith("pt") ? "," : ".");
      const label = truncate(l.name, nameW, 13, 500);

      return `<g transform="translate(${x.toFixed(1)}, ${y})" class="fade"${stagger(i, disableAnimations)}>
        <g transform="translate(0, ${(ROW_H - TILE) / 2})">
          ${markerFor(l, theme, TILE, 0)}
        </g>
        <text x="${nameX}" y="${mid + 4.5}" class="t-name">${escapeXml(label)}</text>

        <rect x="${barX.toFixed(1)}" y="${mid - BAR_H / 2}" width="${barW.toFixed(1)}"
              height="${BAR_H}" rx="${BAR_H / 2}" fill="${theme.surface}" />
        <rect x="${barX.toFixed(1)}" y="${mid - BAR_H / 2}" width="${fill.toFixed(1)}"
              height="${BAR_H}" rx="${BAR_H / 2}" fill="${l.color}" />

        <text x="${colW.toFixed(1)}" y="${mid + 4.5}" text-anchor="end"
              class="t-count" fill="${readableOn(l.color, theme.ink)}">${escapeXml(contagem)}</text>

        <title>${escapeXml(l.name)} — em ${l.repos} de ${total} repositórios (${pct}%)</title>
      </g>`;
    })
    .join("\n      ");

  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  const headerH = hideTitle ? 0 : 50;
  const totalTexto = `${total} ${total === 1 ? "repositório" : "repositórios"}`;
  const totalW = textWidth(totalTexto, 12, 400);
  const header = hideTitle
    ? ""
    : `<g>
      <rect x="0" y="0" width="34" height="34" rx="9"
            fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1" opacity="0.9" />
      ${glyph("repo", 17, theme.accent, { x: 8.5, y: 8.5 })}
      <text x="46" y="23" class="t-h1">${escapeXml(
        truncate(title, contentW - 46 - totalW - 16, 17, 700)
      )}</text>
      <text x="${contentW}" y="23" text-anchor="end" class="t-total">${escapeXml(totalTexto)}</text>
    </g>`;

  const height = pad * 2 + headerH + rows * ROW_H + (rows - 1) * ROW_GAP;

  const body = `<style>
      .t-h1    { font: 700 17px ${FONT_STACK}; fill: ${theme.text}; }
      .t-total { font: 400 12px ${FONT_STACK}; fill: ${theme.muted}; }
      .t-name  { font: 500 13px ${FONT_STACK}; fill: ${theme.text}; }
      .t-count { font: 700 12.5px ${FONT_STACK}; font-variant-numeric: tabular-nums; }
    </style>

    ${header}

    <g transform="translate(0, ${headerH})">
      ${linhas}
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
