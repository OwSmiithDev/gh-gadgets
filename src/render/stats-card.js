import { card, stagger } from "./card.js";
import { escapeXml, formatNumber, truncate, textWidth } from "../utils.js";

// Ordem fixa: o card deve ficar igual entre renders, independente de hide/columns.
const METRICS = [
  { key: "stars", label: "Estrelas" },
  { key: "contributions", label: "Contribuições" },
  { key: "commits", label: "Commits" },
  { key: "prs", label: "Pull requests" },
  { key: "issues", label: "Issues" },
  { key: "followers", label: "Seguidores" },
];

/** Ficha tecnica em grade: rotulo a esquerda, numero alinhado a direita. */
export function renderStatsCard(stats, opts = {}) {
  const {
    theme,
    width = 495,
    hideBorder = false,
    hideTitle = false,
    disableAnimations = false,
    locale = "pt-BR",
    hide = [],
    columns = 2,
    title,
  } = opts;

  const pad = 25;
  const contentW = width - pad * 2;
  const skip = new Set(hide.map((s) => String(s).toLowerCase()));
  const visible = METRICS.filter((m) => !skip.has(m.key));

  const cardTitle = truncate(
    title || `Estatísticas de ${stats.name}`,
    contentW,
    15,
    600
  );

  if (!visible.length) {
    return card({
      width,
      height: 108,
      title: cardTitle,
      theme,
      hideBorder,
      hideTitle,
      disableAnimations,
      pad,
      body: `<text x="0" y="16" class="t-label">Nenhuma métrica selecionada.</text>`,
    });
  }

  const cols = Math.min(columns, visible.length);
  const gutter = 18;
  const colW = (contentW - gutter * (cols - 1)) / cols;
  const rowPitch = 28;
  const rows = Math.ceil(visible.length / cols);

  const cells = visible
    .map((metric, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (colW + gutter);
      const y = row * rowPitch + 12;

      const value = formatNumber(stats[metric.key] || 0, locale);
      const valueW = textWidth(value, 13, 600);
      const label = truncate(metric.label, colW - valueW - 12, 13, 400);

      return `<g transform="translate(${x.toFixed(1)}, ${y})" class="fade"${stagger(i, disableAnimations)}>
        <text x="0" y="0" class="t-label">${escapeXml(label)}</text>
        <text x="${colW.toFixed(1)}" y="0" class="t-value" text-anchor="end">${escapeXml(value)}</text>
      </g>`;
    })
    .join("\n    ");

  const height = pad * 2 + (hideTitle ? 0 : 34) + rows * rowPitch;

  return card({
    width,
    height,
    title: cardTitle,
    theme,
    hideBorder,
    hideTitle,
    disableAnimations,
    pad,
    body: cells,
  });
}
