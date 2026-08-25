// Nome de linguagem do GitHub -> nome do arquivo em tandpfun/skill-icons.
//
// Fonte de verdade unica: scripts/fetch-icons.js le este mapa para baixar
// exatamente os icones usados, e nada mais. Linguagem fora do mapa cai no
// quadradinho colorido de sempre - o card nunca fica com buraco.
//
// Icones marcados com `variants: true` existem em -Dark e -Light; o card escolhe
// conforme o tema, porque o tile do icone tem fundo proprio.
const ICON = (file, variants = false) => ({ file, variants });

export const LANGUAGE_ICONS = {
  // O nome do arquivo nem sempre bate com o nome da linguagem: o GitHub diz
  // "Go", o skill-icons chama de "GoLang"; "C++" vira "CPP" porque "+" nao
  // sobrevive em nome de arquivo.
  "typescript": ICON("TypeScript"),
  "javascript": ICON("JavaScript"),
  "python": ICON("Python", true),
  "go": ICON("GoLang"),
  "rust": ICON("Rust"),
  "ruby": ICON("Ruby"),
  "java": ICON("Java", true),
  "kotlin": ICON("Kotlin", true),
  "swift": ICON("Swift"),
  "dart": ICON("Dart", true),
  "php": ICON("PHP", true),
  "c": ICON("C"),
  "c++": ICON("CPP"),
  "c#": ICON("CS"),
  "css": ICON("CSS"),
  "html": ICON("HTML"),
  "scss": ICON("Sass"),
  "sass": ICON("Sass"),
  "less": ICON("Less", true),
  "shell": ICON("Bash", true),
  "powershell": ICON("Powershell", true),
  "lua": ICON("Lua", true),
  "perl": ICON("Perl"),
  "r": ICON("R", true),
  "scala": ICON("Scala", true),
  "elixir": ICON("Elixir", true),
  "haskell": ICON("Haskell", true),
  "zig": ICON("Zig", true),
  "nim": ICON("Nim", true),
  "julia": ICON("Julia", true),
  "ocaml": ICON("OCaml"),
  "clojure": ICON("Clojure", true),
  "crystal": ICON("Crystal", true),
  "coffeescript": ICON("CoffeeScript", true),
  "solidity": ICON("Solidity"),
  "markdown": ICON("Markdown", true),
  "vue": ICON("VueJS", true),
  "svelte": ICON("Svelte"),
  "astro": ICON("Astro"),
  "fortran": ICON("Fortran"),
  "matlab": ICON("Matlab", true),
  "nix": ICON("Nix", true),
  "haxe": ICON("Haxe", true),
  "verilog": ICON("Verilog"),
  "vala": ICON("Vala"),
  "webassembly": ICON("WebAssembly"),
  "pug": ICON("Pug", true),
  "gherkin": ICON("Gherkin", true),
  "forth": ICON("Forth"),
  "v": ICON("V", true),
  "pkl": ICON("Pkl", true),
  "svg": ICON("SVG", true),
  "cmake": ICON("CMake", true),

  // Casos em que a linguagem nao tem icone proprio, mas a ferramenta dona dela tem.
  "dockerfile": ICON("Docker"),
  "hcl": ICON("Terraform", true), // HCL e a linguagem do Terraform
  "plpgsql": ICON("PostgreSQL", true),
  "blade": ICON("Laravel", true), // template engine do Laravel
  "tex": ICON("LaTeX", true),
  "vim script": ICON("VIM", true),
  "vim snippet": ICON("VIM", true),
  "emacs lisp": ICON("Emacs"),
};

/** Nomes de arquivo que scripts/fetch-icons.js precisa baixar. */
export function requiredFiles() {
  const files = new Set();
  for (const { file, variants } of Object.values(LANGUAGE_ICONS)) {
    if (variants) {
      files.add(`${file}-Dark`);
      files.add(`${file}-Light`);
    } else {
      files.add(file);
    }
  }
  return [...files].sort();
}
