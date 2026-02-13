import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getAliasId } from "@/lib/nickname";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Plus, Search } from "lucide-react";

const typeLabels: Record<string, string> = {
  tip: "Tips",
  "show-tell": "Show & Tell",
  "prompt-pack": "Prompt-pakke",
  guideline: "Retningslinje",
  "case-study": "Case Study",
};

const Learning = () => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("tip");
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data } = await supabase
      .from("learning_items")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmitTip = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const aliasId = getAliasId();
    const { error } = await supabase.from("learning_items").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      type: newType,
      published: false,
      submitted_by: aliasId || null,
    });
    if (error) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Innsendt!", description: "Ditt bidrag vil bli gjennomgått av admin." });
      setNewTitle(""); setNewContent(""); setOpen(false);
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content || "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || item.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return <p className="text-muted-foreground">Laster...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Læring</h1>
          <p className="text-muted-foreground">Tips, prompter, retningslinjer og case studies</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Del et tips</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Del ditt tips eller workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Tittel" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={100} />
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Textarea
                placeholder="Innhold (støtter markdown)"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                maxLength={5000}
              />
              <Button className="w-full" onClick={handleSubmitTip} disabled={!newTitle.trim() || !newContent.trim()}>
                Send inn
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Søk..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge
            variant={!typeFilter ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTypeFilter("")}
          >Alle</Badge>
          {Object.entries(typeLabels).map(([k, v]) => (
            <Badge
              key={k}
              variant={typeFilter === k ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter(k)}
            >{v}</Badge>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Ingen innhold ennå.</p>
      )}

      <div className="space-y-4">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <Badge variant="secondary">{typeLabels[item.type] || item.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("nb-NO")}</p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <ReactMarkdown>{item.content || ""}</ReactMarkdown>
              </div>
              {item.tags?.length > 0 && (
                <div className="flex gap-1 mt-3">
                  {item.tags.map((tag: string) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Learning;
