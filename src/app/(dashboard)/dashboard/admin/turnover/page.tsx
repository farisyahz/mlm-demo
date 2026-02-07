"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react";

export default function AdminTurnoverPage() {
  const { data: turnover } = api.wallet.getNationalTurnover.useQuery();
  const { data: dashboard } = api.admin.getDashboard.useQuery();
  const { data: bonusDist } = api.bonus.getDistributionSummary.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Omset Nasional</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-100">
              PV Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Number(turnover?.todayPV ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-100">
              Rupiah Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              Rp{Number(turnover?.todayRupiah ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-100">
              PV Periode (Unsettled)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Number(turnover?.periodPV ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-100">
              Rupiah Periode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              Rp{Number(turnover?.periodRupiah ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Distribusi Omset
          </CardTitle>
          <CardDescription>
            Pembagian omset nasional per kategori
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4 text-sm">
              <div>
                <p className="text-muted-foreground">Perusahaan/Owner</p>
                <p className="text-lg font-bold">12.3%</p>
                <p className="text-xs text-muted-foreground">
                  Rp{(Number(turnover?.periodRupiah ?? 0) * 0.123).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">IT</p>
                <p className="text-lg font-bold">1%</p>
                <p className="text-xs text-muted-foreground">
                  Rp{(Number(turnover?.periodRupiah ?? 0) * 0.01).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Bonus & Transaksi</p>
                <p className="text-lg font-bold">86.7%</p>
                <p className="text-xs text-muted-foreground">
                  Rp{(Number(turnover?.periodRupiah ?? 0) * 0.867).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Bonus</CardTitle>
          <CardDescription>
            Total bonus yang telah didistribusikan per tipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bonusDist?.map((b) => (
              <div
                key={b.type}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="capitalize text-sm">
                  {b.type.replace("_", " ")}
                </span>
                <div className="text-right">
                  <p className="font-semibold">
                    Rp{Number(b.totalAmount).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.count}x distribusi
                  </p>
                </div>
              </div>
            ))}
            {(!bonusDist || bonusDist.length === 0) && (
              <p className="py-4 text-center text-muted-foreground">
                Belum ada bonus didistribusikan
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
