"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  LayoutDashboard,
  Network,
  Wallet,
  Gift,
  ShoppingBag,
  Store,
  Bell,
  Users,
  Settings,
  BarChart3,
  Shield,
  CreditCard,
  Package,
  FileText,
  Coins,
  ArrowDownToLine,
  Building2,
  KeyRound,
  Banknote,
} from "lucide-react";

interface AppSidebarProps {
  user: { name: string; email: string; image?: string | null };
  role: string;
  rank: string;
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getNavItems(role: string): { label: string; items: NavItem[] }[] {
  const memberNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Jaringan", href: "/dashboard/network", icon: Network },
    { title: "Dompet", href: "/dashboard/wallet", icon: Wallet },
    { title: "Bonus", href: "/dashboard/bonus", icon: Gift },
    { title: "SERACOIN", href: "/dashboard/coins", icon: Coins },
    { title: "Penarikan", href: "/dashboard/withdrawal", icon: ArrowDownToLine },
    { title: "Belanja", href: "/dashboard/shop", icon: ShoppingBag },
    { title: "Notifikasi", href: "/dashboard/notifications", icon: Bell },
  ];

  const warungNav: NavItem[] = [
    { title: "Toko Saya", href: "/dashboard/my-shop", icon: Store },
    { title: "Produk", href: "/dashboard/products", icon: Package },
  ];

  const stokisNav: NavItem[] = [
    { title: "Dashboard Stokis", href: "/dashboard/stokis", icon: Building2 },
    { title: "Stok PIN", href: "/dashboard/stokis/pins", icon: KeyRound },
    { title: "Omset & Komisi", href: "/dashboard/stokis/commission", icon: Banknote },
  ];

  const bendaharaNav: NavItem[] = [
    {
      title: "Penarikan Tertunda",
      href: "/dashboard/bendahara/withdrawals",
      icon: CreditCard,
    },
  ];

  const direkturNav: NavItem[] = [
    {
      title: "Persetujuan Penarikan",
      href: "/dashboard/direktur/withdrawals",
      icon: Shield,
    },
  ];

  const adminNav: NavItem[] = [
    { title: "Dashboard Admin", href: "/dashboard/admin", icon: BarChart3 },
    { title: "Kelola Anggota", href: "/dashboard/admin/members", icon: Users },
    { title: "Kelola Produk", href: "/dashboard/admin/products", icon: Package },
    { title: "Kelola PIN", href: "/dashboard/admin/pins", icon: KeyRound },
    { title: "Kelola Stokis", href: "/dashboard/admin/stokis", icon: Building2 },
    { title: "Omset Nasional", href: "/dashboard/admin/turnover", icon: BarChart3 },
    { title: "Log Audit", href: "/dashboard/admin/audit", icon: FileText },
    { title: "Pengaturan", href: "/dashboard/admin/settings", icon: Settings },
  ];

  const nav: { label: string; items: NavItem[] }[] = [
    { label: "Menu Utama", items: memberNav },
    { label: "Warung", items: warungNav },
  ];

  if (role === "stokis" || role === "admin") {
    nav.push({ label: "Stokis", items: stokisNav });
  }

  if (role === "bendahara" || role === "admin" || role === "direktur") {
    nav.push({ label: "Bendahara", items: bendaharaNav });
  }

  if (role === "direktur" || role === "admin") {
    nav.push({ label: "Direktur", items: direkturNav });
  }

  if (role === "admin") {
    nav.push({ label: "Admin", items: adminNav });
  }

  return nav;
}

const rankColors: Record<string, string> = {
  none: "bg-gray-200 text-gray-700",
  sapphire: "bg-blue-500 text-white",
  emerald: "bg-emerald-500 text-white",
  bronze: "bg-amber-700 text-white",
  silver: "bg-gray-400 text-white",
  gold: "bg-yellow-500 text-white",
  diamond: "bg-cyan-400 text-white",
  crown: "bg-purple-600 text-white",
};

export function AppSidebar({ user, role, rank }: AppSidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavItems(role);

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            SC
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Seramart Coin</span>
            <span className="text-xs text-muted-foreground">
              Multi Level Konsumen
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] capitalize">
                {role}
              </Badge>
              {rank !== "none" && (
                <Badge className={`text-[10px] capitalize ${rankColors[rank]}`}>
                  {rank}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
