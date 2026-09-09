import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setNickname, setAliasId, generateNickname } from "@/lib/nickname";
import { supabase } from "@/integrations/supabase/client";
import { Lock, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function NicknameGate({ onDone }: { onDone: () => void }) {
  const [nickname, setNicknameState] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setNicknameState(generateNickname());
  }, []);

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
      onDone();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 space-y-6">
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
            <Button variant="outline" size="icon" onClick={() => setNicknameState(generateNickname())} title={t("index.generate_new")}>
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
}
