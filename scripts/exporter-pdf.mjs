#!/usr/bin/env node
/**
 * Export PDF d'un document Markdown du dépôt.
 *
 * Convertit le Markdown en HTML avec une feuille de style d'impression, puis
 * imprime en PDF avec Edge ou Chrome en mode sans interface. Les fichiers
 * produits vont dans livrables/, hors du dépôt, et se régénèrent à la
 * demande : la source reste le Markdown versionné.
 *
 * Usage : node scripts/exporter-pdf.mjs docs/cadrage/note-de-cadrage.md [autre.md ...]
 * Variable facultative : NAVIGATEUR_PDF, chemin d'un exécutable Chromium.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';

const DOSSIER_SORTIE = resolve('livrables');
const ATTENTE_MAX_MS = 90_000;
const PAS_ATTENTE_MS = 250;

const NAVIGATEURS_CANDIDATS = [
  process.env.NAVIGATEUR_PDF,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const STYLE = `
  @page { size: A4; margin: 15mm 14mm 15mm 14mm; }
  html { font-family: 'Segoe UI', system-ui, Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #111; }
  body { margin: 0; }
  h1 { font-size: 19pt; margin: 0 0 5pt; letter-spacing: -0.01em; }
  h2 { font-size: 13pt; margin: 14pt 0 5pt; padding-bottom: 2pt; border-bottom: 1px solid #b9b9b3; break-after: avoid; }
  h3 { font-size: 11pt; margin: 10pt 0 4pt; break-after: avoid; }
  p { margin: 0 0 6pt; }
  ul, ol { margin: 0 0 6pt; padding-left: 17pt; }
  li { margin-bottom: 2pt; }
  table { border-collapse: collapse; width: 100%; margin: 5pt 0 9pt; font-size: 8.5pt; line-height: 1.3; }
  th, td { border: 1px solid #c9c9c3; padding: 2.5pt 4pt; vertical-align: top; text-align: left; }
  th { background: #f0f0ec; font-weight: 600; }
  tr { break-inside: avoid; }
  code { font-family: Consolas, 'Courier New', monospace; font-size: 8.5pt; background: #f4f4f1; padding: 0 2pt; }
  pre { background: #f4f4f1; border: 1px solid #ddddd8; padding: 5pt 7pt; font-size: 8pt; white-space: pre-wrap; }
  pre code { background: none; padding: 0; }
  a { color: #0f766e; text-decoration: none; }
  strong { font-weight: 600; }
  hr { border: 0; border-top: 1px solid #b9b9b3; margin: 10pt 0; }
`;

function trouverNavigateur() {
  const trouve = NAVIGATEURS_CANDIDATS.find((chemin) => existsSync(chemin));
  if (!trouve) {
    throw new Error(
      'Aucun navigateur Chromium trouvé. Définir NAVIGATEUR_PDF avec le chemin de Edge ou Chrome.',
    );
  }
  return trouve;
}

function extraireTitre(markdown, repli) {
  const ligne = markdown.split('\n').find((l) => l.startsWith('# '));
  return ligne ? ligne.slice(2).trim() : repli;
}

function convertirEnHtml(cheminMarkdown) {
  const markdown = readFileSync(cheminMarkdown, 'utf8');
  const titre = extraireTitre(markdown, basename(cheminMarkdown, extname(cheminMarkdown)));
  const corps = marked.parse(markdown, { gfm: true });
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre}</title>
<style>${STYLE}</style>
</head>
<body>
${corps}
</body>
</html>
`;
}

/** Pause synchrone, sans dépendance, utilisable dans un script court. */
function attendre(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Attend que le PDF existe et que sa taille soit stable. Sur Windows, le
 * lanceur du navigateur rend la main avant que le processus de rendu ait
 * fini d'écrire le fichier.
 */
function attendrePdf(cheminPdf) {
  const debut = Date.now();
  let tailleStable = -1;
  while (Date.now() - debut < ATTENTE_MAX_MS) {
    if (existsSync(cheminPdf)) {
      const taille = statSync(cheminPdf).size;
      if (taille > 0 && taille === tailleStable) return true;
      tailleStable = taille;
    }
    attendre(PAS_ATTENTE_MS);
  }
  return false;
}

function imprimerEnPdf(navigateur, cheminHtml, cheminPdf) {
  // Profil temporaire : ne touche pas au profil de l'utilisateur et n'entre
  // pas en conflit avec une fenêtre du navigateur déjà ouverte.
  const profil = mkdtempSync(join(tmpdir(), 'chalandise-pdf-'));
  rmSync(cheminPdf, { force: true });
  try {
    execFileSync(
      navigateur,
      [
        '--headless',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        `--user-data-dir=${profil}`,
        '--no-pdf-header-footer',
        '--virtual-time-budget=5000',
        `--print-to-pdf=${cheminPdf}`,
        pathToFileURL(cheminHtml).href,
      ],
      { stdio: 'pipe', timeout: 120_000 },
    );
    return attendrePdf(cheminPdf);
  } finally {
    // Le navigateur peut garder le profil verrouillé quelques instants.
    try {
      rmSync(profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
    } catch {
      // Dossier temporaire : son nettoyage n'est pas critique.
    }
  }
}

const sources = process.argv.slice(2);
if (sources.length === 0) {
  console.error('Usage : node scripts/exporter-pdf.mjs <fichier.md> [autre.md ...]');
  process.exit(2);
}

const navigateur = trouverNavigateur();
mkdirSync(DOSSIER_SORTIE, { recursive: true });

for (const source of sources) {
  const cheminSource = resolve(source);
  if (!existsSync(cheminSource)) {
    console.error(`Introuvable : ${source}`);
    process.exit(1);
  }
  const nom = basename(cheminSource, extname(cheminSource));
  const cheminHtml = join(DOSSIER_SORTIE, `${nom}.html`);
  const cheminPdf = join(DOSSIER_SORTIE, `${nom}.pdf`);

  writeFileSync(cheminHtml, convertirEnHtml(cheminSource), 'utf8');
  const produit = imprimerEnPdf(navigateur, cheminHtml, cheminPdf);

  if (!produit) {
    console.error(`Le PDF n'a pas été produit pour ${source}.`);
    process.exit(1);
  }
  console.log(`PDF : ${cheminPdf}`);
}
