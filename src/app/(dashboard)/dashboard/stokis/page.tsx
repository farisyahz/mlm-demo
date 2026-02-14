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
  Building2,
  KeyRound,
  QrCode,
  TrendingUp,
  Banknote,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StokisDashboardPage() {
  const { data: stokisProfile } = api.stokis.getMyProfile.useQuery();
  const { data: pinData } = api.stokis.getPinStock.useQuery({
    limit: 10,
    status: "available",
  });
  const { data: pvRequests } = api.stokis.listPVRequests.useQuery({
    status: "pending",
    limit: 20,
  });

  const utils = api.useUtils();

  const confirmPV = api.stokis.confirmPVPurchase.useMutation({
    onSuccess: () => {
      toast.success("Pembelian PV dikonfirmasi!");
      utils.stokis.listPVRequests.invalidate();
      utils.stokis.getMyProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectPV = api.stokis.rejectPVPurchase.useMutation({
    onSuccess: () => {
      toast.success("Permintaan PV ditolak");
      utils.stokis.listPVRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Stokis</h1>

      {stokisProfile ? (
        <>
          {/* Stokis Info */}
          <div className="grid gap-4 md:grid-cols-4">
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
                  <KeyRound className="h-4 w-4" /> Stok PIN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stokisProfile.pinStock}</p>
                <p className="text-xs text-muted-foreground">PIN tersedia</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/dashboard/stokis/pins">Kelola PIN</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" /> Stok PV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {Number(stokisProfile.pvStock).toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground">PV tersedia</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4" /> Total Komisi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  Rp
                  {Number(stokisProfile.totalCommission).toLocaleString(
                    "id-ID",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rate: {Number(stokisProfile.commissionRate)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PV Purchase Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Pembelian PV</CardTitle>
              <CardDescription>
                {pvRequests?.length ?? 0} permintaan menunggu konfirmasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pvRequests?.map((req: any) => (
                  <div
                    key={req.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {req.member?.user?.name ?? "Anggota"}
                        </p>
                        <p className="text-sm">
                          {Number(req.pvAmount)} PV | Rp
                          {Number(req.rupiahAmount).toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Metode:{" "}
                          {req.paymentMethod === "wallet"
                            ? "Saldo Dompet"
                            : "Transfer Manual"}{" "}
                          |{" "}
                          {format(
                            new Date(req.createdAt),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </p>
                      </div>
                      <Badge>Menunggu</Badge>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          confirmPV.mutate({ purchaseId: req.id })
                        }
                        disabled={confirmPV.isPending}
                      >
                        {confirmPV.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-3 w-3" />
                        )}
                        Konfirmasi
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          rejectPV.mutate({ purchaseId: req.id })
                        }
                        disabled={rejectPV.isPending}
                      >
                        <X className="mr-1 h-3 w-3" /> Tolak
                      </Button>
                    </div>
                  </div>
                ))}
                {(!pvRequests || pvRequests.length === 0) && (
                  <p className="py-4 text-center text-muted-foreground">
                    Tidak ada permintaan pembelian PV
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Barcode & Recent PINs */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <QrCode className="h-4 w-4" /> Barcode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="break-all font-mono text-sm">
                  {stokisProfile.barcodeData}
                </code>
              </CardContent>
            </Card>

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
                      <Badge>Tersedia</Badge>
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
          </div>
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
