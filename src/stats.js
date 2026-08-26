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
 * Alcance: em quantos repositorios cada linguagem aparece.
 *
 * Diferente de topLanguages nos dois modos. "bytes" responde quanto codigo, e
 * "repo" conta so a linguagem principal - uma linguagem usada em metade dos
 * repositorios sem nunca ser a principal fica invisivel nos dois.
 *
 * O resultado NAO e parte de um todo: uma linguagem conta em varios
 * repositorios ao mesmo tempo, entao os votos somam mais que o total de repos.
 * Por isso devolve contagem e o total, em vez de percentuais normalizados - quem
 * renderiza precisa saber que cada barra e independente.
 *
 * minShare filtra tracos: um unico arquivo de reset nao significa "usa CSS".
 */
export function languageSpread(repos, opts = {}) {
  const { limit = 6, exclude = [], includeArchived = true, minShare = 5 } = opts;

  const skip = new Set(exclude.map((s) => String(s).toLowerCase()));
  const pool = includeArchived ? repos : repos.filter((r) => !r.isArchived);
  const counts = new Map();

  for (const repo of pool) {
    const edges = repo.languages?.edges || [];
    const bytes = edges.reduce((sum, e) => sum + (e.size || 0), 0);
    if (!bytes) continue;

    // Set por repositorio: a mesma linguagem nunca vota duas vezes no mesmo repo,
    // mesmo que a API devolvesse arestas repetidas.
    const vistas = new Set();
    for (const edge of edges) {
      const name = edge.node?.name;
      if (!name || skip.has(name.toLowerCase()) || vistas.has(name)) continue;
      if (((edge.size || 0) / bytes) * 100 < minShare) continue;
      vistas.add(name);
      const entry = counts.get(name) || {
        name,
        color: languageColor(name, edge.node?.color),
        repos: 0,
      };
      entry.repos++;
      counts.set(name, entry);
    }
  }

  // Total sao os repositorios com codigo detectavel. Contar os vazios inflaria o
  // denominador e faria toda barra parecer menor do que e.
  const total = pool.filter((r) => (r.languages?.edges || []).some((e) => e.size > 0)).length;
  if (!total) return { total: 0, langs: [] };

  const langs = [...counts.values()]
    .sort((a, b) => b.repos - a.repos || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((l) => ({ ...l, share: (l.repos / total) * 100 }));

  return { total, langs };
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
    groupOthers = false,
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
    // Sem a fatia "Outras", renormaliza: as linguagens mostradas passam a ser
    // o universo, e os percentuais precisam voltar a fechar em 100%.
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
