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
import { Coins, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function CoinsPage() {
  const { data: coinInfo } = api.bonus.getMyCoins.useQuery();
  const { data: wallet } = api.wallet.getMyWallet.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SERACOIN</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-yellow-100">
              <Coins className="h-4 w-4" /> Total Koin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {Number(wallet?.coinBalance ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Diperoleh</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {Number(coinInfo?.totalEarned ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Dijual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {Number(coinInfo?.totalSold ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coin Tier Info */}
      <Card>
        <CardHeader>
          <CardTitle>Cara Mendapatkan SERACOIN</CardTitle>
          <CardDescription>
            Berdasarkan perkembangan grup kiri dan kanan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {[
              { hu: 1, coins: 1 },
              { hu: 7, coins: 2 },
              { hu: 15, coins: 3 },
              { hu: 50, coins: 4 },
              { hu: 150, coins: 6 },
              { hu: 250, coins: 8 },
              { hu: 350, coins: 10 },
              { hu: 750, coins: 12 },
              { hu: 1250, coins: 15 },
              { hu: 1750, coins: 20 },
              { hu: 2500, coins: 30 },
              { hu: 3500, coins: 50 },
              { hu: 7500, coins: 75 },
              { hu: 10000, coins: 100 },
              { hu: 15000, coins: 150 },
              { hu: 25000, coins: 200 },
            ].map((tier) => (
              <div
                key={tier.hu}
                className="flex justify-between rounded border p-2"
              >
                <span>
                  {tier.hu}/{tier.hu} HU
                </span>
                <span className="font-bold text-yellow-600">
                  {tier.coins} koin
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coin History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Koin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {coinInfo?.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      entry.type === "earned"
                        ? "bg-green-100 text-green-600"
                        : entry.type === "sold"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {entry.type === "earned" ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {entry.type === "earned" ? "Diperoleh" : entry.type === "sold" ? "Dijual" : "Dibeli"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      entry.type === "sold"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {entry.type === "sold" ? "-" : "+"}
                    {Number(entry.amount).toLocaleString("id-ID")} koin
                  </p>
                  {entry.pricePerCoin && (
                    <p className="text-xs text-muted-foreground">
                      @Rp{Number(entry.pricePerCoin).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(!coinInfo?.entries || coinInfo.entries.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada riwayat koin
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
