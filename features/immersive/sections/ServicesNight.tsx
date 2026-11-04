import { IMMERSIVE_SERVICES } from "@/features/immersive/constants";

/**
 * The first "night" chapter. As it scrolls into view the whole page deepens from paper to plum
 * (see ScrollAtmosphere). For now it is a plain typographic list; in stage 4 this becomes the lattice
 * of connected services.
 */
export function ServicesNight() {
  return (
    <section id="services" data-night className="relative scroll-mt-4 px-5 pb-28 pt-32 sm:px-8 lg:px-12 lg:pt-44">
      <div className="mx-auto max-w-[96rem]">
        <p className="imm-eyebrow !text-[color:var(--gold)]">What we build</p>
        <ol className="imm-service-list">
          {IMMERSIVE_SERVICES.map((name, index) => (
            <li key={name}>
              <span className="num">{String(index + 1).padStart(2, "0")}</span>
              <span className="name">{name}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
