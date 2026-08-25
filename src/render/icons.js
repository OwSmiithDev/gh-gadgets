import { LANGUAGE_ICONS } from "./icon-map.js";
import { ICON_DATA } from "./icon-data.js";
import { isDarkTheme } from "./themes.js";

/**
 * data: URI do icone da linguagem, ou null quando nao existe icone para ela.
 * Null nao e erro: o card volta ao quadradinho colorido, que sempre funciona.
 */
export function iconFor(languageName, theme) {
  const entry = LANGUAGE_ICONS[String(languageName || "").toLowerCase()];
  if (!entry) return null;

  const suffix = entry.variants ? (isDarkTheme(theme) ? "-Dark" : "-Light") : "";
  const data = ICON_DATA[`${entry.file}${suffix}`];
  if (!data) return null;

  return `data:image/svg+xml;base64,${data}`;
}

/** Quantas das linguagens dadas tem icone - usado so para log/diagnostico. */
export function iconCoverage(langs, theme) {
  return langs.filter((l) => iconFor(l.name, theme)).length;
}
