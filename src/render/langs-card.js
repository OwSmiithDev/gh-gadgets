import { card, stagger } from "./card.js";
import { escapeXml, truncate } from "../utils.js";
import { legend } from "./legend.js";

/** Barra composta unica + legenda em duas colunas. langs: [{ name, color, percent }] */
export function renderLangsCard(langs, opts = {}) {
  const {
    theme,
    width = 340,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    title = "Linguagens mais usadas",
    locale = "pt-BR",
  } = opts;

  const pad = 25;
  const contentW = width - pad * 2;
  const barH = 8;

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

  // clipPath arredonda as duas pontas da barra sem arredondar cada segmento:
  // os segmentos internos precisam encostar um no outro sem folga.
  const clipId = `bar-${Math.abs(hashOf(langs.map((l) => l.name).join("|"))).toString(36)}`;

  let x = 0;
  const segments = langs
    .map((l, i) => {
      const w = (l.percent / 100) * contentW;
      // Ultimo segmento fecha na borda: evita 1px de fundo aparecendo por
      // arredondamento acumulado das larguras.
      const segW = i === langs.length - 1 ? contentW - x : w;
      const seg = `<rect x="${x.toFixed(2)}" y="0" width="${Math.max(0, segW).toFixed(2)}" height="${barH}"
        fill="${l.color}" class="fade"${stagger(i, disableAnimations)}>
        <title>${escapeXml(l.name)} — ${l.percent.toFixed(1)}%</title>
      </rect>`;
      x += w;
      return seg;
    })
    .join("\n      ");

  const legendTop = barH + 30;
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

    <defs>
      <clipPath id="${clipId}">
        <rect x="0" y="0" width="${contentW}" height="${barH}" rx="${barH / 2}" />
      </clipPath>
    </defs>

    <rect x="0" y="0" width="${contentW}" height="${barH}" rx="${barH / 2}" fill="${theme.surface}" />
    <g clip-path="url(#${clipId})">
      ${segments}
    </g>

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

// id do clipPath precisa ser estavel e unico por card: dois cards na mesma
// pagina com o mesmo id fariam um recortar pelo shape do outro.
function hashOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}
