import { DM_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";
import "@/features/immersive/styles/immersive.css";

// The experiment's three typefaces. Loaded here, in this route group's layout only, so the live site pays
// nothing for them. Serif for expression, sans for reading, mono for small technical labels.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--imm-serif",
  display: "swap",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--imm-sans",
  display: "swap",
});
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--imm-mono",
  display: "swap",
  preload: false,
});

/**
 * Chrome-free shell for the immersive experience. It deliberately does not use the studio's header and
 * footer: this route draws its own navigation. Styles are scoped to .immersive-root.
 * `data-phase` starts as "opening" so the opening text is readable before any script has run.
 */
export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`immersive-root min-h-svh ${serif.variable} ${sans.variable} ${mono.variable}`}
      data-phase="opening"
    >
      {children}
    </div>
  );
}
