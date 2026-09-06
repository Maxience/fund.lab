import type { Metadata } from 'next';

import { EtapeZones } from '@/composants/parcours/etapes/zones';

export const metadata: Metadata = { title: 'Zones de chalandise' };

export default function PageZones() {
  return <EtapeZones />;
}
