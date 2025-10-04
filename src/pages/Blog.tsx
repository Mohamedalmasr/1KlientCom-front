"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getBlogs, type BlogRow } from "@/lib/api";

export default function Blog() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getBlogs();
        if (!mounted) return;
        setBlogs(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load blogs.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleBlogs = useMemo(() => {
    return [...blogs]
      .filter((b) => b.recSts === "1")
      .sort(
        (a, b) =>
          new Date(b.creaDt).getTime() - new Date(a.creaDt).getTime()
      );
  }, [blogs]);

  return (
    <main
      className="
        relative min-h-screen w-full overflow-hidden
        bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(244,114,182,0.25),transparent_60%),linear-gradient(180deg,rgba(255,255,255,1),rgba(255,255,255,0.92))]
        dark:bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(236,72,153,0.25),transparent_60%),linear-gradient(180deg,#0b1220,#0b1220)]
        text-foreground
      "
    >
      {/* Grid overlay */}
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

      {/* ===== Hero ===== */}
      <section className="relative mx-auto max-w-5xl px-6 pt-24 text-center md:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-black/70 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500" />
          Fresh Insights
        </div>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black sm:text-5xl md:text-6xl dark:text-white">
          Our <span className="text-primary">Blog</span>
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-black/60 sm:text-lg dark:text-white/70">
          Stay ahead with insights, tips, and updates on digital trends.
        </p>

        <div className="pb-10 md:pb-12" />
      </section>

      {/* ===== Posts (عمود واحد كبير) ===== */}
      <section className="pb-16">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-7 px-6 md:max-w-4xl lg:max-w-5xl">
          {/* Loading */}
          {loading && (
            <Card className="border-border bg-card/80 backdrop-blur">
              <CardContent className="p-8">
                <p className="animate-pulse text-muted-foreground">Loading posts…</p>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {!loading && err && (
            <Card className="border-destructive/30 bg-destructive/10 backdrop-blur">
              <CardContent className="p-8 text-destructive">
                {err}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !err && visibleBlogs.length === 0 && (
            <Card className="border-border bg-card/80 backdrop-blur">
              <CardContent className="p-8">
                <p className="text-muted-foreground">No active blogs yet.</p>
              </CardContent>
            </Card>
          )}

          {/* List */}
          {!loading &&
            !err &&
            visibleBlogs.map((blog) => {
              const iso = new Date(blog.creaDt).toISOString().split("T")[0];
              const excerpt =
                blog.blogBody.length > 220
                  ? blog.blogBody.substring(0, 220) + "…"
                  : blog.blogBody;

              return (
                <Card
                  key={blog.blogAID}
                  className="border-border bg-card/80 shadow-sm backdrop-blur"
                >
                  <CardHeader className="pb-0 md:pb-1">
                    <CardTitle className="text-2xl md:text-3xl leading-snug">
                      {blog.blogSubj}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 p-6 md:p-8">
                    <p className="text-sm md:text-base text-muted-foreground">
                      <em>
                        By {blog.creaBy || "Unknown"} on {iso}
                      </em>
                    </p>

                    <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                      {excerpt}
                    </p>

                    {/* لو عندك صفحة تفاصيل لاحقًا: /blog/:id */}
                    <Button
                      asChild
                      variant="secondary"
                      className="mt-2 h-10 px-5 text-base"
                    >
                      <Link to={`/blog/${blog.blogAID}`}>Read More →</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </section>
    </main>
  );
}
