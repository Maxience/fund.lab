import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

export type VarianteBouton = 'primaire' | 'secondaire' | 'discret' | 'danger';
export type TailleBouton = 'normale' | 'petite' | 'grande';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-champ)] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTES: Record<VarianteBouton, string> = {
  primaire: 'bg-accent text-white hover:bg-accent-fonce',
  secondaire: 'border border-bordure-forte bg-surface text-encre hover:bg-surface-appui',
  discret: 'text-accent hover:bg-accent-clair',
  danger: 'border border-critique text-critique hover:bg-critique-clair',
};

const TAILLES: Record<TailleBouton, string> = {
  petite: 'min-h-9 px-3 text-sm',
  normale: 'min-h-11 px-4 text-[15px]',
  grande: 'min-h-12 px-6 text-base',
};

export function classesBouton(variante: VarianteBouton, taille: TailleBouton, extra?: string) {
  return classes(BASE, VARIANTES[variante], TAILLES[taille], extra);
}

export interface ProprietesBouton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBouton;
  taille?: TailleBouton;
}

export function Bouton({
  variante = 'primaire',
  taille = 'normale',
  className,
  type = 'button',
  ...props
}: ProprietesBouton) {
  return <button type={type} className={classesBouton(variante, taille, className)} {...props} />;
}

export interface ProprietesLienBouton {
  href: string;
  children: ReactNode;
  variante?: VarianteBouton;
  taille?: TailleBouton;
  className?: string;
}

export function LienBouton({
  href,
  children,
  variante = 'primaire',
  taille = 'normale',
  className,
}: ProprietesLienBouton) {
  return (
    <Link href={href} className={classesBouton(variante, taille, className)}>
      {children}
    </Link>
  );
}
