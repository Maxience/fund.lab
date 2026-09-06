'use client';

import { useCallback, useMemo, useState } from 'react';

import type { SlugEtape } from '@/lib/parcours/etapes';
import { validerEtape, type ResultatValidationEtape } from '@/lib/parcours/validation-etape';

import { useEtude } from './contexte-etude';

export interface ValidationEtapeUi extends ResultatValidationEtape {
  /** Vrai après un premier clic sur Continuer : les erreurs s'affichent alors. */
  tentative: boolean;
  /** Message d'erreur d'un champ, seulement après tentative. */
  erreur: (chemin: string) => string | undefined;
  /** À brancher sur le bouton Continuer. */
  tenter: () => boolean;
}

/**
 * Validation d'une étape avec affichage différé des erreurs. Le préfixe
 * « use » est imposé par React pour les hooks.
 */
export function useValidationEtape(slug: SlugEtape): ValidationEtapeUi {
  const { etude } = useEtude();
  const [tentative, setTentative] = useState(false);
  const resultat = useMemo(() => validerEtape(slug, etude), [slug, etude]);

  const erreur = useCallback(
    (chemin: string) => (tentative ? resultat.erreursChamps[chemin] : undefined),
    [tentative, resultat],
  );

  const tenter = useCallback(() => {
    setTentative(true);
    if (!resultat.ok && typeof document !== 'undefined') {
      // Amène le premier message d'erreur à l'écran.
      requestAnimationFrame(() => {
        document
          .querySelector('[role="alert"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    return resultat.ok;
  }, [resultat]);

  return { ...resultat, tentative, erreur, tenter };
}
