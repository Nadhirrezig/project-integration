// Résultat standard renvoyé par les Server Actions (affiché en toast côté client).
export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
  // Valeurs saisies, renvoyées pour ne pas vider le formulaire en cas d'erreur
  fields?: Record<string, string>;
  // Page à ouvrir après un succès (formulaires sur page entière)
  redirectTo?: string;
};

export const etatInitial: ActionResult = { success: false, message: "" };
