// Dados falsos no mesmo formato cru que fetchUser() devolve, para que passem
// direto por aggregate(). Servem para ajustar o visual sem gastar rate limit
// e sem exigir token - inclui casos chatos de proposito: nome longo,
// repo arquivado, linguagem sem cor oficial e cauda longa para virar "Outras".

const repo = (name, stars, primary, langs, extra = {}) => ({
  name,
  isPrivate: false,
  isArchived: false,
  stargazerCount: stars,
  primaryLanguage: primary,
  languages: { edges: langs.map(([node, size]) => ({ size, node })) },
  ...extra,
});

const TS = { name: "TypeScript", color: "#3178c6" };
const JS = { name: "JavaScript", color: "#f1e05a" };
const PY = { name: "Python", color: "#3572A5" };
const GO = { name: "Go", color: "#00ADD8" };
const RS = { name: "Rust", color: "#dea584" };
const CSS = { name: "CSS", color: "#563d7c" };
const HTML = { name: "HTML", color: "#e34c26" };
const SH = { name: "Shell", color: "#89e051" };
const GLEAM = { name: "Gleam", color: null }; // sem cor da API: exercita o fallback

export const MOCK = {
  user: {
    name: "Ana Ribeiro de Albuquerque",
    login: "smiith",
    followers: { totalCount: 1284 },
    contributionsCollection: {
      totalCommitContributions: 1893,
      totalPullRequestReviewContributions: 214,
      restrictedContributionsCount: 476,
      contributionCalendar: { totalContributions: 2841 },
    },
    pullRequests: { totalCount: 337 },
    openIssues: { totalCount: 42 },
    closedIssues: { totalCount: 268 },
    repositories: { totalCount: 74 },
  },
  repos: [
    repo("orbit", 4210, TS, [[TS, 812000], [CSS, 94000], [HTML, 21000]]),
    repo("cadence", 1830, TS, [[TS, 402000], [JS, 61000]]),
    repo("ferrite", 962, RS, [[RS, 588000], [SH, 12000]]),
    repo("tidepool", 704, PY, [[PY, 331000], [SH, 8000]]),
    repo("beacon", 388, GO, [[GO, 275000], [SH, 15000]]),
    repo("halyard", 205, TS, [[TS, 143000], [CSS, 38000]]),
    repo("mistral-notes", 96, PY, [[PY, 88000]]),
    repo("gleam-toys", 41, GLEAM, [[GLEAM, 52000]]),
    repo("dotfiles", 28, SH, [[SH, 41000]]),
    repo("static-site", 12, HTML, [[HTML, 96000], [CSS, 74000]], { isArchived: true }),
    repo("scratch", 3, JS, [[JS, 19000]]),
  ],
};
