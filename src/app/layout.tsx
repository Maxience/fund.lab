import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Outil de chalandise FUND.lab',
    template: '%s | Outil de chalandise FUND.lab',
  },
  description:
    'Étude de chalandise pour projets de restauration, snack et salon de thé : demande accessible, concurrence, vides commerciaux, risques et orientation de décision.',
};

export default function MiseEnPageRacine({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
