'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { classes } from '@/lib/utilitaires/classes';

const LIENS = [
  { href: '/expert', libelle: 'Tableau de bord' },
  { href: '/expert/clients', libelle: 'Clients' },
  { href: '/expert/etudes/nouvelle', libelle: 'Nouvelle étude' },
];

/**
 * Navigation de l'espace Expert : colonne verticale dans la barre latérale
 * sur grand écran, ruban horizontal défilable sur mobile. L'étape courante
 * est mise en évidence par comparaison du chemin.
 */
export function NavigationExpert() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Espace Expert"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {LIENS.map((lien) => {
        const actif =
          lien.href === '/expert' ? pathname === '/expert' : pathname.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={actif ? 'page' : undefined}
            className={classes(
              'shrink-0 rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-medium',
              actif ? 'bg-accent-clair text-accent-fonce' : 'text-encre hover:bg-surface-appui',
            )}
          >
            {lien.libelle}
          </Link>
        );
      })}
    </nav>
  );
}
