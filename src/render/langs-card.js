import { card, stagger } from "./card.js";
import { markerFor } from "./legend.js";
import { escapeXml, truncate, textWidth } from "../utils.js";
import { FONT_STACK } from "./themes.js";

const BAR_H = 14;
const ROW_H = 52;
const ROW_GAP = 8;
const COL_GAP = 16;
const TILE = 34;

/**
 * Barra composta unica no topo, legenda em duas colunas embaixo.
 *
 * A barra responde "como o codigo se divide" de relance; as linhas respondem
 * "quais sao e quanto cada uma pesa". Duas leituras da mesma informacao, em
 * niveis de detalhe diferentes.
 *
 * O percentual usa a cor do texto, nao a da linguagem: quem carrega a cor sao o
 * icone, o ponto e a barra. Numero e para ler, e amarelo de JavaScript sobre
 * fundo claro nao se le.
 */
export function renderLangsCard(langs, opts = {}) {
  const {
    theme,
    width = 760,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    title = "Linguagens mais usadas",
    locale = "pt-BR",
  } = opts;

  const pad = 28;
  const contentW = width - pad * 2;

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

  // ─── Barra ────────────────────────────────────────────────────────────────
  // clipPath arredonda as duas pontas sem arredondar cada segmento: os
  // segmentos internos precisam encostar um no outro sem folga.
  const clipId = `bar-${Math.abs(hashOf(langs.map((l) => l.name).join("|"))).toString(36)}`;

  let x = 0;
  const segments = langs
    .map((l, i) => {
      const w = (l.percent / 100) * contentW;
      // O último segmento fecha na borda: evita 1px de fundo aparecendo por
      // arredondamento acumulado das larguras.
      const segW = i === langs.length - 1 ? contentW - x : w;
      const seg = `<rect x="${x.toFixed(2)}" y="0" width="${Math.max(0, segW).toFixed(2)}" height="${BAR_H}"
          fill="${l.color}" class="fade"${stagger(i, disableAnimations)}>
          <title>${escapeXml(l.name)} — ${l.percent.toFixed(1)}%</title>
        </rect>`;
      x += w;
      return seg;
    })
    .join("\n      ");

  // ─── Legenda ──────────────────────────────────────────────────────────────
  const cols = langs.length >= 4 ? 2 : 1;
  const colW = (contentW - COL_GAP * (cols - 1)) / cols;
  const rows = Math.ceil(langs.length / cols);

  // Preenche coluna por coluna, não linha por linha: assim a ordem de leitura
  // desce em ranking, como uma lista, em vez de zigue-zaguear.
  const linhas = langs
    .map((l, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const lx = col * (colW + COL_GAP);
      const ly = row * (ROW_H + ROW_GAP);

      const pct = l.percent.toFixed(1).replace(".", locale.startsWith("pt") ? "," : ".");
      const pctW = textWidth(`${pct}%`, 14, 700);
      const dotX = 12 + TILE + 16;
      const nameX = dotX + 16;
      const label = truncate(l.name, colW - nameX - pctW - 26, 14, 400);

      return `<g transform="translate(${lx.toFixed(1)}, ${ly})" class="fade"${stagger(i + 2, disableAnimations)}>
        <rect x="0" y="0" width="${colW.toFixed(1)}" height="${ROW_H}" rx="10"
              fill="${theme.surface}" stroke="${theme.hairline}" stroke-width="1" opacity="0.7" />
        <g transform="translate(12, ${(ROW_H - TILE) / 2})">
          ${markerFor(l, theme, TILE, 0)}
        </g>
        <circle cx="${dotX}" cy="${ROW_H / 2}" r="4.5" fill="${l.color}" />
        <text x="${nameX}" y="${ROW_H / 2 + 5}" class="t-lang">${escapeXml(label)}</text>
        <text x="${(colW - 16).toFixed(1)}" y="${ROW_H / 2 + 5}" text-anchor="end"
              class="t-pct">${pct}%</text>
        <title>${escapeXml(l.name)} — ${pct}%</title>
      </g>`;
    })
    .join("\n      ");

  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  const headerH = hideTitle ? 0 : 62;
  const header = hideTitle
    ? ""
    : `<g>
      <rect x="0" y="0" width="42" height="42" rx="11"
            fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1" opacity="0.9" />
      <text x="21" y="27" text-anchor="middle" class="t-glyph">&lt;/&gt;</text>
      <text x="56" y="29" class="t-h1">${escapeXml(truncate(title, contentW - 60, 20, 700))}</text>
    </g>`;

  const barY = headerH + 6;
  const legendY = barY + BAR_H + 24;
  const height = pad * 2 + legendY + rows * ROW_H + (rows - 1) * ROW_GAP;

  const body = `<style>
      .t-h1    { font: 700 20px ${FONT_STACK}; fill: ${theme.text}; }
      .t-glyph { font: 700 15px ${FONT_STACK}; fill: ${theme.accent}; }
      .t-lang  { font: 400 14px ${FONT_STACK}; fill: ${theme.muted}; }
      .t-pct   { font: 700 14px ${FONT_STACK}; fill: ${theme.text};
                 font-variant-numeric: tabular-nums; }
    </style>

    <defs>
      <clipPath id="${clipId}">
        <rect x="0" y="0" width="${contentW}" height="${BAR_H}" rx="${BAR_H / 2}" />
      </clipPath>
    </defs>

    ${header}

    <g transform="translate(0, ${barY})">
      <rect x="0" y="0" width="${contentW}" height="${BAR_H}" rx="${BAR_H / 2}"
            fill="${theme.surface}" />
      <g clip-path="url(#${clipId})">
        ${segments}
      </g>
    </g>

    <g transform="translate(0, ${legendY})">
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

// id do clipPath precisa ser estavel e unico por card: dois cards na mesma
// pagina com o mesmo id fariam um recortar pelo shape do outro.
function hashOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}
