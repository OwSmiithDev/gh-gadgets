import { stagger } from "./card.js";
import { iconFor } from "./icons.js";
import { escapeXml, truncate, textWidth } from "../utils.js";
import { FONT_STACK } from "./themes.js";

const SLOT = 14; // largura reservada ao marcador: icone 14x14 ou quadrado centrado nele
const GAP = 8; // entre marcador e rotulo
const ROW_PITCH = 22;

/**
 * Legenda em grade, compartilhada por /donut e /langs.
 *
 * Icone da linguagem quando o skill-icons tem um; quadrado colorido quando nao.
 * Os dois ocupam o mesmo SLOT, entao a coluna de texto fica alinhada mesmo numa
 * legenda misturando os dois casos.
 */
export function legend(langs, opts = {}) {
  const {
    theme,
    contentW,
    top = 0,
    cols = 2,
    disableAnimations = false,
    locale = "pt-BR",
    staggerFrom = 2,
  } = opts;

  const colW = contentW / cols;
  const rows = Math.ceil(langs.length / cols);
  const textX = SLOT + GAP;

  const markup = langs
    .map((l, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * colW;
      const y = top + row * ROW_PITCH;

      const pct = l.percent.toFixed(1).replace(".", locale.startsWith("pt") ? "," : ".");
      const pctW = textWidth(`${pct}%`, 12, 600);
      const label = truncate(l.name, colW - textX - pctW - 18, 12, 400);

      const icon = iconFor(l.name, theme);
      const marker = icon
        ? `<image x="0" y="${-SLOT + 3}" width="${SLOT}" height="${SLOT}" href="${icon}"
          preserveAspectRatio="xMidYMid meet" />`
        : `<rect x="${(SLOT - 9) / 2}" y="-8" width="9" height="9" rx="2" fill="${l.color}" />`;

      return `<g transform="translate(${x.toFixed(1)}, ${y})" class="fade"${stagger(i + staggerFrom, disableAnimations)}>
        ${marker}
        <text x="${textX}" y="0" class="t-legend">${escapeXml(label)}</text>
        <text x="${(colW - 18).toFixed(1)}" y="0" class="t-legend-val" text-anchor="end">${pct}%</text>
        <title>${escapeXml(l.name)} — ${pct}%</title>
      </g>`;
    })
    .join("\n    ");

  return {
    markup,
    height: rows ? (rows - 1) * ROW_PITCH + 8 : 0,
    styles: `.t-legend { font: 400 12px ${FONT_STACK}; fill: ${theme.muted}; }
      .t-legend-val { font: 600 12px ${FONT_STACK}; fill: ${theme.text};
                      font-variant-numeric: tabular-nums; }`,
  };
}
