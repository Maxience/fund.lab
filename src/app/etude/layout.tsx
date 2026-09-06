import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { FournisseurEtude } from '@/composants/parcours/contexte-etude';
import { CoquilleParcours } from '@/composants/parcours/coquille-parcours';

export const metadata: Metadata = {
  title: 'Étude de chalandise',
};

function Chargement() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" role="status" aria-live="polite">
      <p className="text-[14px] text-encre-secondaire">Chargement de votre étude…</p>
    </div>
  );
}

export default function MiseEnPageEtude({ children }: { children: ReactNode }) {
  return (
    <FournisseurEtude attente={<Chargement />}>
      <CoquilleParcours>{children}</CoquilleParcours>
    </FournisseurEtude>
  );
}
