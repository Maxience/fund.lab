'use client';

import { useRouter } from 'next/navigation';

import { Bouton, LienBouton } from '@/composants/ui/bouton';
import { cheminEtape, etapePrecedente, etapeSuivante, type SlugEtape } from '@/lib/parcours/etapes';

import { useEtude } from './contexte-etude';

export interface ProprietesNavigationEtape {
  slug: SlugEtape;
  /** Validation déclenchée au clic sur Continuer ; retourne vrai si l'on peut avancer. */
  onContinuer: () => boolean;
  libelleSuivant?: string;
}

/** Boutons Précédent et Continuer, avec déverrouillage de l'étape suivante. */
export function NavigationEtape({ slug, onContinuer, libelleSuivant }: ProprietesNavigationEtape) {
  const router = useRouter();
  const { marquerEtapeAtteinte } = useEtude();
  const precedente = etapePrecedente(slug);
  const suivante = etapeSuivante(slug);

  const continuer = () => {
    if (!onContinuer() || !suivante) return;
    marquerEtapeAtteinte(suivante.numero);
    router.push(cheminEtape(suivante.slug));
  };

  return (
    <div className="sans-impression mt-8 flex flex-col-reverse gap-3 border-t border-bordure pt-5 sm:flex-row sm:items-center sm:justify-between">
      {precedente ? (
        <LienBouton href={cheminEtape(precedente.slug)} variante="secondaire">
          Précédent : {precedente.court}
        </LienBouton>
      ) : (
        <LienBouton href="/" variante="secondaire">
          Accueil
        </LienBouton>
      )}
      {suivante && (
        <Bouton onClick={continuer} taille="grande">
          {libelleSuivant ?? `Continuer : ${suivante.court}`}
        </Bouton>
      )}
    </div>
  );
}
