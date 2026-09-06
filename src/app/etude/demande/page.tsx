import type { Metadata } from 'next';

import { EtapeDemande } from '@/composants/parcours/etapes/demande';

export const metadata: Metadata = { title: 'Demande' };

export default function PageDemande() {
  return <EtapeDemande />;
}
