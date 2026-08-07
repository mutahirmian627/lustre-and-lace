"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HERO_BANNER } from "@/constants/site-config";

export function HeroBanner() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-accent">
      {HERO_BANNER.imageUrl && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 20, ease: "linear" }}
        >
          <Image
            src={HERO_BANNER.imageUrl}
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-background/40" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-2xl px-6 text-center"
      >
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">
          {HERO_BANNER.headline}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{HERO_BANNER.subtext}</p>
        <Button
          nativeButton={false}
          render={<Link href={HERO_BANNER.ctaHref} />}
          className="mt-8"
          size="lg"
        >
          {HERO_BANNER.ctaLabel}
        </Button>
      </motion.div>
    </section>
  );
}
