"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export default function AdminAuditPage() {
  const { data: logs } = api.admin.getAuditLog.useQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Log Aktivitas
          </CardTitle>
          <CardDescription>
            Catatan semua aktivitas penting di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs?.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {log.action}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {log.entity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(log as any).user?.name ?? "System"} |{" "}
                    {log.ipAddress ?? "N/A"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada aktivitas tercatat
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
