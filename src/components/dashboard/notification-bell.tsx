"use client";

import { Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import Link from "next/link";

export function NotificationBell() {
  const { data } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const count = data?.count ?? 0;

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/dashboard/notifications">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
