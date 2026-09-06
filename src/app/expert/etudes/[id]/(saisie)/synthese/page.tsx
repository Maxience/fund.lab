import type { Metadata } from 'next';

import { EtapeSynthese } from '@/composants/parcours/etapes/synthese';

export const metadata: Metadata = { title: 'Synthèse' };

export default function Page() {
  return <EtapeSynthese />;
}
