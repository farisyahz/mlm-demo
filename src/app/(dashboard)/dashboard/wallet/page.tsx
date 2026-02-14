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
import { Skeleton } from "~/components/ui/skeleton";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { format } from "date-fns";

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } =
    api.wallet.getMyWallet.useQuery();
  const { data: txData, isLoading: txLoading } =
    api.wallet.getTransactions.useQuery({ limit: 20 });

  if (walletLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dompet</h1>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-100">
              <Wallet className="h-4 w-4" /> Saldo Utama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Rp{Number(wallet?.mainBalance ?? 0).toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SERACOIN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(wallet?.coinBalance ?? 0).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Koin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stok PV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(wallet?.pvStockBalance ?? 0).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Dibekukan: Rp{Number(wallet?.frozenBalance ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            {txData?.total ?? 0} transaksi ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {txData?.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        Number(tx.amount) >= 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {Number(tx.amount) >= 0 ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${Number(tx.amount) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {Number(tx.amount) >= 0 ? "+" : ""}
                      Rp{Math.abs(Number(tx.amount)).toLocaleString("id-ID")}
                    </p>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {tx.type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!txData?.transactions || txData.transactions.length === 0) && (
                <p className="py-8 text-center text-muted-foreground">
                  Belum ada transaksi
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
