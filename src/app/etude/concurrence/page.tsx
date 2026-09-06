import type { Metadata } from 'next';

import { EtapeConcurrence } from '@/composants/parcours/etapes/concurrence';

export const metadata: Metadata = { title: 'Concurrence' };

export default function PageConcurrence() {
  return <EtapeConcurrence />;
}
