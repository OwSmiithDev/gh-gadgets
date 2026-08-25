import { getUserData, topLanguages, reposWithCode } from "./stats.js";
import { resolveTheme } from "./render/themes.js";
import { renderStatsCard } from "./render/stats-card.js";
import { renderLangsCard } from "./render/langs-card.js";
import { renderDonutCard } from "./render/donut-card.js";
import { card } from "./render/card.js";
import { escapeXml, clamp, parseBool, parseList, truncate } from "./utils.js";

const MIN_CACHE = 1800; // 30 min - abaixo disso o rate limit do GitHub aperta
const MAX_CACHE = 86400; // 24 h

function commonOptions(q) {
  return {
    theme: resolveTheme(q.theme, {
      ink: q.bg_color,
      surface: q.surface_color,
      hairline: q.border_color,
      text: q.text_color,
      muted: q.muted_color,
      accent: q.title_color,
    }),
    hideBorder: parseBool(q.hide_border),
    hideTitle: parseBool(q.hide_title),
    disableAnimations: parseBool(q.disable_animations),
    locale: q.locale || "pt-BR",
    title: q.custom_title,
  };
}

function langOptions(q) {
  return {
    limit: clamp(parseInt(q.langs_count, 10) || 6, 1, 10),
    exclude: parseList(q.exclude_langs),
    mode: q.count_mode === "repo" ? "repo" : "bytes",
    includeArchived: !parseBool(q.hide_archived),
    groupOthers: !parseBool(q.hide_others),
  };
}

export function errorCard(message, hint) {
  const theme = resolveTheme("obsidian");
  return card({
    width: 495,
    height: hint ? 130 : 108,
    title: "Algo deu errado",
    theme,
    disableAnimations: true,
    body: `<text x="0" y="14" class="t-label">${escapeXml(truncate(message, 445, 13))}</text>
    ${hint ? `<text x="0" y="38" class="t-label" opacity="0.75">${escapeXml(truncate(hint, 445, 13))}</text>` : ""}`,
  });
}

/**
 * Roteia por tipo de card e devolve { status, headers, body }.
 * Framework-agnostico de proposito: serve Vercel, Node puro ou Workers.
 */
export async function handle(kind, query) {
  const username = (query.username || query.user || "").trim();

  if (!username || !/^[A-Za-z0-9-]{1,39}$/.test(username)) {
    return svgResponse(
      errorCard("Parâmetro `username` ausente ou inválido.", "Ex.: ?username=anuraghazra"),
      0,
      400
    );
  }

  const cacheSeconds = clamp(
    parseInt(query.cache_seconds, 10) || MIN_CACHE,
    MIN_CACHE,
    MAX_CACHE
  );

  try {
    const { stats, repos } = await getUserData(username);
    const opts = commonOptions(query);
    const width = parseInt(query.card_width, 10) || null;
    let svg;

    if (kind === "stats") {
      svg = renderStatsCard(stats, {
        ...opts,
        width: clamp(width || 495, 320, 800),
        hide: parseList(query.hide),
        columns: clamp(parseInt(query.columns, 10) || 2, 1, 3),
      });
    } else if (kind === "langs") {
      const langs = topLanguages(repos, langOptions(query));
      svg = renderLangsCard(langs, { ...opts, width: clamp(width || 340, 280, 600) });
    } else if (kind === "donut") {
      const langs = topLanguages(repos, langOptions(query));
      const centerMode = query.center || "repos";
      const centerValue =
        centerMode === "stars"
          ? stats.stars
          : centerMode === "contributions"
            ? stats.contributions
            : centerMode === "code"
              ? reposWithCode(repos)
              : stats.repos;
      const centerLabel =
        query.center_label ||
        { stars: "Estrelas", contributions: "Contribuições", code: "Com código" }[centerMode] ||
        "Repositórios";

      svg = renderDonutCard(langs, {
        ...opts,
        title: opts.title || "Linguagens por repositório",
        width: clamp(width || 340, 280, 600),
        centerValue,
        centerLabel,
        ringWidth: clamp(parseInt(query.ring_width, 10) || 20, 8, 40),
      });
    } else {
      return svgResponse(errorCard("Endpoint desconhecido."), 0, 404);
    }

    return svgResponse(svg, cacheSeconds, 200);
  } catch (e) {
    const notFound = e.code === "NOT_FOUND";
    return svgResponse(
      errorCard(
        e.message || "Erro inesperado.",
        notFound ? "Confira o login usado na URL." : "Verifique o token e o rate limit."
      ),
      0,
      notFound ? 404 : 500
    );
  }
}

function svgResponse(svg, cacheSeconds, status) {
  return {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // stale-while-revalidate mantem o card servindo instantaneo enquanto
      // a proxima geracao acontece em background.
      "Cache-Control": cacheSeconds
        ? `max-age=${Math.floor(cacheSeconds / 2)}, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`
        : "no-cache, no-store, must-revalidate",
    },
    body: svg,
  };
}
