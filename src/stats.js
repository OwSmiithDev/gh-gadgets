import { fetchUser } from "./github.js";
import { languageColor, OTHERS_COLOR } from "./colors.js";

const CACHE_TTL = 30 * 60 * 1000; // 30 min - primeira camada, na memoria do processo
const cache = new Map();

/**
 * Converte a resposta crua do GraphQL em numeros prontos para render.
 * Separado de getUserData de proposito: o modo --mock do render.js entra por aqui,
 * sem tocar na rede.
 */
export function aggregate({ user, repos }) {
  const c = user.contributionsCollection || {};

  const stars = repos.reduce((sum, r) => sum + (r.stargazerCount || 0), 0);

  const stats = {
    name: user.name || user.login,
    login: user.login,
    stars,
    // totalCount da query, nao repos.length: a paginacao para em 500 repos,
    // mas o total do perfil continua correto.
    repos: user.repositories?.totalCount ?? repos.length,
    contributions: c.contributionCalendar?.totalContributions || 0,
    // restrictedContributionsCount cobre repositorios privados - o GitHub conta
    // a atividade sem revelar nada sobre o conteudo.
    commits: (c.totalCommitContributions || 0) + (c.restrictedContributionsCount || 0),
    reviews: c.totalPullRequestReviewContributions || 0,
    prs: user.pullRequests?.totalCount || 0,
    issues: (user.openIssues?.totalCount || 0) + (user.closedIssues?.totalCount || 0),
    followers: user.followers?.totalCount || 0,
  };

  return { stats, repos };
}

/** Numero de repositorios com linguagem detectada pelo GitHub. */
export function reposWithCode(repos) {
  return repos.filter((r) => r.primaryLanguage?.name).length;
}

/**
 * Ranking de linguagens.
 *
 * mode "bytes" soma o peso real de codigo. mode "repo" conta 1 voto por
 * repositorio, pela linguagem principal - costuma refletir melhor o que a pessoa
 * escreve, porque um unico repo grande nao domina o grafico.
 */
export function topLanguages(repos, opts = {}) {
  const {
    limit = 6,
    mode = "bytes",
    exclude = [],
    includeArchived = true,
    groupOthers = true,
  } = opts;

  const skip = new Set(exclude.map((s) => String(s).toLowerCase()));
  const pool = includeArchived ? repos : repos.filter((r) => !r.isArchived);
  const totals = new Map();

  const add = (name, apiColor, amount) => {
    if (!name || skip.has(name.toLowerCase()) || amount <= 0) return;
    const entry = totals.get(name) || { name, color: languageColor(name, apiColor), value: 0 };
    entry.value += amount;
    totals.set(name, entry);
  };

  for (const repo of pool) {
    if (mode === "repo") {
      const lang = repo.primaryLanguage;
      if (lang) add(lang.name, lang.color, 1);
    } else {
      for (const edge of repo.languages?.edges || []) {
        add(edge.node?.name, edge.node?.color, edge.size || 0);
      }
    }
  }

  const ranked = [...totals.values()].sort((a, b) => b.value - a.value);
  const grandTotal = ranked.reduce((sum, l) => sum + l.value, 0);
  if (!grandTotal) return [];

  const head = ranked.slice(0, limit);
  const tail = ranked.slice(limit);

  const result = head.map((l) => ({
    name: l.name,
    color: l.color,
    percent: (l.value / grandTotal) * 100,
  }));

  if (groupOthers && tail.length) {
    const rest = tail.reduce((sum, l) => sum + l.value, 0);
    result.push({ name: "Outras", color: OTHERS_COLOR, percent: (rest / grandTotal) * 100 });
  } else if (tail.length) {
    // Sem a fatia "Outras", renormaliza para o anel continuar fechando em 100%.
    const headTotal = head.reduce((sum, l) => sum + l.value, 0);
    for (const l of result) l.percent = (l.percent * grandTotal) / headTotal;
  }

  return result;
}

/**
 * Busca com cache de processo. Em serverless o processo e reaproveitado entre
 * invocacoes, entao este cache pega boa parte dos acessos repetidos antes mesmo
 * do Cache-Control entrar em acao.
 */
export async function getUserData(login, { force = false } = {}) {
  const key = login.toLowerCase();
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const data = aggregate(await fetchUser(login));
  cache.set(key, { at: Date.now(), data });
  return data;
}
