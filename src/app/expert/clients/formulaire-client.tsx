'use client';

import { useActionState } from 'react';

import { creerClientAction, modifierClientAction, type EtatFormulaire } from '@/app/expert/actions';
import { Alerte } from '@/composants/ui/alerte';
import { Bouton } from '@/composants/ui/bouton';
import { Champ, CLASSES_CONTROLE, attributsControle } from '@/composants/ui/champ';

const ETAT_INITIAL: EtatFormulaire = {};

export interface ProprietesFormulaireClient {
  client?: { id: string; nom: string; contact: string | null; notesInternes: string | null };
}

export function FormulaireClient({ client }: ProprietesFormulaireClient) {
  const [etat, action, enCours] = useActionState(
    client ? modifierClientAction : creerClientAction,
    ETAT_INITIAL,
  );
  const erreur = (cle: string) => etat.erreurs?.[cle];

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {client && <input type="hidden" name="clientId" value={client.id} />}
      {etat.erreur && !etat.erreurs && (
        <Alerte niveau="critique" titre="Enregistrement refusé">
          {etat.erreur}
        </Alerte>
      )}
      {etat.succes && <Alerte niveau="bon" titre={etat.succes} />}
      <Champ id="client-nom" libelle="Nom ou raison sociale" obligatoire erreur={erreur('nom')}>
        <input
          {...attributsControle('client-nom', undefined, erreur('nom'))}
          name="nom"
          type="text"
          className={CLASSES_CONTROLE}
          defaultValue={client?.nom ?? ''}
          maxLength={120}
          required
        />
      </Champ>
      <Champ
        id="client-contact"
        libelle="Contact"
        aide="Nom, téléphone ou adresse e-mail de l'interlocuteur."
        erreur={erreur('contact')}
      >
        <input
          {...attributsControle('client-contact', 'aide', erreur('contact'))}
          name="contact"
          type="text"
          className={CLASSES_CONTROLE}
          defaultValue={client?.contact ?? ''}
          maxLength={200}
        />
      </Champ>
      <Champ
        id="client-notes"
        libelle="Notes internes"
        aide="Visibles uniquement par les Experts."
        erreur={erreur('notesInternes')}
      >
        <textarea
          {...attributsControle('client-notes', 'aide', erreur('notesInternes'))}
          name="notesInternes"
          className={`${CLASSES_CONTROLE} min-h-28 py-2.5 leading-snug`}
          defaultValue={client?.notesInternes ?? ''}
          maxLength={2000}
          rows={4}
        />
      </Champ>
      <div>
        <Bouton type="submit" disabled={enCours}>
          {enCours ? 'Enregistrement…' : client ? 'Enregistrer' : 'Créer le client'}
        </Bouton>
      </div>
    </form>
  );
}
