import { card, stagger } from "./card.js";
import { markerFor } from "./legend.js";
import { escapeXml, formatNumber, truncate, textWidth } from "../utils.js";
import { FONT_STACK, isDarkTheme } from "./themes.js";
import { readableOn } from "../colors.js";

// Marca do GitHub (Octicons, MIT), em viewBox 16x16.
const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 " +
  "0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 " +
  "1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 " +
  "0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 " +
  "2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 " +
  "1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 " +
  "2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z";

const PILL_H = 40;
const PILL_GAP = 8;
const ICON = 26;

/**
 * SIGNATURE: anel segmentado com gaps reais, ao lado de uma legenda em pilulas.
 *
 * Repositorios sao unidades discretas - o anel trata cada linguagem como peca
 * separavel, nao como fatia de uma pizza continua. A legenda repete a ideia:
 * cada linguagem e um bloco proprio, com a cor dela ancorada na borda direita.
 *
 * Nenhuma cor nasce aqui. Fundo, superficie e texto vem dos tokens do tema, e a
 * cor de cada linguagem vem do Linguist - por isso o mesmo desenho funciona no
 * tema claro e no escuro.
 */
export function renderDonutCard(langs, opts = {}) {
  const {
    theme,
    width = 760,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    title = "Linguagens por repositório",
    centerValue = 0,
    centerLabel = "Repositórios",
    locale = "pt-BR",
    ringWidth = 26,
    updatedAt = new Date(),
  } = opts;

  const pad = 28;
  const contentW = width - pad * 2;
  const dark = isDarkTheme(theme);

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

  // ─── Geometria ────────────────────────────────────────────────────────────
  const legendW = Math.min(360, Math.round(contentW * 0.5));
  const gutter = 28;
  const donutW = contentW - legendW - gutter;
  const r = Math.min(92, donutW / 2 - ringWidth / 2 - 10);
  const cx = donutW / 2;
  const C = 2 * Math.PI * r;
  const gapPx = langs.length > 1 ? 4 : 0;

  const legendH = langs.length * PILL_H + (langs.length - 1) * PILL_GAP;
  const donutH = 2 * (r + ringWidth / 2);
  const bodyH = Math.max(legendH, donutH);
  const cy = bodyH / 2;

  const headerH = hideTitle ? 0 : 74;
  const footerH = 52;
  const height = pad * 2 + headerH + bodyH + footerH;

  // ─── Anel ─────────────────────────────────────────────────────────────────
  let offset = 0;
  const arcs = langs
    .map((l, i) => {
      const arc = (l.percent / 100) * C;
      const dash = Math.max(1, arc - gapPx);
      const seg = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"
          fill="none" stroke="${l.color}" stroke-width="${ringWidth}" stroke-linecap="butt"
          stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}"
          stroke-dashoffset="${(-offset).toFixed(2)}"
          class="fade"${stagger(i, disableAnimations)}>
          <title>${escapeXml(l.name)} — ${l.percent.toFixed(1)}%</title>
        </circle>`;
      offset += arc;
      return seg;
    })
    .join("\n        ");

  // O brilho e o mesmo desenho borrado por tras. No tema claro ele vira sujeira,
  // entao so entra no escuro.
  const glow = dark
    ? `<g filter="url(#glow)" opacity="0.38">
        <g transform="rotate(-90 ${cx.toFixed(1)} ${cy.toFixed(1)})">${arcs}</g>
      </g>`
    : "";

  // ─── Legenda em pílulas ───────────────────────────────────────────────────
  const pills = langs
    .map((l, i) => {
      const y = i * (PILL_H + PILL_GAP);
      const pct = l.percent.toFixed(1).replace(".", locale.startsWith("pt") ? "," : ".");
      const pctW = textWidth(`${pct}%`, 13, 700);
      const nameX = 14 + ICON + 12;
      const label = truncate(l.name, legendW - nameX - pctW - 30, 13.5, 500);

      return `<g transform="translate(0, ${y})" class="fade"${stagger(i + 2, disableAnimations)}>
        <rect x="0" y="0" width="${legendW}" height="${PILL_H}" rx="10"
              fill="${theme.surface}" stroke="${theme.hairline}" stroke-width="1" opacity="0.9" />
        <g transform="translate(14, ${(PILL_H - ICON) / 2})">
          ${markerFor(l, theme, ICON, 0)}
        </g>
        <text x="${nameX}" y="${PILL_H / 2 + 5}" class="t-lang">${escapeXml(label)}</text>
        <text x="${legendW - 20}" y="${PILL_H / 2 + 5}" text-anchor="end"
              class="t-pct" fill="${readableOn(l.color, theme.surface)}">${pct}%</text>
        <rect x="${legendW - 8}" y="9" width="3" height="${PILL_H - 18}" rx="1.5" fill="${l.color}" />
        <title>${escapeXml(l.name)} — ${pct}%</title>
      </g>`;
    })
    .join("\n      ");

  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  // Título em dois pesos: a primeira palavra carrega, o resto explica.
  const words = String(title).split(" ");
  const head = words[0];
  const tail = words.slice(1).join(" ");
  const headW = textWidth(head, 21, 700);

  const header = hideTitle
    ? ""
    : `<g transform="translate(0, 0)">
      <rect x="0" y="0" width="42" height="42" rx="11"
            fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1" opacity="0.9" />
      <text x="21" y="27" text-anchor="middle" class="t-glyph">&lt;/&gt;</text>

      <text x="56" y="21" class="t-h1">${escapeXml(head)}</text>
      <text x="${(56 + headW + 8).toFixed(1)}" y="21" class="t-h2">${escapeXml(tail)}</text>
      <rect x="56" y="33" width="${Math.min(300, headW * 1.6).toFixed(1)}" height="3" rx="1.5"
            fill="${theme.accent}" opacity="0.85" />

      <g transform="translate(${contentW - 42}, 0)">
        <rect x="0" y="0" width="42" height="42" rx="11"
              fill="${theme.surface}" stroke="${theme.hairline}" stroke-width="1" />
        <g transform="translate(11, 11) scale(1.25)">
          <path d="${GITHUB_MARK}" fill="${theme.muted}" />
        </g>
      </g>
    </g>`;

  // ─── Rodapé ───────────────────────────────────────────────────────────────
  // Data real da geração. "Atualizado agora" viraria mentira uma hora depois,
  // já que o SVG fica commitado no repositório.
  const stamp = new Intl.DateTimeFormat(locale.startsWith("pt") ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  }).format(updatedAt);
  const stampText = `Atualizado em ${stamp}`;
  const stampW = textWidth(stampText, 11.5, 500) + 46;

  const footer = `<g transform="translate(0, ${(headerH + bodyH + 20).toFixed(1)})">
      <g stroke="${theme.accent}" fill="none" stroke-width="1.2" opacity="0.35"
         stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4,6 60,6 74,20 150,20" />
        <polyline points="4,24 34,24 46,12 120,12" />
        <polyline points="168,20 196,20 208,8 268,8" />
      </g>
      <g fill="${theme.accent}" opacity="0.7">
        <circle cx="4" cy="6" r="2.5" /><circle cx="150" cy="20" r="2.5" />
        <circle cx="268" cy="8" r="2.5" />
      </g>

      <g transform="translate(${(contentW - stampW).toFixed(1)}, 0)">
        <rect x="0" y="-6" width="${stampW.toFixed(1)}" height="30" rx="15"
              fill="${theme.surface}" stroke="${theme.hairline}" stroke-width="1" />
        <circle cx="19" cy="9" r="4" fill="#2ea043" />
        <circle cx="19" cy="9" r="4" fill="#2ea043" opacity="0.35" class="pulse" />
        <text x="32" y="13" class="t-stamp">${escapeXml(stampText)}</text>
      </g>
    </g>`;

  const pulse = disableAnimations
    ? ""
    : `
      @keyframes pulse { 0% { r: 4; opacity: 0.35; } 70% { r: 9; opacity: 0; } 100% { r: 9; opacity: 0; } }
      .pulse { animation: pulse 2.4s ease-out infinite; }
      @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }`;

  const body = `<style>
      .t-h1    { font: 700 21px ${FONT_STACK}; fill: ${theme.text}; }
      .t-h2    { font: 400 21px ${FONT_STACK}; fill: ${theme.accent}; }
      .t-glyph { font: 700 15px ${FONT_STACK}; fill: ${theme.accent}; }
      .t-lang  { font: 500 13.5px ${FONT_STACK}; fill: ${theme.text}; }
      .t-pct   { font: 700 13px ${FONT_STACK}; font-variant-numeric: tabular-nums; }
      .t-stamp { font: 500 11.5px ${FONT_STACK}; fill: ${theme.muted}; }
      .t-ring-v{ font: 700 40px ${FONT_STACK}; fill: ${theme.text};
                 font-variant-numeric: tabular-nums; }
      .t-ring-l{ font: 600 10px ${FONT_STACK}; fill: ${theme.muted}; letter-spacing: 0.16em; }${pulse}
    </style>

    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>

    ${header}

    <g transform="translate(0, ${headerH})">
      ${glow}
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none"
              stroke="${theme.surface}" stroke-width="${ringWidth}" />
      <g transform="rotate(-90 ${cx.toFixed(1)} ${cy.toFixed(1)})">
        ${arcs}
      </g>

      <text x="${cx.toFixed(1)}" y="${(cy + 10).toFixed(1)}" text-anchor="middle"
            class="t-ring-v">${escapeXml(formatNumber(centerValue, locale))}</text>
      <text x="${cx.toFixed(1)}" y="${(cy + 32).toFixed(1)}" text-anchor="middle"
            class="t-ring-l">${escapeXml(String(centerLabel).toUpperCase())}</text>

      <g transform="translate(${(donutW + gutter).toFixed(1)}, ${((bodyH - legendH) / 2).toFixed(1)})">
        ${pills}
      </g>
    </g>

    ${footer}`;

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
