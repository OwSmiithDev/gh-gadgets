import { card, stagger } from "./card.js";
import { glyph } from "./glyphs.js";
import { escapeXml, formatNumber, truncate, textWidth } from "../utils.js";
import { FONT_STACK } from "./themes.js";

// Ordem fixa: o card deve ficar igual entre renders, independente de hide.
// Cada metrica carrega o proprio glifo - o icone e parte da identidade dela,
// nao decoracao escolhida no lugar de uso.
const METRICS = [
  { key: "stars", label: "Estrelas", icon: "star" },
  { key: "contributions", label: "Contribuições", icon: "git-branch" },
  { key: "followers", label: "Seguidores", icon: "people" },
  { key: "commits", label: "Commits", icon: "git-commit" },
  { key: "prs", label: "Pull requests", icon: "git-pull-request" },
  { key: "issues", label: "Issues", icon: "issue-opened" },
];

const TILE_H = 88;
const TILE_GAP = 12;
const BADGE = 44;

/**
 * Ficha tecnica em tiles: cada metrica ganha um bloco proprio com glifo,
 * rotulo e numero.
 *
 * O numero e o que a pessoa veio ler, entao ele domina o tile; o rotulo fica
 * acima em corpo pequeno, so para dizer do que se trata. Uma regua vertical
 * separa o glifo do texto, o que mantem as colunas alinhadas mesmo quando os
 * numeros tem larguras muito diferentes.
 */
export function renderStatsCard(stats, opts = {}) {
  const {
    theme,
    width = 760,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    locale = "pt-BR",
    hide = [],
    columns = 3,
    title,
  } = opts;

  const pad = 28;
  const contentW = width - pad * 2;
  const skip = new Set(hide.map((s) => String(s).toLowerCase()));
  const visible = METRICS.filter((m) => !skip.has(m.key));

  const cardTitle = truncate(
    title || `Estatísticas de ${stats.name}`,
    contentW - 60,
    20,
    700
  );

  if (!visible.length) {
    return card({
      width,
      height: 120,
      title: cardTitle,
      theme,
      hideBorder,
      hideTitle,
      disableAnimations,
      pad,
      body: `<text x="0" y="16" class="t-label">Nenhuma métrica selecionada.</text>`,
    });
  }

  // ─── Grade ────────────────────────────────────────────────────────────────
  const cols = Math.max(1, Math.min(columns, visible.length));
  const tileW = (contentW - TILE_GAP * (cols - 1)) / cols;
  const rows = Math.ceil(visible.length / cols);

  const tiles = visible
    .map((metric, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (tileW + TILE_GAP);
      const y = row * (TILE_H + TILE_GAP);

      const badgeY = (TILE_H - BADGE) / 2;
      const ruleX = 14 + BADGE + 14;
      const textX = ruleX + 14;

      const value = formatNumber(stats[metric.key] || 0, locale);
      const label = truncate(metric.label, tileW - textX - 14, 12.5, 400);

      return `<g transform="translate(${x.toFixed(1)}, ${y})" class="fade"${stagger(i, disableAnimations)}>
        <rect x="0" y="0" width="${tileW.toFixed(1)}" height="${TILE_H}" rx="12"
              fill="${theme.surface}" stroke="${theme.hairline}" stroke-width="1" opacity="0.85" />

        <rect x="14" y="${badgeY}" width="${BADGE}" height="${BADGE}" rx="11"
              fill="${theme.ink}" stroke="${theme.accent}" stroke-width="1" opacity="0.75" />
        ${glyph(metric.icon, 20, theme.accent, { x: 14 + (BADGE - 20) / 2, y: badgeY + (BADGE - 20) / 2 })}

        <line x1="${ruleX}" y1="20" x2="${ruleX}" y2="${TILE_H - 20}"
              stroke="${theme.accent}" stroke-width="1.5" opacity="0.5" />

        <text x="${textX}" y="38" class="t-stat-label">${escapeXml(label)}</text>
        <text x="${textX}" y="66" class="t-stat-value">${escapeXml(value)}</text>
        <title>${escapeXml(metric.label)}: ${escapeXml(value)}</title>
      </g>`;
    })
    .join("\n      ");

  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  const headerH = hideTitle ? 0 : 78;
  const header = hideTitle
    ? ""
    : `<g>
      <rect x="0" y="0" width="42" height="42" rx="11"
            fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1" opacity="0.9" />
      ${glyph("graph", 20, theme.accent, { x: 11, y: 11 })}
      <text x="56" y="28" class="t-h1">${escapeXml(cardTitle)}</text>
      <line x1="0" y1="60" x2="${contentW}" y2="60"
            stroke="${theme.hairline}" stroke-width="1" />
    </g>`;

  const height = pad * 2 + headerH + rows * TILE_H + (rows - 1) * TILE_GAP;

  const body = `<style>
      .t-h1          { font: 700 20px ${FONT_STACK}; fill: ${theme.accent}; }
      .t-stat-label  { font: 400 12.5px ${FONT_STACK}; fill: ${theme.muted}; }
      .t-stat-value  { font: 700 23px ${FONT_STACK}; fill: ${theme.text};
                       font-variant-numeric: tabular-nums; }
    </style>

    ${header}

    <g transform="translate(0, ${headerH})">
      ${tiles}
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
