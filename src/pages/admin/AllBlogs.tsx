import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogs, deleteBlog, BlogRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

export default function AllBlogs() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getBlogs();
        if (mounted) setBlogs(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onDelete = async (id: number) => {
    const sure = window.confirm("Delete this blog post?");
    if (!sure) return;

    // تفاؤلي: نشيل من الواجهة الأول
    const old = blogs;
    setBlogs((b) => b.filter((x) => x.blogAID !== id));
    try {
      await deleteBlog(id);
    } catch {
      // لو فشل نرجّع القديم
      setBlogs(old);
      alert("Failed to delete. Please try again.");
    }
  };

  const filtered = blogs.filter((b) =>
    [b.blogSubj, b.blogBody, b.creaBy].some((f) =>
      f?.toLowerCase().includes(term.toLowerCase())
    )
  );

  return (
    <div className="p-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-foreground">All Blogs</CardTitle>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/admin/add/blog">
              <Plus className="mr-2 h-4 w-4" />
              Add Blog
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <Input
              placeholder="Search by subject, content, or author..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-card text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-muted-foreground">No blogs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Subject</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Author</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.blogAID} className="border-b border-border">
                      <td className="px-3 py-2">{b.blogAID}</td>
                      <td className="px-3 py-2">{b.blogSubj}</td>
                      <td className="px-3 py-2">
                        {new Date(b.creaDt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">{b.creaBy}</td>
                      <td className="px-3 py-2">
                        {b.recSts === "1" ? "Active" : "Inactive"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8"
                            title="Edit"
                          >
                            <Link to={`/admin/edit/blog/${b.blogAID}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => onDelete(b.blogAID)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
