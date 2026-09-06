import type { Metadata } from 'next';

import { EtapeHypotheses } from '@/composants/parcours/etapes/hypotheses';

export const metadata: Metadata = { title: 'Hypothèses commerciales' };

export default function PageHypotheses() {
  return <EtapeHypotheses />;
}
