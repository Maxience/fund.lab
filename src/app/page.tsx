import { LienBouton } from '@/composants/ui/bouton';
import { cheminEtape } from '@/lib/parcours/etapes';

export default function Accueil() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-encre sm:text-[44px]">
        FUND.lab
      </h1>
      <p className="mt-4 max-w-md text-[16px] leading-relaxed text-encre-secondaire">
        Testez un emplacement avant de vous engager : demande, concurrence et risques en une étude
        guidée.
      </p>
      <div className="mt-8">
        <LienBouton href={cheminEtape('projet')} taille="grande">
          Commencer une étude
        </LienBouton>
      </div>
    </main>
  );
}
