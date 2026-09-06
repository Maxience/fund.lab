import type { Metadata } from 'next';

import { EtapeProjet } from '@/composants/parcours/etapes/projet';

export const metadata: Metadata = { title: 'Cadrer le projet' };

export default function Page() {
  return <EtapeProjet />;
}
