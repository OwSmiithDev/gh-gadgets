import { escapeXml } from "../utils.js";
import { FONT_STACK } from "./themes.js";

const TITLE_BAND = 34; // altura reservada ao titulo; os cards contam com este valor

/**
 * Atributo de delay para entrada escalonada.
 * Devolve fragmento ja com espaco na frente: `class="fade"${stagger(i)}`.
 */
export function stagger(index, disableAnimations = false) {
  if (disableAnimations) return "";
  return ` style="animation-delay:${index * 90}ms"`;
}

/**
 * Casca comum de todos os cards: fundo, borda, titulo e o grupo de conteudo.
 * O `body` recebe origem (0,0) logo abaixo do titulo, ja com o padding aplicado,
 * para que cada card se preocupe apenas com o proprio layout interno.
 */
export function card(opts = {}) {
  const {
    width = 495,
    height = 195,
    title = "",
    theme,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    pad = 25,
    body = "",
  } = opts;

  const contentY = pad + (hideTitle ? 0 : TITLE_BAND);

  // backwards, nunca forwards com opacity:0 inicial: em renderizador que ignora
  // CSS animation (varios leitores de feed, alguns proxies), o card aparece
  // completo em vez de invisivel.
  const animations = disableAnimations
    ? ""
    : `
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade { animation: fade-up 0.5s ease-out backwards; }
    @media (prefers-reduced-motion: reduce) {
      .fade { animation: none; }
    }`;

  const border = hideBorder
    ? ""
    : `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10"
          fill="none" stroke="${theme.hairline}" />`;

  const titleEl = hideTitle
    ? ""
    : `<text x="${pad}" y="${pad + 16}" class="t-title">${escapeXml(title)}</text>`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title || "Card")}">
  <style>
    .t-title   { font: 600 15px ${FONT_STACK}; fill: ${theme.accent}; }
    .t-label   { font: 400 13px ${FONT_STACK}; fill: ${theme.muted}; }
    .t-value   { font: 600 13px ${FONT_STACK}; fill: ${theme.text};
                 font-variant-numeric: tabular-nums; }
    .t-big     { font: 700 26px ${FONT_STACK}; fill: ${theme.text};
                 font-variant-numeric: tabular-nums; }
    .t-eyebrow { font: 600 9px ${FONT_STACK}; fill: ${theme.muted};
                 letter-spacing: 0.09em; }${animations}
  </style>

  <rect width="${width}" height="${height}" rx="10" fill="${theme.ink}" />
  ${border}
  ${titleEl}

  <g transform="translate(${pad}, ${contentY})">
    ${body}
  </g>
</svg>`;
}

export { TITLE_BAND };
