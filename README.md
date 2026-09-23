# AMC — Frontend professionnel

Refonte UI/UX en HTML, CSS et JavaScript vanilla.

## Améliorations
- Design system unique et cohérent
- Navigation responsive
- Icônes Lucide au lieu d'emojis / caractères décoratifs
- Mode clair/sombre
- Filtres de formations
- Modales et galerie avec navigation clavier
- Validation du formulaire
- `prefers-reduced-motion`
- Structure HTML sémantique et accessible
- Responsive mobile/tablette/desktop
- Code nettoyé et sans anciens overrides CSS contradictoires

## Lancer
Copier `.env.example` vers `.env`, renseigner l’URL Supabase et la clé publishable,
puis lancer `npm run dev`. Le projet utilise Vite pour injecter uniquement les
variables publiques `VITE_*` dans le navigateur.

## Supabase
Le formulaire de contact et le formulaire d’adhésion utilisent directement l’API
REST Supabase avec la clé publishable. Exécuter `supabase.sql` dans le SQL Editor
Supabase pour créer `contact_messages` et `members`, activer RLS et autoriser
uniquement les insertions publiques de demandes d’adhésion.

La table `members` ne possède aucune policy publique de lecture, modification ou
suppression. Une future page « Administration → Membres » devra ajouter une
authentification et des policies réservées aux utilisateurs administrateurs.

Ne jamais placer une clé `service_role` dans `.env` utilisé par Vite ou dans le
frontend.

## Mise en production
Construire avec `npm run build`, puis publier le dossier `dist` avec les mêmes
variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. La validation
frontend améliore l’expérience, tandis que les contraintes SQL et RLS protègent
la table côté Supabase.
