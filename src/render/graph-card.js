import { card, stagger } from "./card.js";
import { glyph } from "./glyphs.js";
import { heatScale } from "../colors.js";
import { escapeXml, formatNumber, truncate, textWidth } from "../utils.js";
import { FONT_STACK } from "./themes.js";

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Só três rótulos de dia, como o GitHub faz: sete rótulos empilhados em ~90px
// de altura brigariam por espaço e o eixo já é óbvio pela posição.
const DIAS_VISIVEIS = [1, 3, 5];

const MES_H = 16;
const LEGENDA_H = 26;

/**
 * Heatmap de contribuicoes: uma coluna por semana, sete linhas por dia.
 *
 * A escala de cor sai dos tokens do tema, nao de uma rampa de verde cravada -
 * `title_color=39d353` devolve o verde do GitHub, e qualquer outro tema
 * continua coerente com o resto dos cards.
 *
 * graph: { total, weeks, months, max, activeDays } de contributionGraph().
 */
export function renderGraphCard(graph, opts = {}) {
  const {
    theme,
    width = 760,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    title = "Contribuições no último ano",
    locale = "pt-BR",
  } = opts;

  const pad = 24;
  const contentW = width - pad * 2;
  const { total = 0, weeks = [], months = [], activeDays = 0 } = graph || {};
  const pt = locale.startsWith("pt");

  if (!weeks.length) {
    return card({
      width,
      height: 116,
      title,
      theme,
      hideBorder,
      hideTitle,
      disableAnimations,
      pad,
      body: `<text x="0" y="14" class="t-label">Calendário de contribuições indisponível.</text>`,
    });
  }

  const escala = heatScale(theme.surface, theme.accent);
  const dias = pt ? DIAS_PT : DIAS_EN;

  // ─── Grade ────────────────────────────────────────────────────────────────
  // A célula sai da largura disponível, não de um tamanho fixo: com card_width
  // variável, um valor cravado deixaria sobra ou estouraria a borda.
  const rotuloW = Math.ceil(Math.max(...DIAS_VISIVEIS.map((i) => textWidth(dias[i], 10, 400)))) + 8;
  const gradeW = contentW - rotuloW;
  const passo = gradeW / weeks.length;
  const cel = Math.max(5, Math.min(13, passo - 2.5));
  const gradeH = 7 * passo - (passo - cel);
  const raio = cel <= 8 ? 1.5 : 2;

  const celulas = weeks
    .map((semana, w) =>
      semana
        .map((dia, d) => {
          if (!dia) return ""; // buraco: semana parcial no começo ou no fim
          const x = w * passo;
          const y = d * passo;
          const rotulo = pt
            ? `${dia.count} ${dia.count === 1 ? "contribuição" : "contribuições"} em ${dia.date}`
            : `${dia.count} contribution${dia.count === 1 ? "" : "s"} on ${dia.date}`;
          return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cel.toFixed(2)}"
            height="${cel.toFixed(2)}" rx="${raio}" fill="${escala[dia.level]}">
            <title>${escapeXml(rotulo)}</title>
          </rect>`;
        })
        .join("")
    )
    // Fade por coluna, não por célula: 368 elementos animados individualmente
    // deixariam o SVG pesado e o efeito ilegível.
    .map((col, w) =>
      col ? `<g class="fade"${stagger(Math.floor(w / 4), disableAnimations)}>${col}</g>` : ""
    )
    .join("\n        ");

  // O primeiro mes do periodo quase sempre entra pela metade e fica colado no
  // segundo rotulo. Descarta-se ELE, nao o seguinte - o contrario abriria um
  // buraco no eixo, com o mes seguinte sumindo em vez do parcial.
  const mesesVisiveis =
    months.length > 1 && months[1].week - months[0].week < 3 ? months.slice(1) : months;

  const rotulosMes = mesesVisiveis
    .map(
      (m) =>
        `<text x="${(m.week * passo).toFixed(1)}" y="0" class="t-axis">${escapeXml(m.label)}</text>`
    )
    .join("\n        ");

  const rotulosDia = DIAS_VISIVEIS.map(
    (i) =>
      `<text x="${rotuloW - 8}" y="${(i * passo + cel / 2 + 3.5).toFixed(1)}" text-anchor="end"
        class="t-axis">${escapeXml(dias[i])}</text>`
  ).join("\n      ");

  // ─── Legenda ──────────────────────────────────────────────────────────────
  // Arredondado: cel vem de uma divisao e sairia com 15 casas no atributo.
  const legCel = Math.round(Math.min(11, cel));
  const menos = pt ? "Menos" : "Less";
  const mais = pt ? "Mais" : "More";
  const menosW = textWidth(menos, 10.5, 400);
  const legW = menosW + 8 + escala.length * (legCel + 3) + 5 + textWidth(mais, 10.5, 400);
  const legX = contentW - legW;

  const legenda = `<g transform="translate(${legX.toFixed(1)}, 0)">
      <text x="0" y="${(legCel / 2 + 3.5).toFixed(1)}" class="t-axis">${menos}</text>
      ${escala
        .map(
          (c, i) =>
            `<rect x="${(menosW + 8 + i * (legCel + 3)).toFixed(1)}" y="0" width="${legCel}"
          height="${legCel}" rx="${raio}" fill="${c}" />`
        )
        .join("\n      ")}
      <text x="${(menosW + 8 + escala.length * (legCel + 3) + 5).toFixed(1)}"
            y="${(legCel / 2 + 3.5).toFixed(1)}" class="t-axis">${mais}</text>
    </g>`;

  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  const headerH = hideTitle ? 0 : 50;
  const resumo = pt
    ? `${formatNumber(total, locale)} em ${activeDays} ${activeDays === 1 ? "dia" : "dias"}`
    : `${formatNumber(total, locale)} across ${activeDays} day${activeDays === 1 ? "" : "s"}`;
  const resumoW = textWidth(resumo, 12, 400);
  const header = hideTitle
    ? ""
    : `<g>
      <rect x="0" y="0" width="34" height="34" rx="9"
            fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1" opacity="0.9" />
      ${glyph("graph", 17, theme.accent, { x: 8.5, y: 8.5 })}
      <text x="46" y="23" class="t-h1">${escapeXml(
        truncate(title, contentW - 46 - resumoW - 16, 17, 700)
      )}</text>
      <text x="${contentW}" y="23" text-anchor="end" class="t-total">${escapeXml(resumo)}</text>
    </g>`;

  const gradeY = headerH + MES_H;
  // O passo da grade e fracionario por vir de uma divisao; a altura do card nao
  // pode ser, senao o atributo sai com 15 casas decimais.
  const height = Math.ceil(pad * 2 + gradeY + gradeH + LEGENDA_H);

  const body = `<style>
      .t-h1    { font: 700 17px ${FONT_STACK}; fill: ${theme.text}; }
      .t-total { font: 400 12px ${FONT_STACK}; fill: ${theme.muted};
                 font-variant-numeric: tabular-nums; }
      .t-axis  { font: 400 10.5px ${FONT_STACK}; fill: ${theme.muted}; }
    </style>

    ${header}

    <g transform="translate(${rotuloW}, ${headerH + 10})">
      ${rotulosMes}
    </g>

    <g transform="translate(0, ${gradeY})">
      ${rotulosDia}
    </g>

    <g transform="translate(${rotuloW}, ${gradeY})">
      ${celulas}
    </g>

    <g transform="translate(0, ${(gradeY + gradeH + 10).toFixed(1)})">
      ${legenda}
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
