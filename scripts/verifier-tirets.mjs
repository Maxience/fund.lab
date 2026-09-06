#!/usr/bin/env node
/**
 * Contrôle des tirets interdits.
 *
 * Parcourt les fichiers versionnés (ou en attente de l'être) et échoue si
 * l'un d'eux contient un tiret cadratin (U+2014) ou un tiret demi-cadratin
 * (U+2013), sous forme littérale, d'entité HTML ou de séquence d'échappement.
 * Les noms de fichiers sont contrôlés de la même façon.
 *
 * La liste des fichiers vient de git, ce qui respecte .gitignore et les
 * exclusions locales : seul ce qui entre dans le dépôt est contrôlé.
 *
 * Usage : node scripts/verifier-tirets.mjs
 * Code de sortie : 0 si rien n'est trouvé, 1 sinon.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const cadratin = String.fromCodePoint(0x2014);
const demiCadratin = String.fromCodePoint(0x2013);

// Les motifs sont assemblés par morceaux pour que ce script ne se signale
// pas lui-même.
const MOTIFS = [
  { libelle: 'tiret cadratin (U+2014)', regex: new RegExp(cadratin, 'g') },
  { libelle: 'tiret demi-cadratin (U+2013)', regex: new RegExp(demiCadratin, 'g') },
  {
    libelle: 'entité HTML du tiret cadratin',
    regex: new RegExp('&' + 'mdash;|&#' + '8212;|&#x' + '2014;', 'gi'),
  },
  {
    libelle: 'entité HTML du tiret demi-cadratin',
    regex: new RegExp('&' + 'ndash;|&#' + '8211;|&#x' + '2013;', 'gi'),
  },
  {
    libelle: "séquence d'échappement du tiret",
    regex: new RegExp('\\\\u201[34]', 'gi'),
  },
];

function listerFichiers() {
  const sortie = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { encoding: 'utf8' },
  );
  return sortie.split('\0').filter((chemin) => chemin.length > 0);
}

function estBinaire(contenu) {
  return contenu.includes(0);
}

const constats = [];

for (const chemin of listerFichiers()) {
  for (const motif of MOTIFS.slice(0, 2)) {
    if (motif.regex.test(chemin)) {
      constats.push(`${chemin} : nom de fichier contenant un ${motif.libelle}`);
    }
    motif.regex.lastIndex = 0;
  }

  let tampon;
  try {
    tampon = readFileSync(chemin);
  } catch {
    continue; // Fichier supprimé entre la liste et la lecture.
  }
  if (estBinaire(tampon)) continue;

  const lignes = tampon.toString('utf8').split('\n');
  lignes.forEach((ligne, index) => {
    for (const motif of MOTIFS) {
      for (const correspondance of ligne.matchAll(motif.regex)) {
        constats.push(`${chemin}:${index + 1}:${correspondance.index + 1} ${motif.libelle}`);
      }
    }
  });
}

if (constats.length > 0) {
  console.error(`Tirets interdits : ${constats.length} constat(s).`);
  for (const constat of constats) console.error(`  ${constat}`);
  console.error('Remplacer par deux-points, virgule, parenthèses ou point (docs/conventions.md).');
  process.exit(1);
}

console.log('Tirets interdits : aucun constat.');
