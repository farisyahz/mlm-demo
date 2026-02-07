"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Users, KeyRound, BarChart3, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function AdminDashboardPage() {
  const { data, isLoading } = api.admin.getDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Member</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.memberCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Aktif: {data?.activeMemberCount ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo Member</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp{Number(data?.totalWalletBalance ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Omset Nasional (Periode)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Number(data?.unsettledPV ?? 0).toLocaleString("id-ID")} PV
            </p>
            <p className="text-xs text-muted-foreground">
              Rp{Number(data?.unsettledRupiah ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PIN Tersedia</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.availablePins ?? 0}</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/dashboard/admin/pins">Kelola PIN</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/admin/pins">Generate PIN</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/members">Kelola Member</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/stokis">Kelola Stokis</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/turnover">Omset Nasional</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/audit">Audit Log</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
