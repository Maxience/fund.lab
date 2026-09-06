/**
 * Page racine provisoire. Le parcours PME séquencé en huit étapes prendra
 * cette place en phase 4 du plan d'implémentation.
 */
export default function Accueil() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-16">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">FUND.lab</p>
      <h1 className="text-3xl font-bold tracking-tight">Outil d&apos;étude de chalandise</h1>
      <p className="mt-3 text-encre-secondaire">
        Restauration, snack et salon de thé. Le parcours d&apos;étude est en construction.
      </p>
    </main>
  );
}
