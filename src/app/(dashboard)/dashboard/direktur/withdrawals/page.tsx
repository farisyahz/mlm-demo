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
import { Check, X, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "~/components/ui/input";

export default function DirekturWithdrawalsPage() {
  const utils = api.useUtils();
  const { data: approved } = api.withdrawal.listBendaharaApproved.useQuery({
    limit: 50,
  });

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  const finalApprove = api.withdrawal.direkturApprove.useMutation({
    onSuccess: () => {
      toast.success("Penarikan disetujui dan diproses!");
      utils.withdrawal.listBendaharaApproved.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reject = api.withdrawal.reject.useMutation({
    onSuccess: () => {
      toast.success("Penarikan ditolak");
      utils.withdrawal.listBendaharaApproved.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        <Shield className="mr-2 inline h-6 w-6" />
        Final Approval (Direktur Utama)
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Penarikan Menunggu Approval Final</CardTitle>
          <CardDescription>
            {approved?.length ?? 0} penarikan telah disetujui Bendahara
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approved?.map((w: any) => (
              <div key={w.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      Rp{Number(w.amount).toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {w.member?.user?.name ?? "Unknown"}
                    </p>
                    <p className="text-sm">
                      {w.bankName} - {w.accountNumber} (a/n {w.accountHolder})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diajukan: {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                    {w.bendaharaApprovedAt && (
                      <p className="text-xs text-green-600">
                        Disetujui Bendahara:{" "}
                        {format(new Date(w.bendaharaApprovedAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">Menunggu Direktur</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    onClick={() =>
                      finalApprove.mutate({ withdrawalId: w.id })
                    }
                    disabled={finalApprove.isPending}
                  >
                    {finalApprove.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    Approve & Transfer
                  </Button>
                  <Input
                    placeholder="Alasan penolakan"
                    className="h-9 text-sm"
                    value={rejectReason[w.id] ?? ""}
                    onChange={(e) =>
                      setRejectReason((prev) => ({
                        ...prev,
                        [w.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="destructive"
                    onClick={() =>
                      reject.mutate({
                        withdrawalId: w.id,
                        reason: rejectReason[w.id] ?? "Ditolak oleh Direktur",
                      })
                    }
                    disabled={reject.isPending}
                  >
                    <X className="mr-1 h-4 w-4" /> Tolak
                  </Button>
                </div>
              </div>
            ))}
            {(!approved || approved.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Tidak ada penarikan menunggu approval
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
