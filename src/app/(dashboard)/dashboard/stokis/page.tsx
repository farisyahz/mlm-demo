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
import { Building2, KeyRound, QrCode } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function StokisDashboardPage() {
  const { data: stokisProfile } = api.stokis.getMyProfile.useQuery();
  const { data: pinData } = api.stokis.getPinStock.useQuery({
    limit: 10,
    status: "available",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stokis Dashboard</h1>

      {stokisProfile ? (
        <>
          {/* Stokis Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4" /> Info Stokis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{stokisProfile.name}</p>
                <p className="text-sm text-muted-foreground">
                  No. Stokis: {stokisProfile.stokisNumber}
                </p>
                <Badge className="mt-2">
                  {stokisProfile.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4" /> Stock PIN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stokisProfile.pinStock}</p>
                <p className="text-xs text-muted-foreground">
                  PIN tersedia
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/dashboard/stokis/pins">Kelola PIN</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <QrCode className="h-4 w-4" /> Barcode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-sm font-mono break-all">
                  {stokisProfile.barcodeData}
                </code>
                <p className="mt-2 text-xs text-muted-foreground">
                  PV Stock: {Number(stokisProfile.pvStock).toLocaleString("id-ID")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Available PINs */}
          <Card>
            <CardHeader>
              <CardTitle>PIN Tersedia (Terbaru)</CardTitle>
              <CardDescription>
                {pinData?.total ?? 0} PIN tersedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pinData?.pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <code className="font-mono">{pin.pin}</code>
                    <Badge>Available</Badge>
                  </div>
                ))}
                {(!pinData?.pins || pinData.pins.length === 0) && (
                  <p className="py-4 text-center text-muted-foreground">
                    Tidak ada PIN tersedia
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2 text-muted-foreground">
              Anda belum terdaftar sebagai stokis. Hubungi admin untuk
              mendaftar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
