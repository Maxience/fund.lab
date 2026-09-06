import type { Metadata } from 'next';

import { EtapeRisques } from '@/composants/parcours/etapes/risques';

export const metadata: Metadata = { title: 'Risques' };

export default function PageRisques() {
  return <EtapeRisques />;
}
