import { formaterDecimal } from '@/lib/moteur';

export interface ProprietesJaugeScore {
  score: number;
  seuils: { noGoStrict: number; goInclus: number };
  libelles: { noGo: string; sousConditions: string; go: string };
}

/**
 * Jauge horizontale de 0 à 100 avec les trois zones de décision et le repère
 * du score. Rendue en SVG côté serveur, nette à l'impression. Les valeurs
 * sont écrites : la couleur seule ne porte jamais l'information.
 */
export function JaugeScore({ score, seuils, libelles }: ProprietesJaugeScore) {
  const largeur = 600;
  const hauteur = 54;
  const x = (v: number) => (Math.min(100, Math.max(0, v)) / 100) * largeur;
  const description = `Score global de ${formaterDecimal(score, 1)} sur 100. ${libelles.noGo} sous ${seuils.noGoStrict}, ${libelles.sousConditions} de ${seuils.noGoStrict} à ${seuils.goInclus}, ${libelles.go} à partir de ${seuils.goInclus}.`;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="h-auto w-full"
        role="img"
        aria-label={description}
        preserveAspectRatio="none"
      >
        <rect
          x={0}
          y={18}
          width={x(seuils.noGoStrict)}
          height={14}
          fill="var(--statut-critique)"
          opacity={0.85}
        />
        <rect
          x={x(seuils.noGoStrict)}
          y={18}
          width={x(seuils.goInclus) - x(seuils.noGoStrict)}
          height={14}
          fill="var(--statut-vigilance)"
          opacity={0.85}
        />
        <rect
          x={x(seuils.goInclus)}
          y={18}
          width={largeur - x(seuils.goInclus)}
          height={14}
          fill="var(--statut-bon)"
          opacity={0.85}
        />
        <line
          x1={x(seuils.noGoStrict)}
          x2={x(seuils.noGoStrict)}
          y1={14}
          y2={36}
          stroke="var(--encre)"
          strokeWidth={1.5}
        />
        <line
          x1={x(seuils.goInclus)}
          x2={x(seuils.goInclus)}
          y1={14}
          y2={36}
          stroke="var(--encre)"
          strokeWidth={1.5}
        />
        <polygon
          points={`${x(score) - 8},4 ${x(score) + 8},4 ${x(score)},16`}
          fill="var(--encre)"
        />
        <line x1={x(score)} x2={x(score)} y1={16} y2={34} stroke="var(--encre)" strokeWidth={2} />
        <text
          x={x(seuils.noGoStrict)}
          y={50}
          textAnchor="middle"
          fontSize={12}
          fill="var(--encre-secondaire)"
        >
          {seuils.noGoStrict}
        </text>
        <text
          x={x(seuils.goInclus)}
          y={50}
          textAnchor="middle"
          fontSize={12}
          fill="var(--encre-secondaire)"
        >
          {seuils.goInclus}
        </text>
        <text x={4} y={50} fontSize={12} fill="var(--encre-secondaire)">
          0
        </text>
        <text x={largeur - 4} y={50} textAnchor="end" fontSize={12} fill="var(--encre-secondaire)">
          100
        </text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap justify-between gap-x-4 text-[12px] text-encre-secondaire">
        <span>
          {libelles.noGo} sous {seuils.noGoStrict}
        </span>
        <span>
          {libelles.sousConditions} de {seuils.noGoStrict} à {seuils.goInclus}
        </span>
        <span>
          {libelles.go} à partir de {seuils.goInclus}
        </span>
      </figcaption>
    </figure>
  );
}

export interface ProprietesBarreIndicateur {
  valeur: number | null;
  /** Vrai si une valeur élevée est favorable (demande, gaps) ; faux si défavorable (concurrence, risque). */
  favorableSiEleve: boolean;
}

/** Petite barre de 0 à 100 sous un indicateur, avec sa valeur écrite à côté. */
export function BarreIndicateur({ valeur, favorableSiEleve }: ProprietesBarreIndicateur) {
  if (valeur === null) return null;
  const part = Math.min(100, Math.max(0, valeur));
  const favorable = favorableSiEleve ? part >= 50 : part < 50;
  return (
    <div
      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-appui"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${part}%`,
          background: favorable ? 'var(--statut-bon)' : 'var(--statut-vigilance)',
        }}
      />
    </div>
  );
}
