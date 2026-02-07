"use client";

import { useRouter } from "next/navigation";
import { authClient } from "~/server/better-auth/client";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Bell, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "~/components/dashboard/notification-bell";

interface DashboardHeaderProps {
  user: { name: string; email: string; image?: string | null };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger />

      <div className="flex-1" />

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>
                {user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifikasi
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
