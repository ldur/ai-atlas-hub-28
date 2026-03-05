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
import { useI18n } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import { Plus, Search, X } from "lucide-react";

const typeKeys = ["tip", "show-tell", "prompt-pack", "guideline", "case-study"] as const;
const typeLabelMap: Record<string, string> = {
  tip: "learning.type.tip",
  "show-tell": "learning.type.show-tell",
  "prompt-pack": "learning.type.prompt-pack",
  guideline: "learning.type.guideline",
  "case-study": "learning.type.case-study",
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
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newTags.includes(tag)) setNewTags([...newTags, tag]);
    setTagInput("");
  };

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
      tags: newTags.length > 0 ? newTags : null,
      published: false,
      submitted_by: aliasId || null,
    });
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("learning.submitted"), description: t("learning.submitted_desc") });
      setNewTitle(""); setNewContent(""); setNewTags([]); setOpen(false);
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content || "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || item.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("learning.title")}</h1>
          <p className="text-muted-foreground">{t("learning.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> {t("learning.share_tip")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("learning.share_dialog_title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder={t("form.name")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={100} />
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {typeKeys.map((k) => <option key={k} value={k}>{t(typeLabelMap[k] as any)}</option>)}
              </select>
              <Textarea
                placeholder={t("learning.content_placeholder")}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                maxLength={5000}
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("learning.add_tag")}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    maxLength={30}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newTags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {newTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer gap-1" onClick={() => setNewTags(newTags.filter(t => t !== tag))}>
                        {tag} <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleSubmitTip} disabled={!newTitle.trim() || !newContent.trim()}>
                {t("common.submit")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("common.search")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge
            variant={!typeFilter ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTypeFilter("")}
          >{t("common.all")}</Badge>
          {typeKeys.map((k) => (
            <Badge
              key={k}
              variant={typeFilter === k ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter(k)}
            >{t(typeLabelMap[k] as any)}</Badge>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-12">{t("learning.no_content")}</p>
      )}

      <div className="space-y-4">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <Badge variant="secondary">{t(typeLabelMap[item.type] as any) || item.type}</Badge>
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
