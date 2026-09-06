import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { CoquilleParcours } from '@/composants/parcours/coquille-parcours';
import { FournisseurEtudeServeur } from '@/composants/parcours/fournisseur-etude-serveur';
import { ErreurIntrouvable } from '@/lib/services/erreurs';
import { obtenirSaisie } from '@/lib/services/etudes';

/**
 * Saisie d'une étude par un Expert : les mêmes huit étapes que le parcours
 * PME, branchées sur la base au lieu du navigateur.
 */
export default async function MiseEnPageSaisieExpert({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let donnees: Awaited<ReturnType<typeof obtenirSaisie>>;
  try {
    donnees = await obtenirSaisie(id);
  } catch (erreur) {
    if (erreur instanceof ErreurIntrouvable) notFound();
    throw erreur;
  }
  const { etude, saisie } = donnees;

  return (
    <FournisseurEtudeServeur
      etudeId={etude.id}
      saisieInitiale={saisie}
      statut={etude.statut === 'COMPLETE' ? 'COMPLETE' : 'BROUILLON'}
      etapeAtteinte={etude.etapeAtteinte}
      creeLe={etude.creeLe.toISOString()}
      misAJourLe={etude.misAJourLe.toISOString()}
    >
      <CoquilleParcours>{children}</CoquilleParcours>
    </FournisseurEtudeServeur>
  );
}
