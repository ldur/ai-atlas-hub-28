import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNickname, setNickname, setAliasId, getAliasId, generateNickname } from "@/lib/nickname";
import { supabase } from "@/integrations/supabase/client";
import { Brain, ClipboardList, BarChart3, CheckSquare, BookOpen, GraduationCap, Lock, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const [nickname, setNicknameState] = useState("");
  const [existingNickname, setExistingNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const saved = getNickname();
    if (saved) {
      setExistingNickname(saved);
    } else {
      setNicknameState(generateNickname());
    }
  }, []);

  const handleGenerateNew = () => {
    setNicknameState(generateNickname());
  };

  const handleStart = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_aliases")
        .insert({ nickname: nickname.trim() })
        .select("id")
        .single();
      if (error) throw error;
      setNickname(nickname.trim());
      setAliasId(data.id);
      setExistingNickname(nickname.trim());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (existingNickname) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("index.welcome_back")} <span className="text-primary">{existingNickname}</span>
          </h1>
          <p className="text-muted-foreground text-lg">{t("index.what_today")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink icon={ClipboardList} title={t("nav.survey")} desc={t("index.survey_desc")} to="/kartlegging" />
          <QuickLink icon={BarChart3} title={t("nav.insights")} desc={t("index.insights_desc")} to="/innsikt" />
          <QuickLink icon={CheckSquare} title={t("nav.stack")} desc={t("index.stack_desc")} to="/stack" />
          <QuickLink icon={BookOpen} title={t("nav.catalog")} desc={t("index.catalog_desc")} to="/katalog" />
          <QuickLink icon={GraduationCap} title={t("nav.learning")} desc={t("index.learning_desc")} to="/laering" />
        </div>

        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> {t("index.no_tracking")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Brain className="h-9 w-9" /> AI Tool Atlas
        </h1>
        <p className="text-muted-foreground text-lg">{t("index.share_anonymous")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("index.choose_nickname")}</CardTitle>
          <CardDescription>{t("index.nickname_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={nickname}
              onChange={(e) => setNicknameState(e.target.value)}
              placeholder={t("index.your_nickname")}
              maxLength={30}
            />
            <Button variant="outline" size="icon" onClick={handleGenerateNew} title={t("index.generate_new")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Button className="w-full" onClick={handleStart} disabled={!nickname.trim() || loading}>
            {loading ? t("common.saving") : t("index.get_started")}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1.5">
        <Lock className="h-3.5 w-3.5" /> {t("index.no_tracking_short")}
      </p>
    </div>
  );
};

function QuickLink({ icon: Icon, title, desc, to }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; to: string }) {
  const navigate = useNavigate();
  return (
    <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(to)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Index;
