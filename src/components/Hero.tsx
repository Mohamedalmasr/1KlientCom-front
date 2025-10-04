import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const location = useLocation();
  const navigate = useNavigate();

  const goToServices: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();

    if (location.pathname === "/") {
      const el = document.getElementById("services");
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80; 
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }

    navigate("/", { state: { scrollTo: "services" } });
  };

  return (
    <section
      className="
        relative w-full
        bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(244,114,182,0.25),transparent_60%),linear-gradient(180deg,rgba(255,255,255,1),rgba(255,255,255,0.92))]
        dark:bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(236,72,153,0.25),transparent_60%),linear-gradient(180deg,#0b1220,#0b1220)]
      "
    >
      <div className="pt-20 md:pt-24" />

      <div
        className="
          pointer-events-none absolute inset-0
          [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]
          opacity-50
          [background-image:radial-gradient(currentColor_1px,transparent_1px)]
          [background-size:16px_16px]
          text-black/10 dark:text-white/10
        "
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-black/70 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500" />
          Smart Digital Solutions
        </div>

        {/* Title */}
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black sm:text-5xl md:text-6xl dark:text-white">
          Empowering Your Business with Smart Digital Solutions
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-black/60 sm:text-lg dark:text-white/70">
          From stunning websites to SEO and WordPress expertise, ONEKlient helps
          businesses grow, scale, and succeed online.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="grid w-full max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              asChild
              className="h-10 rounded-full px-6 w-full sm:w-[200px] text-base font-semibold shadow-sm"
            >
              <Link to="/" onClick={goToServices}>
                View Services <span className="ml-1.5">→</span>
              </Link>
            </Button>

            {/* Outline */}
            <Button
              asChild
              variant="outline"
              className="
                h-10 rounded-full px-6
                w-full sm:w-[200px]
                text-base font-semibold
                border-black/20 bg-white hover:bg-white/90 text-black
                dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15
              "
            >
              <Link to="/contact">Get Started Today</Link>
            </Button>
          </div>
        </div>

        <div className="pb-12 md:pb-16" />
      </div>
    </section>
  );
}
