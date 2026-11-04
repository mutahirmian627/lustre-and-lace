import "@/features/immersive/styles/immersive.css";

/**
 * Chrome-free shell for the immersive experience. It deliberately does not use the studio's header and
 * footer: this route draws its own navigation. Styles are scoped to .immersive-root.
 */
export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  return <div className="immersive-root min-h-svh">{children}</div>;
}
