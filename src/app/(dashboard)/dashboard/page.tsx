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
  Wallet,
  Users,
  TrendingUp,
  Coins,
  Network,
  Gift,
  Star,
  Copy,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } =
    api.member.getDashboardStats.useQuery();
  const { data: bonusSummary } = api.bonus.getMySummary.useQuery();
  const { data: turnover } = api.wallet.getNationalTurnover.useQuery();
  const { data: referralLink } = api.member.getReferralLink.useQuery();

  const copyReferralLink = () => {
    if (referralLink) {
      const url = `${window.location.origin}/register?ref=${referralLink.code}`;
      navigator.clipboard.writeText(url);
      toast.success("Link referral berhasil disalin!");
    }
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const profile = stats?.profile;
  const wallet = stats?.wallet;
  const treeNode = stats?.treeNode;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h1 className="text-2xl font-bold">
          Selamat datang, {profile?.referralCode}!
        </h1>
        <p className="mt-1 text-blue-100">
          Peringkat:{" "}
          <Badge variant="secondary" className="capitalize">
            {profile?.rank === "none" ? "Belum Ada" : profile?.rank}
          </Badge>
        </p>
        {referralLink && (
          <div className="mt-3 flex items-center gap-2">
            <code className="rounded bg-white/20 px-2 py-1 text-sm">
              {referralLink.code}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={copyReferralLink}
            >
              <Copy className="mr-1 h-3 w-3" /> Salin Link Referral
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp{Number(wallet?.mainBalance ?? 0).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Frozen: Rp{Number(wallet?.frozenBalance ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PV Pribadi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(profile?.personalPV ?? 0).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Akumulasi: {Number(profile?.accumulatedPV ?? 0).toLocaleString("id-ID")} PV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SERACOIN</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(wallet?.coinBalance ?? 0).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Coin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Rekrut Langsung
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.directRecruitCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Member</p>
          </CardContent>
        </Card>
      </div>

      {/* Network & Bonus Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" /> Jaringan Binary
            </CardTitle>
            <CardDescription>Statistik kaki kiri dan kanan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Kiri</p>
                <p className="text-xl font-bold">
                  {treeNode?.leftGroupHU ?? 0} HU
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(treeNode?.leftGroupPV ?? 0).toLocaleString("id-ID")} PV
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Kanan</p>
                <p className="text-xl font-bold">
                  {treeNode?.rightGroupHU ?? 0} HU
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(treeNode?.rightGroupPV ?? 0).toLocaleString("id-ID")} PV
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {profile?.planBActive && (
                <Badge variant="secondary">Plan B Aktif</Badge>
              )}
              {profile?.planCActive && (
                <Badge variant="secondary">Plan C Aktif</Badge>
              )}
              {profile?.planDActive && (
                <Badge variant="secondary">Plan D Aktif</Badge>
              )}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/dashboard/network">Lihat Jaringan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" /> Ringkasan Bonus
            </CardTitle>
            <CardDescription>Total bonus yang Anda terima</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              Rp{Number(bonusSummary?.totalBonus ?? 0).toLocaleString("id-ID")}
            </div>
            <div className="mt-4 space-y-2">
              {bonusSummary?.byType.map((b) => (
                <div
                  key={b.type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {b.type.replace("_", " ")}
                  </span>
                  <span className="font-medium">
                    Rp{Number(b.total).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/dashboard/bonus">Detail Bonus</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* National Turnover */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" /> Omset Nasional
          </CardTitle>
          <CardDescription>
            PV dan omset nasional periode berjalan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">PV Hari Ini</p>
              <p className="text-lg font-bold">
                {Number(turnover?.todayPV ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rupiah Hari Ini</p>
              <p className="text-lg font-bold">
                Rp{Number(turnover?.todayRupiah ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PV Periode</p>
              <p className="text-lg font-bold">
                {Number(turnover?.periodPV ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rupiah Periode</p>
              <p className="text-lg font-bold">
                Rp{Number(turnover?.periodRupiah ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
