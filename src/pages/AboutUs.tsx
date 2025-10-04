// src/pages/About.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Handshake, Lightbulb, LineChart } from "lucide-react";

export default function AboutUs() {
  return (
    <main
      className="
        relative min-h-screen w-full overflow-hidden
        bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(244,114,182,0.25),transparent_60%),linear-gradient(180deg,rgba(255,255,255,1),rgba(255,255,255,0.92))]
        dark:bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(236,72,153,0.25),transparent_60%),linear-gradient(180deg,#0b1220,#0b1220)]
        text-foreground
      "
    >
      {/* شبكة نقط خفيفة فوق الخلفية */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-0
          [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]
          opacity-50
          [background-image:radial-gradient(currentColor_1px,transparent_1px)]
          [background-size:16px_16px]
          text-black/10 dark:text-white/10
        "
      />

      {/* ====== HERO ====== */}
      <section id="about-top" className="relative z-10 px-6 pt-20 md:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-black/70 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500" />
            Who We Are
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            About <span className="text-primary">Us</span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            ONEKlient is built on the idea of partnership. We don’t just deliver
            services—we build relationships. Our team is made up of digital
            strategists, designers, and developers passionate about helping
            businesses succeed.
          </p>

          <div className="pb-8 md:pb-12" />
        </div>
      </section>

      {/* ====== VALUES GRID (الكروت الصغيرة تحت الهيرو) ====== */}
      <section id="about-values" className="relative z-10 pb-16">
        <div className="mx-auto grid max-w-5xl gap-5 px-6 md:grid-cols-3">
          <ValueCard
            icon={<Handshake className="h-6 w-6 text-primary" />}
            title="Collaboration"
            desc="Working closely with clients to understand their unique goals."
          />
          <ValueCard
            icon={<Lightbulb className="h-6 w-6 text-primary" />}
            title="Innovation"
            desc="Creative, efficient, and future-ready solutions."
          />
          <ValueCard
            icon={<LineChart className="h-6 w-6 text-primary" />}
            title="Results"
            desc="Success measured by the impact we create for your business."
          />
        </div>
      </section>

    </main>
  );
}

function ValueCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="h-full border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted/50">
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
