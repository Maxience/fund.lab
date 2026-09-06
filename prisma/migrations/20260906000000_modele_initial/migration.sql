-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('EXPERT');

-- CreateEnum
CREATE TYPE "EtatCompte" AS ENUM ('ACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutEtude" AS ENUM ('BROUILLON', 'COMPLETE', 'ARCHIVEE');

-- CreateEnum
CREATE TYPE "TypeScenario" AS ENUM ('REFERENCE', 'VARIANTE');

-- CreateEnum
CREATE TYPE "OrigineEtude" AS ENUM ('PME', 'EXPERT');

-- CreateEnum
CREATE TYPE "ModeDeplacement" AS ENUM ('A_PIED', 'DEUX_ROUES', 'VOITURE', 'TRANSPORT_COMMUN');

-- CreateEnum
CREATE TYPE "RelationConcurrentielle" AS ENUM ('DIRECTE', 'INDIRECTE');

-- CreateEnum
CREATE TYPE "StatutMarche" AS ENUM ('ABSENT', 'MAL_SERVI', 'CORRECT');

-- CreateEnum
CREATE TYPE "NiveauPreuve" AS ENUM ('NON_DOCUMENTEE', 'DECLARATIVE', 'OBSERVEE', 'DOCUMENTEE');

-- CreateEnum
CREATE TYPE "Rubrique" AS ENUM ('PROJET', 'HYPOTHESES', 'ZONES', 'DEMANDE', 'CONCURRENCE', 'GAPS', 'RISQUES', 'SYNTHESE');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('GO', 'GO_SOUS_CONDITIONS', 'NO_GO');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "motDePasseHache" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'EXPERT',
    "etat" "EtatCompte" NOT NULL DEFAULT 'ACTIF',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "jetonHache" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniereActiviteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "contact" TEXT,
    "notesInternes" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudes" (
    "id" TEXT NOT NULL,
    "origine" "OrigineEtude" NOT NULL DEFAULT 'EXPERT',
    "jetonPme" TEXT,
    "statut" "StatutEtude" NOT NULL DEFAULT 'BROUILLON',
    "typeScenario" "TypeScenario" NOT NULL DEFAULT 'REFERENCE',
    "libelleScenario" TEXT,
    "etudeSourceId" TEXT,
    "clientId" TEXT,
    "proprietaireId" TEXT,
    "nomProjet" TEXT NOT NULL DEFAULT '',
    "localite" TEXT NOT NULL DEFAULT '',
    "concept" TEXT NOT NULL DEFAULT '',
    "horaires" TEXT,
    "capaciteCouverts" INTEGER,
    "modesService" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientsParJour" DOUBLE PRECISION,
    "ticketMoyenFcfa" DOUBLE PRECISION,
    "joursOuvertureParMois" INTEGER,
    "partLoyerCible" DOUBLE PRECISION,
    "loyerMensuelEnvisageFcfa" DOUBLE PRECISION,
    "clienteleCible" TEXT,
    "etapeAtteinte" INTEGER NOT NULL DEFAULT 1,
    "versionMethodologie" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,
    "finaliseeLe" TIMESTAMP(3),
    "archiveeLe" TIMESTAMP(3),

    CONSTRAINT "etudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "etudeId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "rayonKm" DOUBLE PRECISION,
    "tempsAccesMin" DOUBLE PRECISION,
    "mode" "ModeDeplacement",
    "poids" DOUBLE PRECISION,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations_demande" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "driverCode" TEXT NOT NULL,
    "note" INTEGER,
    "nonApplicable" BOOLEAN NOT NULL DEFAULT false,
    "commentaire" TEXT,

    CONSTRAINT "evaluations_demande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concurrents" (
    "id" TEXT NOT NULL,
    "etudeId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "typeOffre" TEXT NOT NULL,
    "relation" "RelationConcurrentielle",
    "ticketMoyenFcfa" DOUBLE PRECISION,
    "proximite" INTEGER,
    "affluence" INTEGER,
    "qualite" INTEGER,
    "vitesse" INTEGER,
    "differenciation" INTEGER,
    "composantesNonApplicables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observation" TEXT,

    CONSTRAINT "concurrents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gaps" (
    "id" TEXT NOT NULL,
    "etudeId" TEXT NOT NULL,
    "besoinCode" TEXT NOT NULL,
    "statutMarche" "StatutMarche",
    "importance" INTEGER,
    "nonApplicable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risques" (
    "id" TEXT NOT NULL,
    "etudeId" TEXT NOT NULL,
    "risqueCode" TEXT NOT NULL,
    "note" INTEGER,
    "nonApplicable" BOOLEAN NOT NULL DEFAULT false,
    "commentaire" TEXT,
    "mesure" TEXT,
    "responsable" TEXT,

    CONSTRAINT "risques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preuves" (
    "id" TEXT NOT NULL,
    "etudeId" TEXT NOT NULL,
    "rubrique" "Rubrique" NOT NULL,
    "niveau" "NiveauPreuve" NOT NULL DEFAULT 'NON_DOCUMENTEE',
    "source" TEXT,
    "commentaire" TEXT,
    "dateObservation" TIMESTAMP(3),
    "auteurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preuves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultats" (
    "id" TEXT NOT NULL,
    "etudeId" TEXT NOT NULL,
    "versionMoteur" TEXT NOT NULL,
    "versionMethodologie" TEXT NOT NULL,
    "calculeLe" TIMESTAMP(3) NOT NULL,
    "scoreGlobal" DOUBLE PRECISION,
    "attractivite" DOUBLE PRECISION,
    "demandeGlobale" DOUBLE PRECISION,
    "pressionConcurrentielle" DOUBLE PRECISION,
    "scoreGaps" DOUBLE PRECISION,
    "scoreRisque" DOUBLE PRECISION,
    "orientationCalculee" "Orientation",
    "orientationFinale" "Orientation",
    "conditionsCritiques" BOOLEAN NOT NULL DEFAULT false,
    "finalisable" BOOLEAN NOT NULL DEFAULT false,
    "fige" BOOLEAN NOT NULL DEFAULT false,
    "detail" JSONB NOT NULL,
    "parametres" JSONB NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jetonHache_key" ON "sessions"("jetonHache");

-- CreateIndex
CREATE INDEX "sessions_utilisateurId_idx" ON "sessions"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "etudes_jetonPme_key" ON "etudes"("jetonPme");

-- CreateIndex
CREATE INDEX "etudes_clientId_idx" ON "etudes"("clientId");

-- CreateIndex
CREATE INDEX "etudes_proprietaireId_idx" ON "etudes"("proprietaireId");

-- CreateIndex
CREATE INDEX "etudes_statut_misAJourLe_idx" ON "etudes"("statut", "misAJourLe");

-- CreateIndex
CREATE UNIQUE INDEX "zones_etudeId_cle_key" ON "zones"("etudeId", "cle");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_demande_zoneId_driverCode_key" ON "evaluations_demande"("zoneId", "driverCode");

-- CreateIndex
CREATE UNIQUE INDEX "concurrents_etudeId_cle_key" ON "concurrents"("etudeId", "cle");

-- CreateIndex
CREATE UNIQUE INDEX "gaps_etudeId_besoinCode_key" ON "gaps"("etudeId", "besoinCode");

-- CreateIndex
CREATE UNIQUE INDEX "risques_etudeId_risqueCode_key" ON "risques"("etudeId", "risqueCode");

-- CreateIndex
CREATE INDEX "preuves_etudeId_rubrique_idx" ON "preuves"("etudeId", "rubrique");

-- CreateIndex
CREATE INDEX "resultats_etudeId_creeLe_idx" ON "resultats"("etudeId", "creeLe");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudes" ADD CONSTRAINT "etudes_etudeSourceId_fkey" FOREIGN KEY ("etudeSourceId") REFERENCES "etudes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudes" ADD CONSTRAINT "etudes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudes" ADD CONSTRAINT "etudes_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_etudeId_fkey" FOREIGN KEY ("etudeId") REFERENCES "etudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations_demande" ADD CONSTRAINT "evaluations_demande_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concurrents" ADD CONSTRAINT "concurrents_etudeId_fkey" FOREIGN KEY ("etudeId") REFERENCES "etudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gaps" ADD CONSTRAINT "gaps_etudeId_fkey" FOREIGN KEY ("etudeId") REFERENCES "etudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risques" ADD CONSTRAINT "risques_etudeId_fkey" FOREIGN KEY ("etudeId") REFERENCES "etudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preuves" ADD CONSTRAINT "preuves_etudeId_fkey" FOREIGN KEY ("etudeId") REFERENCES "etudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preuves" ADD CONSTRAINT "preuves_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats" ADD CONSTRAINT "resultats_etudeId_fkey" FOREIGN KEY ("etudeId") REFERENCES "etudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

