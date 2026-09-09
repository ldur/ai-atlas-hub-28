import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RequestEvaluation } from "@/components/RequestEvaluation";
import { getNickname } from "@/lib/nickname";
import { isAdmin } from "@/lib/adminAction";

export function Layout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => setLoggedIn(Boolean(getNickname()) || isAdmin());
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {loggedIn && <AppSidebar />}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card shrink-0">
            {loggedIn ? <SidebarTrigger /> : <div />}
            <div className="flex items-center gap-1">
              <RequestEvaluation />
              <LanguageSwitcher />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
