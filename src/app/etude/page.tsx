'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useEtude } from '@/composants/parcours/contexte-etude';
import { cheminEtape, ETAPES } from '@/lib/parcours/etapes';

/** Reprend le parcours à la dernière étape atteinte. */
export default function RepriseEtude() {
  const router = useRouter();
  const { locale } = useEtude();

  useEffect(() => {
    const etape = ETAPES[Math.min(Math.max(locale.etapeAtteinte, 1), ETAPES.length) - 1];
    router.replace(cheminEtape(etape.slug));
  }, [locale.etapeAtteinte, router]);

  return (
    <p className="text-[14px] text-encre-secondaire" role="status">
      Reprise de votre étude…
    </p>
  );
}
