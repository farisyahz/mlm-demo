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
  Layers,
} from "lucide-react";
import { format } from "date-fns";

export default function StokisCommissionPage() {
  const { data } = api.stokis.getCommissionStats.useQuery();

  const tb = data?.tierBreakdown;

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
            {data?.currentTier && (
              <Badge variant="outline" className="mt-1 text-xs">
                {data.currentTier.label}
              </Badge>
            )}
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
              {((data?.totalPVSold ?? 0) * 1000).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">
              Total omset dari penjualan PV
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Rincian Komisi per Tier
          </CardTitle>
          <CardDescription>
            Komisi bertingkat berdasarkan total PV terjual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Tier 1 */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">Tier 1</Badge>
                    <span className="text-sm font-medium">
                      0 - 100 PV: 4%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PV di tier ini: {tb?.tier1PV ?? 0} / 100
                  </p>
                  <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all"
                      style={{
                        width: `${Math.min(((tb?.tier1PV ?? 0) / 100) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-lg font-bold text-green-600">
                  Rp{(tb?.tier1Commission ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">Tier 2</Badge>
                    <span className="text-sm font-medium">
                      101 - 300 PV: 2%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PV di tier ini: {tb?.tier2PV ?? 0} / 200
                  </p>
                  <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${Math.min(((tb?.tier2PV ?? 0) / 200) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  Rp{(tb?.tier2Commission ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600">Tier 3</Badge>
                    <span className="text-sm font-medium">
                      301+ PV: 1%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PV di tier ini: {tb?.tier3PV ?? 0} (tanpa batas)
                  </p>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  Rp{(tb?.tier3Commission ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total Komisi dari Semua Tier</p>
                <p className="text-xl font-bold text-primary">
                  Rp{(tb?.totalCommission ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {sale.member?.user?.name ?? "Anggota"} —{" "}
                    {Number(sale.pvAmount)} PV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rp{Number(sale.rupiahAmount).toLocaleString("id-ID")} |{" "}
                    {sale.confirmedAt
                      ? format(
                          new Date(sale.confirmedAt),
                          "dd/MM/yyyy HH:mm",
                        )
                      : "-"}
                  </p>
                </div>
                <Badge className="bg-blue-600">Terkonfirmasi</Badge>
              </div>
            ))}
            {(!data?.pvSalesHistory || data.pvSalesHistory.length === 0) && (
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
