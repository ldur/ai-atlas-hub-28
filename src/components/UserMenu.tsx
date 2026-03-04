import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getNickname, setNickname as saveNickname, getAdminToken, clearAdminToken, setAliasId } from "@/lib/nickname";
import { isAdmin } from "@/lib/adminAction";
import { User, Shield, LogOut, ChevronDown } from "lucide-react";

export function UserMenu() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => {
      setNickname(getNickname());
      setAdmin(isAdmin());
    };
    check();
    // Re-check on storage changes (other tabs) and on focus
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  const handleLogoutAnon = () => {
    localStorage.removeItem("ai-tool-atlas-nickname");
    localStorage.removeItem("ai-tool-atlas-alias-id");
    setNickname(null);
    setAdmin(isAdmin());
    navigate("/");
  };

  const handleLogoutAdmin = () => {
    clearAdminToken();
    setAdmin(false);
  };

  const handleGoAdmin = () => {
    navigate("/admin");
  };

  const label = admin ? "Admin" : nickname || "Ikke innlogget";
  const Icon = admin ? Shield : User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Icon className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {nickname && (
          <DropdownMenuItem disabled className="text-xs opacity-70">
            <User className="h-3.5 w-3.5 mr-2" />
            {nickname}
          </DropdownMenuItem>
        )}
        {admin && (
          <DropdownMenuItem disabled className="text-xs opacity-70">
            <Shield className="h-3.5 w-3.5 mr-2" />
            Admin-modus aktiv
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {!admin && (
          <DropdownMenuItem onClick={handleGoAdmin}>
            <Shield className="h-3.5 w-3.5 mr-2" />
            Logg inn som admin
          </DropdownMenuItem>
        )}
        {admin && (
          <DropdownMenuItem onClick={handleLogoutAdmin}>
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Logg ut av admin
          </DropdownMenuItem>
        )}
        {nickname && (
          <DropdownMenuItem onClick={handleLogoutAnon}>
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Bytt bruker / nullstill
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
