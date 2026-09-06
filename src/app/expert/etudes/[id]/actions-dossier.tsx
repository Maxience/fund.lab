'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState, useTransition } from 'react';

import {
  archiverEtudeAction,
  dupliquerEtudeAction,
  finaliserEtudeAction,
  rattacherClientAction,
  restaurerEtudeAction,
  rouvrirEtudeAction,
  type EtatFormulaire,
} from '@/app/expert/actions';
import { Alerte } from '@/composants/ui/alerte';
import { Bouton, LienBouton } from '@/composants/ui/bouton';
import { CLASSES_CONTROLE } from '@/composants/ui/champ';

const ETAT_INITIAL: EtatFormulaire = {};

export interface ProprietesActionsDossier {
  etudeId: string;
  statut: 'BROUILLON' | 'COMPLETE' | 'ARCHIVEE';
  finalisable: boolean;
  etapeAtteinte: number;
  slugEtapeAtteinte: string;
}

/** Barre d'actions du dossier : saisie, finalisation, archivage, impression. */
export function ActionsDossier({
  etudeId,
  statut,
  finalisable,
  slugEtapeAtteinte,
}: ProprietesActionsDossier) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const executer = (action: (id: string) => Promise<{ ok: boolean; erreur?: string }>) =>
    demarrer(async () => {
      const reponse = await action(etudeId);
      if (reponse.ok) {
        setErreur(null);
        router.refresh();
      } else {
        setErreur(reponse.erreur ?? 'Opération refusée.');
      }
    });

  return (
    <div className="sans-impression flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {statut !== 'ARCHIVEE' && (
          <LienBouton href={`/expert/etudes/${etudeId}/${slugEtapeAtteinte}`} variante="primaire">
            {statut === 'COMPLETE' ? 'Consulter la saisie' : 'Poursuivre la saisie'}
          </LienBouton>
        )}
        {statut === 'BROUILLON' && (
          <Bouton
            variante="secondaire"
            disabled={!finalisable || enCours}
            title={finalisable ? undefined : 'Corrigez les points bloquants avant de finaliser.'}
            onClick={() => executer(finaliserEtudeAction)}
          >
            Finaliser l&apos;étude
          </Bouton>
        )}
        {statut === 'COMPLETE' && (
          <Bouton
            variante="secondaire"
            disabled={enCours}
            onClick={() => executer(rouvrirEtudeAction)}
          >
            Rouvrir pour modifier
          </Bouton>
        )}
        <Bouton variante="secondaire" onClick={() => window.print()}>
          Imprimer la restitution
        </Bouton>
        {statut === 'ARCHIVEE' ? (
          <form action={restaurerEtudeAction}>
            <input type="hidden" name="etudeId" value={etudeId} />
            <Bouton type="submit" variante="secondaire">
              Restaurer
            </Bouton>
          </form>
        ) : (
          <form
            action={archiverEtudeAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  'Archiver cette étude ? Elle restera consultable dans les archives.',
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="etudeId" value={etudeId} />
            <Bouton type="submit" variante="danger">
              Archiver
            </Bouton>
          </form>
        )}
      </div>
      {erreur && (
        <Alerte niveau="critique" titre="Opération refusée">
          {erreur}
        </Alerte>
      )}
    </div>
  );
}

/** Création d'un scénario dérivé. */
export function FormulaireScenario({ etudeId }: { etudeId: string }) {
  const [etat, action, enCours] = useActionState(dupliquerEtudeAction, ETAT_INITIAL);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
      <input type="hidden" name="etudeId" value={etudeId} />
      <label className="flex flex-1 flex-col gap-1.5 text-[14px] font-medium text-encre">
        Nom du scénario
        <input
          name="libelleScenario"
          type="text"
          className={CLASSES_CONTROLE}
          placeholder="Ticket à 3 000 FCFA"
          maxLength={120}
          required
        />
        {etat.erreur && (
          <span className="text-[13px] font-medium text-critique">{etat.erreur}</span>
        )}
      </label>
      <Bouton type="submit" variante="secondaire" disabled={enCours}>
        {enCours ? 'Création…' : 'Créer le scénario'}
      </Bouton>
    </form>
  );
}

/** Rattachement de l'étude à un client. */
export function FormulaireRattachement({
  etudeId,
  clientId,
  clients,
}: {
  etudeId: string;
  clientId: string | null;
  clients: { id: string; nom: string }[];
}) {
  const [etat, action, enCours] = useActionState(rattacherClientAction, ETAT_INITIAL);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
      <input type="hidden" name="etudeId" value={etudeId} />
      <label className="flex flex-1 flex-col gap-1.5 text-[14px] font-medium text-encre">
        Client
        <select name="clientId" className={CLASSES_CONTROLE} defaultValue={clientId ?? ''}>
          <option value="">Sans client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </label>
      <Bouton type="submit" variante="secondaire" disabled={enCours}>
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </Bouton>
      {etat.erreur && <span className="text-[13px] font-medium text-critique">{etat.erreur}</span>}
      {etat.succes && <span className="text-[13px] font-medium text-bon">{etat.succes}</span>}
    </form>
  );
}
