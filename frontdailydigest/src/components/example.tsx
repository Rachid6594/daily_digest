import { Button } from "@/ui/button"

export function ExampleComponent() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Exemple de composant</h1>

      <div className="flex gap-2 flex-wrap">
        <Button variant="default">Par défaut</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button variant="outline">Contour</Button>
        <Button variant="ghost">Fantôme</Button>
        <Button variant="destructive">Destructif</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm">Petit</Button>
        <Button size="default">Normal</Button>
        <Button size="lg">Grand</Button>
        <Button size="icon">→</Button>
      </div>
    </div>
  )
}
