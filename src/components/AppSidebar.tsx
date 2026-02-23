import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Home, ClipboardList, BarChart3, CheckSquare, BookOpen, GraduationCap, Lock, Brain } from "lucide-react";
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

const navItems = [
  { title: "Hjem", url: "/", icon: Home },
  { title: "Kartlegging", url: "/kartlegging", icon: ClipboardList },
  { title: "Innsikt", url: "/innsikt", icon: BarChart3 },
  { title: "Anbefalt Stack", url: "/stack", icon: CheckSquare },
  { title: "Katalog", url: "/katalog", icon: BookOpen },
  { title: "Læring", url: "/laering", icon: GraduationCap },
  { title: "Admin", url: "/admin", icon: Lock },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-5">
        {!collapsed && (
          <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight flex items-center gap-2">
            <Brain className="h-5 w-5" /> AI Tool Atlas
          </h1>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
