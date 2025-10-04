import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBlog, updateBlog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditBlog() {
  const { id } = useParams<{ id: string }>();
  const blogId = Number(id);
  const navigate = useNavigate();

  const [subj, setSubj] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const b = await getBlog(blogId);
        if (!mounted) return;
        setSubj(b.blogSubj ?? "");
        setBody(b.blogBody ?? "");
        setActive(b.recSts === "1");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [blogId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subj.trim() || !body.trim()) {
      alert("Subject and content are required.");
      return;
    }

    setSaving(true);
    try {
      await updateBlog(blogId, {
        blogSubj: subj.trim(),
        blogBody: body.trim(),
        recSts: active ? "1" : "0",
      });
      navigate("/admin/blogs", { replace: true });
    } catch {
      alert("Failed to update blog post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Edit Blog</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subj}
                onChange={(e) => setSubj(e.target.value)}
                required
                className="bg-card text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                required
                className="bg-card text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={active}
                onCheckedChange={(v) => setActive(Boolean(v))}
              />
              <span className="text-sm">Active</span>
            </label>

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
