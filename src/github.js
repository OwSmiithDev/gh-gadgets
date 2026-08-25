const ENDPOINT = "https://api.github.com/graphql";

/**
 * Le PAT_1, PAT_2, ... do ambiente. Multiplos tokens = mais teto de rate limit,
 * porque o limite do GraphQL (5000 pontos/h) e por token, nao por app.
 */
function tokens() {
  const list = Object.keys(process.env)
    .filter((k) => /^PAT_\d+$/.test(k))
    .sort()
    .map((k) => process.env[k])
    .filter(Boolean);
  if (process.env.GITHUB_TOKEN) list.push(process.env.GITHUB_TOKEN);
  return list;
}

let cursor = 0;
function nextToken() {
  const list = tokens();
  if (!list.length) {
    throw new Error(
      "Nenhum token configurado — defina PAT_1 no ambiente."
    );
  }
  const t = list[cursor % list.length];
  cursor++;
  return t;
}

async function request(query, variables, token) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "gh-gadgets",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 401 || res.status === 403) {
    const err = new Error("Token inválido ou rate limit excedido.");
    err.retryable = true;
    throw err;
  }

  const json = await res.json();

  if (json.errors?.length) {
    const first = json.errors[0];
    if (first.type === "NOT_FOUND") {
      const err = new Error("Usuário não encontrado no GitHub.");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (first.type === "RATE_LIMITED") {
      const err = new Error("Rate limit excedido.");
      err.retryable = true;
      throw err;
    }
    throw new Error(first.message || "Erro na API do GitHub.");
  }

  return json.data;
}

/** Tenta cada token disponivel antes de desistir. */
async function graphql(query, variables) {
  const total = tokens().length;
  let lastErr;
  for (let i = 0; i < Math.max(1, total); i++) {
    try {
      return await request(query, variables, nextToken());
    } catch (e) {
      if (!e.retryable) throw e;
      lastErr = e;
    }
  }
  throw lastErr;
}

const STATS_QUERY = `
query userStats($login: String!, $after: String, $includeAll: Boolean!) {
  user(login: $login) {
    name
    login
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions }
    }
    pullRequests { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    repositories(
      first: 100
      after: $after
      ownerAffiliations: OWNER
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        isPrivate
        isArchived
        stargazerCount
        primaryLanguage { name color }
        languages(first: 12, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
  }
  rateLimit @include(if: $includeAll) { remaining resetAt }
}`;

/**
 * Busca perfil + todos os repos (paginado) em uma unica passada.
 * Retorna dados crus; a agregacao fica em stats.js.
 */
export async function fetchUser(login) {
  let after = null;
  let user = null;
  const repos = [];

  // Trava de seguranca: 5 paginas = ate 500 repos.
  for (let page = 0; page < 5; page++) {
    const data = await graphql(STATS_QUERY, {
      login,
      after,
      includeAll: page === 0,
    });
    if (!data?.user) {
      const err = new Error("Usuário não encontrado no GitHub.");
      err.code = "NOT_FOUND";
      throw err;
    }
    user = user || data.user;
    repos.push(...data.user.repositories.nodes);
    const info = data.user.repositories.pageInfo;
    if (!info.hasNextPage) break;
    after = info.endCursor;
  }

  return { user, repos };
}
