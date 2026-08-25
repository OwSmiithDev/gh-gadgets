import { card, stagger } from "./card.js";
import { escapeXml, formatNumber, truncate } from "../utils.js";
import { legend } from "./legend.js";

/**
 * SIGNATURE: anel segmentado com gaps reais entre as fatias.
 * Repositorios sao unidades discretas - o grafico trata cada linguagem como
 * uma peca separavel, nao como fatia de uma pizza continua.
 *
 * langs: [{ name, color, percent }]
 */
export function renderDonutCard(langs, opts = {}) {
  const {
    theme,
    width = 340,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    title = "Linguagens por repositório",
    centerValue = 0,
    centerLabel = "Repositórios",
    locale = "pt-BR",
    ringWidth = 20,
  } = opts;

  const pad = 25;
  const contentW = width - pad * 2;
  const r = Math.min(68, contentW / 2 - ringWidth / 2 - 6);
  const cx = contentW / 2;
  const cy = r + ringWidth / 2;
  const C = 2 * Math.PI * r;
  const gapPx = langs.length > 1 ? 3 : 0;

  if (!langs.length) {
    return card({
      width,
      height: 120,
      title,
      theme,
      hideBorder,
      hideTitle,
      disableAnimations,
      pad,
      body: `<text x="0" y="16" class="t-label">Nenhuma linguagem pública encontrada.</text>`,
    });
  }

  let offset = 0;
  const arcs = langs
    .map((l, i) => {
      const arc = (l.percent / 100) * C;
      const dash = Math.max(1, arc - gapPx);
      const seg = `<circle cx="${cx}" cy="${cy}" r="${r}"
        fill="none" stroke="${l.color}" stroke-width="${ringWidth}"
        stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}"
        class="fade"${stagger(i, disableAnimations)}>
        <title>${escapeXml(l.name)} — ${l.percent.toFixed(1)}%</title>
      </circle>`;
      offset += arc;
      return seg;
    })
    .join("\n      ");

  const legendTop = cy + r + ringWidth / 2 + 30;
  const { markup: legendMarkup, height: legendH, styles } = legend(langs, {
    theme,
    contentW,
    top: legendTop,
    disableAnimations,
    locale,
  });

  const contentH = legendTop + legendH;
  const height = pad * 2 + (hideTitle ? 0 : 34) + contentH;

  const body = `<style>
      ${styles}
    </style>

    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${theme.surface}" stroke-width="${ringWidth}" />

    <g transform="rotate(-90 ${cx} ${cy})">
      ${arcs}
    </g>

    <text x="${cx}" y="${cy + 5}" text-anchor="middle" class="t-big">${escapeXml(
      formatNumber(centerValue, locale)
    )}</text>
    <text x="${cx}" y="${cy + 25}" text-anchor="middle" class="t-eyebrow">${escapeXml(
      String(centerLabel).toUpperCase()
    )}</text>

    ${legendMarkup}`;

  return card({
    width,
    height,
    title: truncate(title, contentW, 15, 600),
    theme,
    hideBorder,
    hideTitle,
    disableAnimations,
    pad,
    body,
  });
}
