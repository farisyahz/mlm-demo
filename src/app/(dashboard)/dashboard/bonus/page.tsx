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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { format } from "date-fns";

const bonusTypeLabels: Record<string, string> = {
  sponsor: "Bonus Sponsor",
  pairing: "Bonus Pasangan",
  matching: "Bonus Matching",
  shu: "Bonus SHU",
  personal_shopping: "Bonus Belanja Pribadi",
  seracoin: "Bonus SERACOIN",
  titik: "Bonus Titik",
  reward: "Bonus Reward",
  komunitas: "Bonus Komunitas",
  auto_system: "Bonus Auto System",
};

export default function BonusPage() {
  const { data: summary, isLoading: summaryLoading } =
    api.bonus.getMySummary.useQuery();
  const { data: shuInfo } = api.bonus.getMySHU.useQuery();
  const { data: bonusHistory } = api.wallet.getBonuses.useQuery({ limit: 50 });

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bonus</h1>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-100">Total Bonus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            Rp{Number(summary?.totalBonus ?? 0).toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>

      {/* Bonus by Type */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary?.byType.map((b) => (
          <Card key={b.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {bonusTypeLabels[b.type] ?? b.type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">
                Rp{Number(b.total).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground">
                {b.count}x diterima
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Riwayat Bonus</TabsTrigger>
          <TabsTrigger value="shu">Info SHU</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Bonus</CardTitle>
              <CardDescription>
                {bonusHistory?.total ?? 0} bonus diterima
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bonusHistory?.bonuses.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {bonusTypeLabels[b.type] ?? b.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      +Rp{Number(b.amount).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
                {(!bonusHistory?.bonuses ||
                  bonusHistory.bonuses.length === 0) && (
                  <p className="py-8 text-center text-muted-foreground">
                    Belum ada bonus
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shu">
          <Card>
            <CardHeader>
              <CardTitle>Informasi SHU</CardTitle>
              <CardDescription>
                Sisa Hasil Usaha berdasarkan akumulasi PV Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Jumlah SHU</p>
                  <p className="text-3xl font-bold">
                    {shuInfo?.currentSHUCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Akumulasi PV
                  </p>
                  <p className="text-3xl font-bold">
                    {Number(shuInfo?.accumulatedPV ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Tabel SHU:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { pv: 10, shu: 1 },
                    { pv: 35, shu: 2 },
                    { pv: 85, shu: 4 },
                    { pv: 150, shu: 6 },
                    { pv: 300, shu: 8 },
                    { pv: 450, shu: 10 },
                    { pv: 750, shu: 15 },
                    { pv: 1200, shu: 25 },
                    { pv: 1750, shu: 35 },
                    { pv: 2250, shu: 50 },
                    { pv: 3000, shu: 100 },
                  ].map((tier) => (
                    <div
                      key={tier.pv}
                      className={`flex justify-between rounded px-2 py-1 ${
                        Number(shuInfo?.accumulatedPV ?? 0) >= tier.pv
                          ? "bg-green-100 text-green-800"
                          : ""
                      }`}
                    >
                      <span>{tier.pv} PV</span>
                      <span className="font-medium">{tier.shu} SHU</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
