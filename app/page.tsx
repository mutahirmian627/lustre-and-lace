import { BRAND } from "@/constants/brand";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="font-heading text-5xl text-foreground">{BRAND.name}</h1>
      <p className="text-lg text-muted-foreground">{BRAND.tagline}</p>
      <p className="mt-6 text-sm text-primary">
        Homepage build lands in Milestone 3 — this confirms fonts and theme.
      </p>
    </main>
  );
}
