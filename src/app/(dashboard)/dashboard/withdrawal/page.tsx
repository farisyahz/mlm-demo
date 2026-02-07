"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  bendahara_approved: { label: "Disetujui Bendahara", variant: "outline" },
  direktur_approved: { label: "Disetujui Direktur", variant: "outline" },
  processing: { label: "Diproses", variant: "default" },
  completed: { label: "Selesai", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

export default function WithdrawalPage() {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const utils = api.useUtils();
  const { data: wallet } = api.wallet.getMyWallet.useQuery();
  const { data: withdrawals } = api.withdrawal.getMyWithdrawals.useQuery({
    limit: 20,
  });

  const requestWithdrawal = api.withdrawal.request.useMutation({
    onSuccess: () => {
      toast.success("Permintaan penarikan berhasil dikirim!");
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
      utils.withdrawal.getMyWithdrawals.invalidate();
      utils.wallet.getMyWallet.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestWithdrawal.mutate({
      amount: Number(amount),
      bankName,
      accountNumber,
      accountHolder,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Penarikan Dana</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ajukan Penarikan</CardTitle>
            <CardDescription>
              Saldo tersedia: Rp
              {Number(wallet?.mainBalance ?? 0).toLocaleString("id-ID")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10000"
                  placeholder="Minimal Rp10.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Nama Bank</Label>
                <Input
                  id="bank"
                  placeholder="BCA, BRI, BNI, Mandiri..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accNumber">No. Rekening</Label>
                <Input
                  id="accNumber"
                  placeholder="Nomor rekening"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accHolder">Nama Pemilik Rekening</Label>
                <Input
                  id="accHolder"
                  placeholder="Nama sesuai buku rekening"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={requestWithdrawal.isPending}
              >
                {requestWithdrawal.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ajukan Penarikan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penarikan</CardTitle>
            <CardDescription>
              {withdrawals?.total ?? 0} penarikan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals?.withdrawals.map((w) => {
                const status = statusLabels[w.status] ?? { label: w.status, variant: "outline" as const };
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        Rp{Number(w.amount).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {w.bankName} - {w.accountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                );
              })}
              {(!withdrawals?.withdrawals ||
                withdrawals.withdrawals.length === 0) && (
                <p className="py-8 text-center text-muted-foreground">
                  Belum ada penarikan
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
