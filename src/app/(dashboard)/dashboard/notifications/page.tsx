"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Bell, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const typeIcons: Record<string, string> = {
  withdrawal_request: "💰",
  withdrawal_approved: "✅",
  withdrawal_rejected: "❌",
  withdrawal_completed: "🎉",
  bonus_received: "🎁",
  rank_up: "⭐",
  system: "ℹ️",
  referral_joined: "👥",
};

export default function NotificationsPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.notification.list.useQuery({ limit: 50 });

  const markRead = api.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const markAllRead = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("Semua notifikasi ditandai sudah dibaca");
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Tandai Semua Dibaca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi ({data?.total ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${!n.isRead ? "bg-blue-50/50 border-blue-200" : ""}`}
              >
                <span className="text-xl">
                  {typeIcons[n.type] ?? "📢"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.isRead && (
                      <Badge variant="default" className="text-[10px]">
                        Baru
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markRead.mutate({ id: n.id })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {(!data?.notifications || data.notifications.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada notifikasi
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
