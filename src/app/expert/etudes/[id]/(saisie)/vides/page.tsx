import type { Metadata } from 'next';

import { EtapeVides } from '@/composants/parcours/etapes/vides';

export const metadata: Metadata = { title: 'Vides commerciaux' };

export default function Page() {
  return <EtapeVides />;
}
