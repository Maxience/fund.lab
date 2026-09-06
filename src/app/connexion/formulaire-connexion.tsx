'use client';

import { useActionState } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import { Bouton } from '@/composants/ui/bouton';
import { CLASSES_CONTROLE } from '@/composants/ui/champ';

import { seConnecter, type EtatConnexion } from './actions';

const ETAT_INITIAL: EtatConnexion = {};

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState(seConnecter, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {suite && <input type="hidden" name="suite" value={suite} />}
      {etat.erreur && (
        <Alerte niveau="critique" titre="Connexion refusée">
          {etat.erreur}
        </Alerte>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[15px] font-medium text-encre">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={CLASSES_CONTROLE}
          placeholder="prenom.nom@fund-lab.example"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="motDePasse" className="text-[15px] font-medium text-encre">
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          className={CLASSES_CONTROLE}
        />
      </div>
      <Bouton type="submit" taille="grande" disabled={enCours}>
        {enCours ? 'Connexion…' : 'Se connecter'}
      </Bouton>
    </form>
  );
}
