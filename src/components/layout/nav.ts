import {
  BookOpen, CalendarDays, ClipboardList, FileText, GraduationCap, LayoutDashboard,
  Presentation, Settings, UserX, Users, Wallet, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/formations", label: "Formations", icon: GraduationCap },
  { href: "/matieres", label: "Matières", icon: BookOpen },
  { href: "/etudiants", label: "Étudiants", icon: Users },
  { href: "/inscriptions", label: "Inscriptions", icon: ClipboardList },
  { href: "/enseignants", label: "Enseignants", icon: Presentation },
  { href: "/demandes-enseignement", label: "Demandes d'enseignement", icon: FileText },
  { href: "/emploi-du-temps", label: "Emploi du temps", icon: CalendarDays },
  { href: "/absences", label: "Absences", icon: UserX },
  { href: "/paie", label: "Paie", icon: Wallet },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

/** Lien actif : correspondance exacte pour « / », par préfixe pour les autres. */
export function estActif(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titrePage(pathname: string) {
  return NAV_ITEMS.find((item) => estActif(pathname, item.href))?.label ?? "Gestion de Scolarité";
}
