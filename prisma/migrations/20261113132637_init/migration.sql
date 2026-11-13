-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "CodeFormation" AS ENUM ('TSIG', 'ATBIG', 'CAPI');

-- CreateEnum
CREATE TYPE "EtatDemande" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etudiant" (
    "id" SERIAL NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" DATE NOT NULL,
    "lieuNaissance" TEXT NOT NULL,
    "nationalite" TEXT NOT NULL,
    "cin" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "niveauEtude" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "etatCivil" TEXT NOT NULL,
    "nomPereOuConjoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Etudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enseignant" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "cin" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialite" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" SERIAL NOT NULL,
    "code" "CodeFormation" NOT NULL,
    "libelle" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dureeSemaines" INTEGER NOT NULL,
    "niveauRequis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semaine" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "formationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Semaine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "formationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matiere" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "nbHeuresTotal" INTEGER NOT NULL,
    "enseignantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Matiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleMatiere" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleMatiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecon" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lecon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeInscription" (
    "id" SERIAL NOT NULL,
    "etudiantId" INTEGER NOT NULL,
    "formationId" INTEGER NOT NULL,
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etat" "EtatDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRefus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeInscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeEnseignement" (
    "id" SERIAL NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cv" TEXT NOT NULL,
    "cvFichier" TEXT,
    "nbHeuresPropose" INTEGER NOT NULL,
    "etat" "EtatDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRefus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeEnseignement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT NOT NULL,
    "formationId" INTEGER NOT NULL,
    "semaineId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalClasse" (
    "id" SERIAL NOT NULL,
    "seanceId" INTEGER NOT NULL,
    "leconId" INTEGER,
    "contenu" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalClasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceEtudiant" (
    "id" SERIAL NOT NULL,
    "seanceId" INTEGER NOT NULL,
    "etudiantId" INTEGER NOT NULL,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsenceEtudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceEnseignant" (
    "id" SERIAL NOT NULL,
    "seanceId" INTEGER NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsenceEnseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paie" (
    "id" SERIAL NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "nbHeures" DOUBLE PRECISION NOT NULL,
    "tauxHoraire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateCalcul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parametre" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomCentre" TEXT NOT NULL,
    "tauxHoraire" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parametre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_login_key" ON "Utilisateur"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_matricule_key" ON "Etudiant"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_cin_key" ON "Etudiant"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Enseignant_cin_key" ON "Enseignant"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Formation_code_annee_key" ON "Formation"("code", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "Semaine_formationId_numero_key" ON "Semaine"("formationId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleMatiere_moduleId_matiereId_key" ON "ModuleMatiere"("moduleId", "matiereId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandeInscription_etudiantId_formationId_key" ON "DemandeInscription"("etudiantId", "formationId");

-- CreateIndex
CREATE UNIQUE INDEX "Seance_formationId_matiereId_date_key" ON "Seance"("formationId", "matiereId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "JournalClasse_seanceId_key" ON "JournalClasse"("seanceId");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceEtudiant_seanceId_etudiantId_key" ON "AbsenceEtudiant"("seanceId", "etudiantId");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceEnseignant_seanceId_key" ON "AbsenceEnseignant"("seanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Paie_enseignantId_mois_annee_key" ON "Paie"("enseignantId", "mois", "annee");

-- AddForeignKey
ALTER TABLE "Semaine" ADD CONSTRAINT "Semaine_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleMatiere" ADD CONSTRAINT "ModuleMatiere_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleMatiere" ADD CONSTRAINT "ModuleMatiere_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecon" ADD CONSTRAINT "Lecon_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeInscription" ADD CONSTRAINT "DemandeInscription_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "Etudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeInscription" ADD CONSTRAINT "DemandeInscription_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeEnseignement" ADD CONSTRAINT "DemandeEnseignement_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_semaineId_fkey" FOREIGN KEY ("semaineId") REFERENCES "Semaine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalClasse" ADD CONSTRAINT "JournalClasse_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalClasse" ADD CONSTRAINT "JournalClasse_leconId_fkey" FOREIGN KEY ("leconId") REFERENCES "Lecon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceEtudiant" ADD CONSTRAINT "AbsenceEtudiant_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceEtudiant" ADD CONSTRAINT "AbsenceEtudiant_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "Etudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceEnseignant" ADD CONSTRAINT "AbsenceEnseignant_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceEnseignant" ADD CONSTRAINT "AbsenceEnseignant_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paie" ADD CONSTRAINT "Paie_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
