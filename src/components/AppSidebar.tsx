import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Home, ClipboardList, BarChart3, CheckSquare, BookOpen, GraduationCap, Calculator, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";

const navKeys = [
  { key: "nav.home" as const, url: "/", icon: Home },
  { key: "nav.survey" as const, url: "/kartlegging", icon: ClipboardList },
  { key: "nav.insights" as const, url: "/innsikt", icon: BarChart3 },
  { key: "nav.stack" as const, url: "/stack", icon: CheckSquare },
  { key: "nav.catalog" as const, url: "/katalog", icon: BookOpen },
  { key: "nav.learning" as const, url: "/laering", icon: GraduationCap },
  { key: "nav.pricing" as const, url: "/priskalkulator", icon: Calculator },
  { key: "nav.admin" as const, url: "/admin", icon: Lock },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useI18n();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-5">
        {!collapsed && (
          <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight flex items-center gap-2">
            <img src={logo} alt="AI Tool Atlas" className="h-6 w-6 rounded" /> AI Tool Atlas
          </h1>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navKeys.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={t(item.key)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
