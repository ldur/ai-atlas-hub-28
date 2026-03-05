import { useI18n, Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  const toggle = () => setLang(lang === "no" ? "en" : "no");

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-xs gap-1"
      onClick={toggle}
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      {lang === "no" ? "EN" : "NO"}
    </Button>
  );
}
