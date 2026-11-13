// Données de démonstration (captures d'écran du rapport — Chapitre 4 : Réalisation)
// Lancer : npx prisma db seed
import { PrismaClient, CodeFormation, EtatDemande } from "@prisma/client";
import bcrypt from "bcryptjs";
import { genererSemaines } from "../src/lib/semaines";

const prisma = new PrismaClient();

// ───────── Utilitaires ─────────

// Générateur pseudo-aléatoire déterministe (même résultat à chaque seed)
let graine = 20262027;
function aleatoire(): number {
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const choisir = <T,>(liste: T[]): T => liste[Math.floor(aleatoire() * liste.length)];

const JOUR_MS = 24 * 60 * 60 * 1000;
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const ajouterJours = (date: Date, n: number) => new Date(date.getTime() + n * JOUR_MS);
const dureeHeures = (debut: string, fin: string) => {
  const [h1, m1] = debut.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
};

// ───────── Référentiel ─────────

const ANNEE = "2026-2027";
const DATE_DEBUT = d("2026-09-14"); // lundi

const ENSEIGNANTS = [
  { nom: "Ben Salah", prenom: "Mohamed", cin: "07845123", adresse: "12 Rue Ibn Khaldoun, Tunis", telephone: "98456123", email: "mohamed.bensalah@gmail.com", specialite: "Génie logiciel",
    cv: "Ingénieur en informatique (ENSI, 2012). 10 ans d'expérience en développement logiciel (C, Java). Formateur certifié depuis 2018.", heures: 300 },
  { nom: "Trabelsi", prenom: "Sonia", cin: "08123456", adresse: "45 Avenue Habib Bourguiba, Ariana", telephone: "22345678", email: "sonia.trabelsi@yahoo.fr", specialite: "Développement web et bases de données",
    cv: "Mastère professionnel en développement web (ISET Charguia). Développeuse full-stack (PHP, JavaScript, PostgreSQL) pendant 6 ans.", heures: 250 },
  { nom: "Jaziri", prenom: "Karim", cin: "06987412", adresse: "8 Rue de Marseille, Sousse", telephone: "55789012", email: "karim.jaziri@gmail.com", specialite: "Systèmes et réseaux",
    cv: "Licence en réseaux informatiques. Certifications CCNA et Linux LPIC-1. Administrateur systèmes et réseaux dans une PME pendant 8 ans.", heures: 280 },
  { nom: "Gharbi", prenom: "Amel", cin: "09456789", adresse: "23 Rue Farhat Hached, Sfax", telephone: "97234567", email: "amel.gharbi@gmail.com", specialite: "Gestion et comptabilité",
    cv: "Maîtrise en sciences comptables (IHEC Carthage). Comptable dans un cabinet d'expertise comptable, 7 ans d'expérience.", heures: 220 },
  { nom: "Mansouri", prenom: "Hela", cin: "10234567", adresse: "3 Rue de Palestine, Tunis", telephone: "24567890", email: "hela.mansouri@outlook.com", specialite: "Langues et communication",
    cv: "Maîtrise d'anglais (FLAH Manouba) et CAPES de français. Enseignante de langues en formation professionnelle depuis 9 ans.", heures: 200 },
  { nom: "Bouazizi", prenom: "Nizar", cin: "07654321", adresse: "17 Avenue de la République, Nabeul", telephone: "50678901", email: "nizar.bouazizi@gmail.com", specialite: "Bureautique",
    cv: "Licence appliquée en informatique de gestion. Certifié Microsoft Office Specialist (Word, Excel). Formateur bureautique depuis 2015.", heures: 260 },
  // Demandes en attente (aucune matière attribuée)
  { nom: "Khelifi", prenom: "Rim", cin: "11345678", adresse: "56 Rue Mongi Slim, Monastir", telephone: "92111222", email: "rim.khelifi@gmail.com", specialite: "Intelligence artificielle",
    cv: "Doctorante en intelligence artificielle (FST). Expérience en Python, apprentissage automatique et analyse de données.", heures: 120 },
  { nom: "Hammami", prenom: "Walid", cin: "09876543", adresse: "9 Rue Ali Belhouane, Bizerte", telephone: "26333444", email: "walid.hammami@gmail.com", specialite: "Cybersécurité",
    cv: "Ingénieur sécurité informatique. Certifié CEH. 5 ans d'expérience en audit de sécurité des systèmes d'information.", heures: 150 },
];

// Matières : [nom, nbHeuresTotal, index enseignant, leçons]
const MATIERES: Record<string, { heures: number; ens: number; lecons: string[] }> = {
  "Algorithmique": { heures: 60, ens: 0, lecons: ["Notions d'algorithme et de variable", "Structures conditionnelles", "Structures itératives", "Tableaux et chaînes", "Procédures et fonctions"] },
  "Programmation C": { heures: 60, ens: 0, lecons: ["Introduction au langage C", "Types, opérateurs et entrées/sorties", "Pointeurs", "Structures et fichiers"] },
  "Programmation orientée objet (Java)": { heures: 60, ens: 0, lecons: ["Classes et objets", "Encapsulation", "Héritage et polymorphisme", "Collections", "Gestion des exceptions"] },
  "Programmation Web": { heures: 75, ens: 1, lecons: ["Structure d'une page HTML", "Mise en forme avec CSS", "Formulaires HTML", "JavaScript : les bases", "Manipulation du DOM"] },
  "Bases de données relationnelles (SQL)": { heures: 60, ens: 1, lecons: ["Modèle entité-association", "Modèle relationnel et normalisation", "Requêtes SQL simples", "Jointures et regroupements"] },
  "Systèmes d'exploitation": { heures: 45, ens: 2, lecons: ["Rôle d'un système d'exploitation", "Gestion des fichiers et dossiers", "Installation de Windows", "Commandes de base Linux"] },
  "Réseaux informatiques": { heures: 45, ens: 2, lecons: ["Notions de base des réseaux", "Modèle OSI et TCP/IP", "Adressage IP", "Câblage et équipements réseau"] },
  "Maintenance informatique": { heures: 45, ens: 2, lecons: ["Composants d'un ordinateur", "Montage et démontage d'un PC", "Diagnostic des pannes", "Sauvegarde et restauration"] },
  "Comptabilité générale": { heures: 45, ens: 3, lecons: ["Principes de la comptabilité", "Le bilan", "Le compte de résultat", "Écritures comptables courantes"] },
  "Gestion d'entreprise": { heures: 30, ens: 3, lecons: ["L'entreprise et son environnement", "Fonctions de l'entreprise", "Notions de marketing"] },
  "Gestion commerciale": { heures: 30, ens: 3, lecons: ["Le cycle de vente", "Documents commerciaux", "Gestion des stocks"] },
  "Français technique": { heures: 30, ens: 4, lecons: ["Rédaction d'un courrier administratif", "Compte rendu et rapport", "Communication écrite professionnelle"] },
  "Anglais technique": { heures: 30, ens: 4, lecons: ["Computer vocabulary", "Reading technical documents", "Writing professional emails", "Job interview"] },
  "Techniques de communication": { heures: 30, ens: 4, lecons: ["Communication verbale et non verbale", "Prise de parole en public", "Travail en équipe"] },
  "Traitement de texte (Word)": { heures: 45, ens: 5, lecons: ["Saisie et mise en forme", "Tableaux et images", "Styles et table des matières", "Publipostage"] },
  "Tableur (Excel)": { heures: 45, ens: 5, lecons: ["Saisie et formules simples", "Fonctions usuelles", "Graphiques", "Tableaux croisés dynamiques", "Mise en page et impression"] },
  "Présentation assistée (PowerPoint)": { heures: 30, ens: 5, lecons: ["Création d'une présentation", "Animations et transitions", "Présenter un diaporama"] },
  "Initiation à l'informatique": { heures: 30, ens: 5, lecons: ["Découverte de l'ordinateur", "Utilisation du clavier et de la souris", "Navigation sur Internet", "Messagerie électronique"] },
};

const FORMATIONS: {
  code: CodeFormation; libelle: string; duree: number; niveau: string; salle: string;
  modules: { nom: string; matieres: string[] }[];
}[] = [
  {
    code: "TSIG", libelle: "Technicien Supérieur en Informatique de Gestion", duree: 36, niveau: "Baccalauréat", salle: "Salle A1",
    modules: [
      { nom: "Programmation", matieres: ["Algorithmique", "Programmation C", "Programmation orientée objet (Java)", "Programmation Web"] },
      { nom: "Bases de données et systèmes", matieres: ["Bases de données relationnelles (SQL)", "Systèmes d'exploitation", "Réseaux informatiques"] },
      { nom: "Gestion et communication", matieres: ["Comptabilité générale", "Gestion d'entreprise", "Français technique", "Anglais technique"] },
    ],
  },
  {
    code: "ATBIG", libelle: "Agent Technique en Bureautique et Informatique de Gestion", duree: 30, niveau: "4ème année secondaire", salle: "Salle B2",
    modules: [
      { nom: "Bureautique", matieres: ["Traitement de texte (Word)", "Tableur (Excel)", "Présentation assistée (PowerPoint)"] },
      { nom: "Informatique de gestion", matieres: ["Bases de données relationnelles (SQL)", "Comptabilité générale", "Gestion commerciale", "Systèmes d'exploitation"] },
      { nom: "Communication professionnelle", matieres: ["Français technique", "Anglais technique", "Techniques de communication"] },
    ],
  },
  {
    code: "CAPI", libelle: "Certificat d'Aptitude Professionnelle en Informatique", duree: 24, niveau: "9ème année de base", salle: "Labo C1",
    modules: [
      { nom: "Initiation et bureautique", matieres: ["Initiation à l'informatique", "Traitement de texte (Word)", "Tableur (Excel)"] },
      { nom: "Maintenance et réseaux", matieres: ["Maintenance informatique", "Réseaux informatiques", "Systèmes d'exploitation", "Algorithmique"] },
    ],
  },
];

// [prenom, nom, nomPere, sexe]
const ETUDIANTS: [string, string, string, "M" | "F"][] = [
  ["Ahmed", "Ben Ali", "Mohamed", "M"], ["Yasmine", "Hamdi", "Lotfi", "F"], ["Oussama", "Chaabane", "Hédi", "M"],
  ["Mariem", "Ayari", "Mounir", "F"], ["Firas", "Dridi", "Slim", "M"], ["Ines", "Belhaj", "Kamel", "F"],
  ["Aymen", "Saidi", "Faouzi", "M"], ["Nour", "Jlassi", "Tarek", "F"], ["Skander", "Mejri", "Riadh", "M"],
  ["Rania", "Zouari", "Habib", "F"], ["Bilel", "Ferchichi", "Ammar", "M"], ["Salma", "Kefi", "Nabil", "F"],
  ["Hamza", "Toumi", "Sami", "M"], ["Eya", "Bouslama", "Fethi", "F"], ["Mehdi", "Khemiri", "Adel", "M"],
  ["Amira", "Sassi", "Moncef", "F"], ["Youssef", "Rezgui", "Chokri", "M"], ["Chaima", "Masmoudi", "Ridha", "F"],
  ["Khalil", "Brahmi", "Mourad", "M"], ["Asma", "Ouni", "Néjib", "F"], ["Wassim", "Hadded", "Jamel", "M"],
  ["Sirine", "Nasri", "Zied", "F"], ["Anis", "Mabrouk", "Hassen", "M"], ["Emna", "Chebbi", "Walid", "F"],
  ["Rami", "Gabsi", "Lassaad", "M"],
];
const VILLES = ["Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Sousse", "Sfax", "Monastir", "Bizerte", "Kairouan", "Gabès", "Béja"];
const RUES = ["Rue de la Liberté", "Avenue Habib Bourguiba", "Rue Ibn Sina", "Rue de Carthage", "Avenue de la République", "Rue Tahar Haddad", "Rue El Jazira", "Rue d'Espagne"];

// Répartition des 25 demandes : formation + état
const REPARTITION: { formation: CodeFormation; etat: EtatDemande; motif?: string }[] = [
  ...Array(7).fill({ formation: "TSIG", etat: "ACCEPTEE" }),
  ...Array(6).fill({ formation: "ATBIG", etat: "ACCEPTEE" }),
  ...Array(5).fill({ formation: "CAPI", etat: "ACCEPTEE" }),
  { formation: "TSIG", etat: "EN_ATTENTE" }, { formation: "TSIG", etat: "EN_ATTENTE" },
  { formation: "ATBIG", etat: "EN_ATTENTE" }, { formation: "CAPI", etat: "EN_ATTENTE" },
  { formation: "TSIG", etat: "REFUSEE", motif: "Niveau insuffisant" },
  { formation: "ATBIG", etat: "REFUSEE", motif: "Dossier incomplet" },
  { formation: "CAPI", etat: "REFUSEE", motif: "Autre : groupe complet pour cette session" },
];

const CRENEAUX = [
  { debut: "08:30", fin: "10:00" },
  { debut: "10:15", fin: "11:45" },
  { debut: "13:00", fin: "14:30" },
];

const OBSERVATIONS = [
  "Bonne participation de la classe.",
  "Exercices à terminer à la maison.",
  "Travaux pratiques réalisés en salle machine.",
  "Quelques difficultés, révision prévue la séance prochaine.",
  "Séance consacrée aux exercices d'application.",
  "Classe attentive, objectifs atteints.",
];

// ───────── Seed ─────────

async function main() {
  // Réinitialisation complète (identifiants remis à 1)
  await prisma.$executeRawUnsafe(`
    TRUNCATE "Paie", "AbsenceEnseignant", "AbsenceEtudiant", "JournalClasse", "Seance",
      "DemandeEnseignement", "DemandeInscription", "Lecon", "ModuleMatiere", "Matiere", "Module",
      "Semaine", "Formation", "Enseignant", "Etudiant", "Utilisateur", "Parametre"
    RESTART IDENTITY CASCADE
  `);

  // Administrateur + paramètres
  await prisma.utilisateur.create({
    data: { login: "admin", motDePasse: await bcrypt.hash("admin123", 10), nom: "Administrateur", role: "ADMIN" },
  });
  const parametre = await prisma.parametre.create({
    data: { id: 1, nomCentre: "Centre de Formation Informatique", tauxHoraire: 15 },
  });

  // Enseignants + demandes d'enseignement (6 acceptées, 2 en attente)
  const enseignants = [];
  for (const [i, e] of ENSEIGNANTS.entries()) {
    const accepte = i < 6;
    enseignants.push(
      await prisma.enseignant.create({
        data: {
          nom: e.nom, prenom: e.prenom, cin: e.cin, adresse: e.adresse, telephone: e.telephone, email: e.email, specialite: e.specialite,
          demandesEnseignement: {
            create: {
              dateDemande: accepte ? d(`2026-07-${String(1 + i * 3).padStart(2, "0")}`) : d(`2026-11-0${3 + i - 6}`),
              cv: e.cv, nbHeuresPropose: e.heures, etat: accepte ? "ACCEPTEE" : "EN_ATTENTE",
            },
          },
        },
      }),
    );
  }

  // Matières (R6a : un seul enseignant) + leçons
  const matieres: Record<string, { id: number; enseignantId: number; lecons: { id: number; titre: string }[] }> = {};
  for (const [nom, m] of Object.entries(MATIERES)) {
    const matiere = await prisma.matiere.create({
      data: {
        nom, nbHeuresTotal: m.heures, enseignantId: enseignants[m.ens].id,
        lecons: { create: m.lecons.map((titre, k) => ({ titre, ordre: k + 1 })) },
      },
      include: { lecons: { orderBy: { ordre: "asc" } } },
    });
    matieres[nom] = { id: matiere.id, enseignantId: enseignants[m.ens].id, lecons: matiere.lecons };
  }

  // Formations + semaines générées (R4/R5) + modules ↔ matières (R7)
  type FormationSeed = (typeof FORMATIONS)[number] & {
    id: number;
    semaines: { id: number; dateDebut: Date }[];
    listeMatieres: string[];
  };
  const formations: FormationSeed[] = [];
  for (const f of FORMATIONS) {
    const formation = await prisma.formation.create({
      data: {
        code: f.code, libelle: f.libelle, annee: ANNEE, dateDebut: DATE_DEBUT, dureeSemaines: f.duree, niveauRequis: f.niveau,
        semaines: { create: genererSemaines(DATE_DEBUT, f.duree) },
        modules: {
          create: f.modules.map((mod) => ({
            nom: mod.nom,
            matieres: { create: mod.matieres.map((nom) => ({ matiereId: matieres[nom].id })) },
          })),
        },
      },
      include: { semaines: { orderBy: { numero: "asc" } } },
    });
    formations.push({ ...f, id: formation.id, semaines: formation.semaines, listeMatieres: f.modules.flatMap((m) => m.matieres) });
  }

  // Étudiants + demandes d'inscription
  const inscrits: Record<CodeFormation, number[]> = { TSIG: [], ATBIG: [], CAPI: [] };
  for (const [i, [prenom, nom, pere, sexe]] of ETUDIANTS.entries()) {
    const rep = REPARTITION[i];
    const formation = formations.find((f) => f.code === rep.formation)!;
    const anneeNaissance = rep.formation === "TSIG" ? 2002 + (i % 5) : rep.formation === "ATBIG" ? 2004 + (i % 4) : 2007 + (i % 3);
    const marie = rep.formation === "TSIG" && i % 6 === 0;
    const etudiant = await prisma.etudiant.create({
      data: {
        matricule: `ETU-2026-${String(i + 1).padStart(4, "0")}`,
        nom, prenom,
        dateNaissance: d(`${anneeNaissance}-${String((i % 12) + 1).padStart(2, "0")}-${String((i * 7) % 27 + 1).padStart(2, "0")}`),
        lieuNaissance: VILLES[i % VILLES.length],
        nationalite: "Tunisienne",
        cin: String(14000000 + i * 37421).padStart(8, "0"),
        adresse: `${(i * 13) % 90 + 1} ${RUES[i % RUES.length]}, ${VILLES[(i + 3) % VILLES.length]}`,
        niveauEtude: rep.etat === "REFUSEE" && rep.motif === "Niveau insuffisant" ? "3ème année secondaire" : formation.niveau,
        telephone: `${choisir(["20", "22", "25", "50", "52", "55", "93", "98"])}${String(100 + ((i * 271) % 900))}${String(100 + ((i * 577) % 900))}`,
        etatCivil: marie ? "Marié(e)" : "Célibataire",
        nomPereOuConjoint: marie && sexe === "F" ? `${pere} (conjoint)` : `${pere} ${nom}`,
        demandesInscription: {
          create: {
            formationId: formation.id,
            dateDemande: rep.etat === "EN_ATTENTE" ? d(`2026-11-${String(2 + i - 18).padStart(2, "0")}`) : d(`2026-0${6 + (i % 3)}-${String(5 + i).padStart(2, "0")}`),
            etat: rep.etat,
            motifRefus: rep.motif ?? null,
          },
        },
      },
    });
    if (rep.etat === "ACCEPTEE") inscrits[rep.formation].push(etudiant.id);
  }

  // Séances des 10 premières semaines (lundi → vendredi, 3 créneaux), jusqu'à la semaine en cours.
  // Le journal de classe n'est rempli que pour les séances antérieures à aujourd'hui.
  // R6b : une matière au plus une fois par jour et par formation ; un enseignant n'est jamais à deux endroits à la fois.
  const curseur: Record<string, number> = {};
  const progression: Record<string, number> = {};
  const seances: { id: number; date: Date; formation: CodeFormation; enseignantId: number; heures: number }[] = [];
  const maintenant = new Date();
  const aujourdHui = new Date(Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()));

  for (let s = 0; s < 10; s++) {
    for (let jour = 0; jour < 5; jour++) {
      const utiliseesAujourdhui: Record<string, Set<string>> = {};
      for (const [c, creneau] of CRENEAUX.entries()) {
        const occupes = new Set<number>();
        // Ordre des formations tourné chaque jour pour une répartition équitable
        const ordre = formations.map((_, k) => formations[(k + jour + c) % formations.length]);
        for (const f of ordre) {
          const semaine = f.semaines[s];
          const date = ajouterJours(semaine.dateDebut, jour);
          utiliseesAujourdhui[f.code] ??= new Set();
          const liste = f.listeMatieres;
          curseur[f.code] ??= 0;
          let choisie: string | undefined;
          for (let essai = 0; essai < liste.length; essai++) {
            const nom = liste[(curseur[f.code] + essai) % liste.length];
            if (!utiliseesAujourdhui[f.code].has(nom) && !occupes.has(matieres[nom].enseignantId)) {
              choisie = nom;
              curseur[f.code] = (curseur[f.code] + essai + 1) % liste.length;
              break;
            }
          }
          if (!choisie) continue; // créneau libre
          const m = matieres[choisie];
          utiliseesAujourdhui[f.code].add(choisie);
          occupes.add(m.enseignantId);

          const passee = date < aujourdHui;
          const cle = `${f.code}-${choisie}`;
          const n = progression[cle] ?? 0;
          progression[cle] = n + 1;
          const lecon = m.lecons[Math.min(Math.floor(n / 2), m.lecons.length - 1)];

          const seance = await prisma.seance.create({
            data: {
              date, heureDebut: creneau.debut, heureFin: creneau.fin, salle: f.salle,
              formationId: f.id, semaineId: semaine.id, matiereId: m.id, enseignantId: m.enseignantId,
              journal: passee
                ? {
                    create: {
                      leconId: lecon.id,
                      contenu: `${lecon.titre} : ${n % 2 === 0 ? "cours théorique et exemples" : "exercices et travaux pratiques"}.`,
                      observation: choisir(OBSERVATIONS),
                    },
                  }
                : undefined,
            },
          });
          seances.push({ id: seance.id, date, formation: f.code, enseignantId: m.enseignantId, heures: dureeHeures(creneau.debut, creneau.fin) });
        }
      }
    }
  }

  // Absences enseignants (3) : 2 en octobre, 1 en septembre
  const absencesEns = [
    { date: "2026-09-24", justifiee: true, motif: "Certificat médical" },
    { date: "2026-10-08", justifiee: true, motif: "Convocation administrative" },
    { date: "2026-10-21", justifiee: false, motif: null },
  ];
  const seancesAbsenceEns = new Set<number>();
  for (const [k, a] of absencesEns.entries()) {
    const candidates = seances.filter((x) => x.date.getTime() === d(a.date).getTime());
    const seance = candidates[k % candidates.length];
    seancesAbsenceEns.add(seance.id);
    await prisma.absenceEnseignant.create({
      data: { seanceId: seance.id, enseignantId: seance.enseignantId, justifiee: a.justifiee, motif: a.motif },
    });
  }

  // Absences étudiants (~20), uniquement sur les séances de leur formation
  const motifsEtudiant = ["Maladie", "Raison familiale", "Rendez-vous administratif", "Problème de transport"];
  const dejaAbsent = new Set<string>();
  let nbAbsences = 0;
  while (nbAbsences < 20) {
    const seance = choisir(seances.filter((x) => x.date < aujourdHui));
    const etudiantId = choisir(inscrits[seance.formation]);
    const cle = `${seance.id}-${etudiantId}`;
    if (dejaAbsent.has(cle)) continue;
    dejaAbsent.add(cle);
    const justifiee = aleatoire() < 0.4;
    await prisma.absenceEtudiant.create({
      data: { seanceId: seance.id, etudiantId, justifiee, motif: justifiee ? choisir(motifsEtudiant) : null },
    });
    nbAbsences++;
  }

  // Paie d'octobre 2026 (R9) : heures assurées × taux horaire, séances d'absence exclues
  const debutOct = d("2026-10-01");
  const debutNov = d("2026-11-01");
  for (const ens of enseignants.slice(0, 6)) {
    const nbHeures = seances
      .filter((x) => x.enseignantId === ens.id && x.date >= debutOct && x.date < debutNov && !seancesAbsenceEns.has(x.id))
      .reduce((total, x) => total + x.heures, 0);
    await prisma.paie.create({
      data: {
        enseignantId: ens.id, mois: 10, annee: 2026, nbHeures, tauxHoraire: parametre.tauxHoraire,
        montant: nbHeures * parametre.tauxHoraire, dateCalcul: d("2026-11-02"),
      },
    });
  }

  console.log(`✔ Seed terminé : ${formations.length} formations, ${Object.keys(matieres).length} matières, ${enseignants.length} enseignants, ${ETUDIANTS.length} étudiants, ${seances.length} séances.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
