"use client";

import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Laptop,
  LayoutTemplate,
  LineChart,
  Megaphone,
  ShieldHalf,
  Cog,
} from "lucide-react";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const st = location.state as { scrollTo?: string } | null;
    if (st?.scrollTo) {
      const el = document.getElementById(st.scrollTo);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        setTimeout(() => {
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 50);
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  return (
    <main
      className="
        relative min-h-screen w-full overflow-hidden
        bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(244,114,182,0.25),transparent_60%),linear-gradient(180deg,rgba(255,255,255,1),rgba(255,255,255,0.92))]
        dark:bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(236,72,153,0.25),transparent_60%),linear-gradient(180deg,#0b1220,#0b1220)]
        text-foreground
      "
    >
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

      {/* HERO */}
      <Hero />

      {/* ===== ABOUT PREVIEW ===== */}
      <section id="about" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-primary">
              Our vision
            </h2>
            <p className="text-muted-foreground">
              At ONEKlient, we provide simple, powerful, and scalable digital
              solutions that drive growth.
            </p>
            <p className="text-muted-foreground">
              Whether launching your first website or scaling an existing brand,
              we combine creativity and technical expertise to make it happen.
            </p>
          </div>

          <div className="md:self-center">
            <img
              src="/image/vision_blue_only_1200w.webp"
              alt="About ONEKlient"
              className="
      mx-auto w-full max-w-[560px]
      object-contain
      md:-translate-y-7 lg:-translate-y-14
    "
            />
          </div>
        </div>
      </section>

      {/* ===== SERVICES HEADER ===== */}
      <header id="services" className="scroll-mt-24">
        <div className="mx-auto max-w-5xl px-6 py-12 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            What We <span className="text-primary">Do</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Web design & development, WordPress, SEO, and growth-focused digital
            solutions.
          </p>
        </div>
      </header>

      {/* ===== SERVICES GRID (Row 1) ===== */}
      <section className="py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          <ServiceCard
            id="service-web"
            icon={<Laptop className="h-6 w-6 text-primary" />}
            title="Web Design & Development"
            desc="Fast, responsive websites with clean UI/UX and optimized performance to convert visitors into customers."
          />
          <ServiceCard
            id="service-wordpress"
            featured
            icon={<LayoutTemplate className="h-6 w-6 text-primary" />}
            title="WordPress Expertise"
            desc="Custom themes & plugins, tailored dashboards, speed optimization, and advanced security — ready to scale."
          />
          <ServiceCard
            id="service-seo"
            icon={<LineChart className="h-6 w-6 text-primary" />}
            title="SEO & Growth"
            desc="Technical SEO, smart content strategies, and clear reports to boost traffic, ranking, and conversions."
          />
        </div>
      </section>

      {/* ===== SERVICES GRID (Row 2) ===== */}
      <section className="py-4">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          <ServiceCard
            id="service-marketing"
            icon={<Megaphone className="h-6 w-6 text-primary" />}
            title="Digital Marketing"
            desc="Paid ads, social campaigns, and data-driven strategies that deliver measurable results."
          />
          <ServiceCard
            id="service-security"
            featured
            icon={<ShieldHalf className="h-6 w-6 text-primary" />}
            title="Performance & Security"
            desc="Core Web Vitals optimization, advanced protection, backups, and monitoring."
          />
          <ServiceCard
            id="service-support"
            icon={<Cog className="h-6 w-6 text-primary" />}
            title="Maintenance & Support"
            desc="Ongoing support, updates, monitoring, and quick fixes for uninterrupted operations."
          />
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to take your project to the next level?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Book a free call and get a short roadmap with clear next steps.
          </p>

          <Button
            asChild
            size="lg"
            className="mt-5 h-12 min-w-[220px] rounded-lg px-6"
          >
            <Link to="/contact#contact-form">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({
  id,
  icon,
  title,
  desc,
  featured,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  featured?: boolean;
}) {
  return (
    <Card
      id={id}
      className={[
        "h-full border-border bg-card shadow-none backdrop-blur-[1px]",
        featured ? "ring-1 ring-primary/20" : "",
      ].join(" ")}
    >
      <CardHeader className="pb-3">
        <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted/50">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
