'use client';

import { useActionState } from 'react';

import { creerEtudeAction, type EtatFormulaire } from '@/app/expert/actions';
import { Alerte } from '@/composants/ui/alerte';
import { Bouton } from '@/composants/ui/bouton';
import { Champ, CLASSES_CONTROLE, attributsControle } from '@/composants/ui/champ';

const ETAT_INITIAL: EtatFormulaire = {};

export function FormulaireNouvelleEtude({
  clients,
  clientInitial,
}: {
  clients: { id: string; nom: string }[];
  clientInitial?: string;
}) {
  const [etat, action, enCours] = useActionState(creerEtudeAction, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {etat.erreur && (
        <Alerte niveau="critique" titre="Création refusée">
          {etat.erreur}
        </Alerte>
      )}
      <Champ
        id="nouvelle-nom"
        libelle="Nom du projet"
        aide="Modifiable ensuite à la première étape."
      >
        <input
          {...attributsControle('nouvelle-nom', 'aide')}
          name="nomProjet"
          type="text"
          className={CLASSES_CONTROLE}
          placeholder="Snack Le Carrefour"
          maxLength={120}
        />
      </Champ>
      <Champ
        id="nouvelle-client"
        libelle="Client"
        aide="Facultatif : l'étude peut être rattachée plus tard."
      >
        <select
          {...attributsControle('nouvelle-client', 'aide')}
          name="clientId"
          className={CLASSES_CONTROLE}
          defaultValue={clientInitial ?? ''}
        >
          <option value="">Sans client pour l&apos;instant</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </Champ>
      <div>
        <Bouton type="submit" taille="grande" disabled={enCours}>
          {enCours ? 'Création…' : 'Créer et commencer la saisie'}
        </Bouton>
      </div>
    </form>
  );
}
