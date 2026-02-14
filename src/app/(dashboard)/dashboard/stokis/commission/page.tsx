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
import {
  Banknote,
  TrendingUp,
  KeyRound,
  History,
} from "lucide-react";
import { format } from "date-fns";

export default function StokisCommissionPage() {
  const { data } = api.stokis.getCommissionStats.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Omset & Komisi</h1>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Banknote className="h-4 w-4" /> Total Komisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              Rp{Number(data?.totalCommission ?? 0).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">
              Rate: {Number(data?.commissionRate ?? 0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" /> Total PV Terjual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(data?.totalPVSold ?? 0).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">
              Rp
              {((data?.totalPVSold ?? 0) * 1000).toLocaleString("id-ID")}{" "}
              omset PV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4" /> PIN Terpakai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.totalPINsUsed ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              PIN terjual dan digunakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" /> Total Omset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp
              {(
                (data?.totalPVSold ?? 0) * 1000 +
                (data?.totalPINsUsed ?? 0) * 100000
              ).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Estimasi total omset</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Komisi</CardTitle>
          <CardDescription>
            {data?.commissionHistory?.length ?? 0} transaksi komisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.commissionHistory?.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <Badge className="bg-green-600 text-sm">
                  +Rp{Number(tx.amount).toLocaleString("id-ID")}
                </Badge>
              </div>
            ))}
            {(!data?.commissionHistory ||
              data.commissionHistory.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada riwayat komisi
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PV Sales History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penjualan PV</CardTitle>
          <CardDescription>
            {data?.pvSalesHistory?.length ?? 0} transaksi penjualan PV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.pvSalesHistory?.map((sale: any) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {sale.member?.user?.name ?? "Anggota"} — {Number(sale.pvAmount)} PV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rp{Number(sale.rupiahAmount).toLocaleString("id-ID")} |{" "}
                    {sale.confirmedAt
                      ? format(new Date(sale.confirmedAt), "dd/MM/yyyy HH:mm")
                      : "-"}
                  </p>
                </div>
                <Badge className="bg-blue-600">Terkonfirmasi</Badge>
              </div>
            ))}
            {(!data?.pvSalesHistory ||
              data.pvSalesHistory.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada riwayat penjualan PV
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
