# Configuration ShadCN + Tailwind CSS

## ✅ Configuration complétée

Le projet est maintenant configuré avec :
- ✅ **Tailwind CSS** - Framework CSS utilitaire
- ✅ **ShadCN/ui** - Composants réutilisables
- ✅ **Class Variance Authority (CVA)** - Gestion des variantes de composants
- ✅ **Aliases de chemin** - Import facile avec `@/`

## 📁 Structure des dossiers

```
src/
├── components/        # Composants métier de l'application
├── ui/               # Composants réutilisables (shadCN)
├── lib/
│   └── utils.ts      # Fonction utilitaire `cn()` pour combiner les classes
├── App.tsx
└── main.tsx
```

## 📝 Guide d'utilisation

### Créer un composant réutilisable dans `src/ui/`

Exemple : `src/ui/card.tsx`
```tsx
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
```

### Utiliser un composant dans `src/components/`

```tsx
import { Button } from "@/ui/button"

export function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Cliquer moi
    </Button>
  )
}
```

### Importer avec alias

```tsx
// ✅ Bon - avec alias
import { Button } from "@/ui/button"
import { MyComponent } from "@/components/my-component"

// ❌ Éviter - chemin relatif
import { Button } from "../../../ui/button"
```

## 🚀 Commandes

```bash
# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser le build
npm run preview

# Linter le code
npm run lint
```

## 📦 Dépendances installées

- `tailwindcss` - Framework CSS
- `postcss` - Processeur CSS
- `autoprefixer` - Préfixes CSS automatiques
- `clsx` - Combinateur de classes
- `tailwind-merge` - Fusion intelligente des classes Tailwind
- `class-variance-authority` - Variantes de composants

## 💡 Conseils

- Les composants dans `ui/` doivent être génériques et réutilisables
- Les composants dans `components/` sont spécifiques à ton application
- Utilise la fonction `cn()` pour combiner les classes Tailwind intelligemment
- Consulte la [documentation shadCN](https://ui.shadcn.com) pour plus de composants
