import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  { title: "Hjem", url: "/", icon: "🏠" },
  { title: "Kartlegging", url: "/kartlegging", icon: "📋" },
  { title: "Innsikt", url: "/innsikt", icon: "📊" },
  { title: "Anbefalt Stack", url: "/stack", icon: "✅" },
  { title: "Katalog", url: "/katalog", icon: "📖" },
  { title: "Læring", url: "/laering", icon: "🎓" },
  { title: "Admin", url: "/admin", icon: "🔒" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-5">
        {!collapsed && (
          <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">
            🧠 AI Tool Atlas
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
                      <span className="text-base leading-none">{item.icon}</span>
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
