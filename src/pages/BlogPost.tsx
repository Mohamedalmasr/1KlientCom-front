"use client";

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBlog, type BlogRow } from "@/lib/api";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id || Number.isNaN(Number(id))) {
          throw new Error("Invalid blog id");
        }
        const data = await getBlog(Number(id));
        if (!mounted) return;
        setBlog(data);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load blog.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const iso = blog ? new Date(blog.creaDt).toISOString().split("T")[0] : "";

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

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pt-24 md:pt-28">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-9 rounded-full"
          >
            ← Back
          </Button>

          <Button asChild variant="secondary" className="h-9 rounded-full">
            <Link to="/blog">All Posts</Link>
          </Button>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-black sm:text-4xl md:text-5xl dark:text-white">
          {loading ? "Loading…" : blog?.blogSubj ?? "Post not found"}
        </h1>

        {!loading && blog && (
          <p className="mt-3 text-sm text-black/60 dark:text-white/70">
            <em>
              By {blog.creaBy || "Unknown"} on {iso}
            </em>
          </p>
        )}

        <div className="pb-8 md:pb-10" />
      </section>

      {/* Body */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-6">
          {loading && (
            <Card className="border-border bg-card/80 backdrop-blur">
              <CardContent className="p-8">
                <p className="animate-pulse text-muted-foreground">
                  Loading content…
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && err && (
            <Card className="border-destructive/30 bg-destructive/10 backdrop-blur">
              <CardContent className="p-8 text-destructive">{err}</CardContent>
            </Card>
          )}

          {!loading && !err && !blog && (
            <Card className="border-border bg-card/80 backdrop-blur">
              <CardContent className="p-8">
                <p className="text-muted-foreground">Post not found.</p>
              </CardContent>
            </Card>
          )}

          {!loading && !err && blog && (
            <Card className="border-border bg-card/80 backdrop-blur">
              <CardContent className="prose prose-neutral max-w-none p-6 text-foreground dark:prose-invert">
                <div className="whitespace-pre-line leading-7">
                  {blog.blogBody}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
