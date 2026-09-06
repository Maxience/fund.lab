'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { CAS_NOMINAL } from '@/lib/moteur';
import { cheminEtape, NOMBRE_ETAPES } from '@/lib/parcours/etapes';
import { chargerEtude } from '@/lib/parcours/magasin-etude';

/**
 * Charge le cas de référence nominal comme étude en cours et ouvre la
 * synthèse. Sert de démonstration : toutes les données sont fictives.
 */
export default function PageExemple() {
  const router = useRouter();

  useEffect(() => {
    chargerEtude(structuredClone(CAS_NOMINAL), NOMBRE_ETAPES);
    router.replace(cheminEtape('synthese'));
  }, [router]);

  return (
    <p className="text-[14px] text-encre-secondaire" role="status">
      Chargement de l&apos;exemple…
    </p>
  );
}
