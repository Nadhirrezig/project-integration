# Gestion de Scolarité — Centre de formation informatique

Student project (projet d'intégration). Admin web app for a training center that offers 3 formations: TSIG, ATBIG, CAPI.
Goal: a working app with clean screens that can be screenshotted for the report (Chapitre 4 : Réalisation).

## Stack (do not change)
- Next.js (App Router) + TypeScript — front AND back in the same app
- Server Actions for mutations, Server Components for reads. No separate API server.
- PostgreSQL (local, via docker-compose) + Prisma ORM
- Tailwind CSS + shadcn/ui (only: button, input, label, select, textarea, table, dialog, badge, card, tabs, sonner)
- Auth: simple custom session — bcryptjs + jose (JWT in httpOnly cookie) + middleware. No NextAuth.
- Validation: zod

## Rules
- KEEP IT SIMPLE. No extra libraries, no over-engineering, no tests unless asked.
- One role only: **Administrateur**. Every page except /login requires a session.
- **All UI text in French** (labels, buttons, messages, errors, dates in `fr-FR`). Code (variables, files) in English or French model names as in the schema.
- Simple, clean UI: white background, one accent color (navy `#1E3A5F`), sidebar + content, tables with search, forms in dialogs or simple pages.
- Every list page: title, "Ajouter" button, search input, table, edit/delete actions, empty state message.
- Show success/error toasts (sonner) after every action.
- Dates: store as DateTime, display `dd/MM/yyyy`.
- Business rules are enforced on the server (inside the Server Action), not only in the form.

## Domain (from the class diagram — keep these names)
Utilisateur, Etudiant, Enseignant, DemandeInscription, DemandeEnseignement, Formation, Semaine, Module, Matiere, Lecon,
Seance, JournalClasse, AbsenceEtudiant, AbsenceEnseignant, Paie, Parametre.
(`Personne` is abstract in UML → its fields are repeated in Etudiant and Enseignant; Prisma has no inheritance.)

## Business rules
- R1/R2: a student submits a DemandeInscription for one formation → état EN_ATTENTE → ACCEPTEE or REFUSEE (motifRefus required when refused: dossier incomplet / niveau insuffisant / autre).
- R4/R5: when a Formation is created, its period is split automatically into Semaines (dateDebut/dateFin) from dateDebut + dureeSemaines.
- R6a: a Matiere is taught by ONE Enseignant only.
- R6b: a Matiere is scheduled at most ONCE PER DAY for the same formation.
- R7: a Matiere can belong to several formations (Module ↔ Matiere is many-to-many).
- R8: a teacher submits a DemandeEnseignement (CV + nbHeures proposé) → accepted/refused by the admin.
- R9: Paie = heures assurées dans le mois × tauxHoraire (fixed by the centre in Parametre, same for all matières). Séances where the teacher was absent are NOT counted.

## Commands
- `docker compose up -d` — start Postgres
- `npx prisma migrate dev` — migrate
- `npx prisma db seed` — seed demo data
- `npm run dev` — run
