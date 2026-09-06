'use client';

import { useActionState } from 'react';

import { ajouterPreuveAction, type EtatFormulaire } from '@/app/expert/actions';
import { Alerte } from '@/composants/ui/alerte';
import { Bouton } from '@/composants/ui/bouton';
import { Champ, CLASSES_CONTROLE, attributsControle } from '@/composants/ui/champ';

const ETAT_INITIAL: EtatFormulaire = {};

const RUBRIQUES: { valeur: string; libelle: string }[] = [
  { valeur: 'PROJET', libelle: 'Projet et site' },
  { valeur: 'HYPOTHESES', libelle: 'Hypothèses commerciales' },
  { valeur: 'ZONES', libelle: 'Zones de chalandise' },
  { valeur: 'DEMANDE', libelle: 'Demande' },
  { valeur: 'CONCURRENCE', libelle: 'Concurrence' },
  { valeur: 'GAPS', libelle: 'Vides commerciaux' },
  { valeur: 'RISQUES', libelle: 'Risques' },
];

const NIVEAUX: { valeur: string; libelle: string; aide: string }[] = [
  {
    valeur: 'DECLARATIVE',
    libelle: 'Déclarative',
    aide: "Affirmation du promoteur ou d'un tiers, non vérifiée.",
  },
  { valeur: 'OBSERVEE', libelle: 'Observée', aide: "Constat direct sur le terrain par l'Expert." },
  {
    valeur: 'DOCUMENTEE',
    libelle: 'Documentée',
    aide: 'Appuyée par un document : bail, relevé, étude, photo datée.',
  },
  {
    valeur: 'NON_DOCUMENTEE',
    libelle: 'Non documentée',
    aide: 'Aucune source : simple commentaire.',
  },
];

export function FormulairePreuve({ etudeId }: { etudeId: string }) {
  const [etat, action, enCours] = useActionState(ajouterPreuveAction, ETAT_INITIAL);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="hidden" name="etudeId" value={etudeId} />
      {etat.erreur && (
        <div className="sm:col-span-2">
          <Alerte niveau="critique" titre="Preuve refusée">
            {etat.erreur}
          </Alerte>
        </div>
      )}
      {etat.succes && (
        <div className="sm:col-span-2">
          <Alerte niveau="bon" titre={etat.succes} />
        </div>
      )}
      <Champ id="preuve-rubrique" libelle="Rubrique" obligatoire>
        <select
          {...attributsControle('preuve-rubrique')}
          name="rubrique"
          className={CLASSES_CONTROLE}
          defaultValue="HYPOTHESES"
        >
          {RUBRIQUES.map((r) => (
            <option key={r.valeur} value={r.valeur}>
              {r.libelle}
            </option>
          ))}
        </select>
      </Champ>
      <Champ
        id="preuve-niveau"
        libelle="Niveau de preuve"
        obligatoire
        aide={NIVEAUX.map((n) => `${n.libelle} : ${n.aide}`).join(' ')}
      >
        <select
          {...attributsControle('preuve-niveau', 'aide')}
          name="niveau"
          className={CLASSES_CONTROLE}
          defaultValue="OBSERVEE"
        >
          {NIVEAUX.map((n) => (
            <option key={n.valeur} value={n.valeur}>
              {n.libelle}
            </option>
          ))}
        </select>
      </Champ>
      <Champ
        id="preuve-source"
        libelle="Source"
        aide="Document, personne rencontrée, relevé effectué."
      >
        <input
          {...attributsControle('preuve-source', 'aide')}
          name="source"
          type="text"
          className={CLASSES_CONTROLE}
          maxLength={300}
          placeholder="Comptage de passage du 3 septembre, 12 h à 14 h"
        />
      </Champ>
      <Champ id="preuve-date" libelle="Date d'observation">
        <input
          {...attributsControle('preuve-date')}
          name="dateObservation"
          type="date"
          className={CLASSES_CONTROLE}
        />
      </Champ>
      <Champ id="preuve-commentaire" libelle="Commentaire" className="sm:col-span-2">
        <textarea
          {...attributsControle('preuve-commentaire')}
          name="commentaire"
          className={`${CLASSES_CONTROLE} min-h-24 py-2.5 leading-snug`}
          maxLength={2000}
          rows={3}
          placeholder="Ce que la preuve établit, ce qu'elle laisse ouvert."
        />
      </Champ>
      <div className="sm:col-span-2">
        <Bouton type="submit" variante="secondaire" disabled={enCours}>
          {enCours ? 'Enregistrement…' : 'Ajouter la preuve'}
        </Bouton>
      </div>
    </form>
  );
}
