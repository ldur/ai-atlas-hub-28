import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getAliasId } from "@/lib/nickname";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import { Plus, Search, X, Link2, ExternalLink } from "lucide-react";

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
  const [links, setLinks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("tip");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newTags.includes(tag)) setNewTags([...newTags, tag]);
    setTagInput("");
  };

  const fetchItems = async () => {
    const [itemsRes, linksRes] = await Promise.all([
      supabase.from("learning_items").select("*").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("shared_links").select("*").eq("published", true).order("created_at", { ascending: false }),
    ]);
    setItems(itemsRes.data || []);
    setLinks(linksRes.data || []);
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

  const handleSubmitLink = async () => {
    try {
      new URL(linkUrl.trim());
    } catch {
      toast({ title: t("learning.invalid_url"), variant: "destructive" });
      return;
    }
    const aliasId = getAliasId();
    const { error } = await supabase.from("shared_links").insert({
      url: linkUrl.trim(),
      title: linkTitle.trim() || null,
      description: linkDesc.trim() || null,
      published: false,
      submitted_by: aliasId || null,
    });
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("learning.link_submitted"), description: t("learning.link_submitted_desc") });
      setLinkUrl(""); setLinkTitle(""); setLinkDesc(""); setLinkOpen(false);
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content || "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || item.type === typeFilter;
    return matchSearch && matchType;
  });

  const filteredLinks = links.filter((link) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (link.title || "").toLowerCase().includes(q) ||
      (link.description || "").toLowerCase().includes(q) ||
      link.url.toLowerCase().includes(q);
  });

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("learning.title")}</h1>
          <p className="text-muted-foreground">{t("learning.subtitle")}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("common.search")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="content">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="content">{t("learning.tab.content")}</TabsTrigger>
          <TabsTrigger value="links">{t("learning.tab.links")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              <Badge variant={!typeFilter ? "default" : "outline"} className="cursor-pointer" onClick={() => setTypeFilter("")}>{t("common.all")}</Badge>
              {typeKeys.map((k) => (
                <Badge key={k} variant={typeFilter === k ? "default" : "outline"} className="cursor-pointer" onClick={() => setTypeFilter(k)}>{t(typeLabelMap[k] as any)}</Badge>
              ))}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> {t("learning.share_tip")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("learning.share_dialog_title")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder={t("form.name")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={100} />
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newType} onChange={(e) => setNewType(e.target.value)}>
                    {typeKeys.map((k) => <option key={k} value={k}>{t(typeLabelMap[k] as any)}</option>)}
                  </select>
                  <Textarea placeholder={t("learning.content_placeholder")} value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={6} maxLength={5000} />
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder={t("learning.add_tag")} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} maxLength={30} />
                      <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}><Plus className="h-4 w-4" /></Button>
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
                  <Button className="w-full" onClick={handleSubmitTip} disabled={!newTitle.trim() || !newContent.trim()}>{t("common.submit")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filtered.length === 0 && (
            <p className="text-muted-foreground text-center py-12">{t("learning.no_content")}</p>
          )}

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
        </TabsContent>

        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Link2 className="h-4 w-4" /> {t("learning.share_link")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("learning.share_link_dialog")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder={t("learning.link_url_placeholder")} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} maxLength={2000} />
                  <Input placeholder={t("learning.link_title")} value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} maxLength={200} />
                  <Textarea placeholder={t("learning.link_description")} value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} rows={3} maxLength={1000} />
                  <Button className="w-full" onClick={handleSubmitLink} disabled={!linkUrl.trim()}>{t("common.submit")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredLinks.length === 0 && (
            <p className="text-muted-foreground text-center py-12">{t("learning.no_links")}</p>
          )}

          {filteredLinks.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-medium truncate">{link.title || link.url}</h3>
                    </div>
                    {link.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(link.created_at).toLocaleDateString("nb-NO")}</p>
                  </div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;
