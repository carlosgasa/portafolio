import { Construction } from "lucide-react";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <Construction className="size-8 text-accent" />
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm">Este módulo se construye en la siguiente etapa.</p>
    </div>
  );
}
