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
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "~/components/ui/input";

export default function BendaharaWithdrawalsPage() {
  const utils = api.useUtils();
  const { data: pending } = api.withdrawal.listPending.useQuery({ limit: 50 });

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  const approve = api.withdrawal.bendaharaApprove.useMutation({
    onSuccess: () => {
      toast.success("Penarikan disetujui!");
      utils.withdrawal.listPending.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reject = api.withdrawal.reject.useMutation({
    onSuccess: () => {
      toast.success("Penarikan ditolak");
      utils.withdrawal.listPending.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Persetujuan Penarikan (Bendahara)</h1>

      <Card>
        <CardHeader>
          <CardTitle>Penarikan Pending</CardTitle>
          <CardDescription>
            {pending?.length ?? 0} penarikan menunggu persetujuan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pending?.map((w: any) => (
              <div key={w.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      Rp{Number(w.amount).toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {w.member?.user?.name ?? "Unknown"} |{" "}
                      {w.bankName} - {w.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a/n {w.accountHolder}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <Badge>Pending</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      approve.mutate({ withdrawalId: w.id })
                    }
                    disabled={approve.isPending}
                  >
                    {approve.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    Setujui
                  </Button>
                  <Input
                    placeholder="Alasan penolakan"
                    className="h-8 text-sm"
                    value={rejectReason[w.id] ?? ""}
                    onChange={(e) =>
                      setRejectReason((prev) => ({
                        ...prev,
                        [w.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      reject.mutate({
                        withdrawalId: w.id,
                        reason: rejectReason[w.id] ?? "Ditolak",
                      })
                    }
                    disabled={reject.isPending}
                  >
                    <X className="mr-1 h-3 w-3" /> Tolak
                  </Button>
                </div>
              </div>
            ))}
            {(!pending || pending.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Tidak ada penarikan pending
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
