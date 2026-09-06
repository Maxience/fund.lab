'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { cheminEtape, ETAPES } from '@/lib/parcours/etapes';
import { instantane, instantaneServeur, souscrire } from '@/lib/parcours/magasin-etude';

/** Propose de reprendre l'étude enregistrée dans ce navigateur, s'il y en a une. */
export function RepriseEtude() {
  const etat = useSyncExternalStore(souscrire, instantane, instantaneServeur);
  const locale = etat.existante ? etat.locale : null;

  if (!locale) return null;
  const etape = ETAPES[Math.min(Math.max(locale.etapeAtteinte, 1), ETAPES.length) - 1];
  const nom = locale.etude.projet.nom.trim();

  return (
    <div className="rounded-[var(--radius-carte)] border border-accent bg-accent-clair px-4 py-3 text-[14px]">
      <p className="font-semibold text-accent-fonce">
        Une étude est enregistrée dans ce navigateur
      </p>
      <p className="mt-0.5 text-encre-secondaire">
        {nom ? `« ${nom} »` : 'Étude sans nom'},{' '}
        {locale.statut === 'COMPLETE'
          ? 'finalisée'
          : `arrêtée à l'étape ${etape.numero} (${etape.court})`}
        .
      </p>
      <Link
        href={cheminEtape(locale.statut === 'COMPLETE' ? 'synthese' : etape.slug)}
        className="mt-2 inline-block font-semibold text-accent underline-offset-2 hover:underline"
      >
        Reprendre cette étude
      </Link>
    </div>
  );
}
