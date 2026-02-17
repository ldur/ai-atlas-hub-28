import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNickname, setNickname, setAliasId, getAliasId, generateNickname } from "@/lib/nickname";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [nickname, setNicknameState] = useState("");
  const [existingNickname, setExistingNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
            Velkommen tilbake, <span className="text-primary">{existingNickname}</span> 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Hva vil du gjøre i dag?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink icon="📋" title="Kartlegging" desc="Del hvilke AI-verktøy du bruker" to="/kartlegging" />
          <QuickLink icon="📊" title="Innsikt" desc="Se hva organisasjonen bruker" to="/innsikt" />
          <QuickLink icon="✅" title="Anbefalt Stack" desc="Se anbefalte verktøy" to="/stack" />
          <QuickLink icon="📖" title="Katalog" desc="Utforsk verktøykatalogen" to="/katalog" />
          <QuickLink icon="🎓" title="Læring" desc="Tips, prompter og case studies" to="/laering" />
        </div>

        <p className="text-sm text-muted-foreground">
          🔒 Ingen sporing. Ingen innlogging. Helt anonymt.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">🧠 AI Tool Atlas</h1>
        <p className="text-muted-foreground text-lg">
          Del hvilke AI-verktøy du bruker – helt anonymt
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Velg et kallenavn</CardTitle>
          <CardDescription>
            Du trenger ikke logge inn. Velg et kallenavn så vi kan koble svarene dine.
            Ingen personopplysninger lagres.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={nickname}
              onChange={(e) => setNicknameState(e.target.value)}
              placeholder="Ditt kallenavn"
              maxLength={30}
            />
            <Button variant="outline" size="icon" onClick={handleGenerateNew} title="Generer nytt">
              🔄
            </Button>
          </div>
          <Button className="w-full" onClick={handleStart} disabled={!nickname.trim() || loading}>
            {loading ? "Lagrer..." : "Kom i gang"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        🔒 Ingen sporing · Ingen innlogging · Helt anonymt
      </p>
    </div>
  );
};

function QuickLink({ icon, title, desc, to }: { icon: string; title: string; desc: string; to: string }) {
  const navigate = useNavigate();
  return (
    <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(to)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <span className="text-lg leading-none">{icon}</span>
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
