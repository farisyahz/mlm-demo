"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  ShoppingBag,
  Store,
  TrendingUp,
  Loader2,
  Building2,
  Wallet,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

export default function ShopPage() {
  const { data: products } = api.product.list.useQuery({ limit: 50 });
  const { data: stokisList } = api.stokis.listStokis.useQuery();
  const utils = api.useUtils();

  // PV Purchase form state
  const [selectedStokis, setSelectedStokis] = useState<number | null>(null);
  const [pvAmount, setPvAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "manual_transfer"
  >("wallet");

  const requestPV = api.stokis.requestPVPurchase.useMutation({
    onSuccess: (data) => {
      if (data?.status === "confirmed") {
        toast.success("PV berhasil dibeli dan dikreditkan!");
      } else {
        toast.success(
          "Permintaan pembelian PV dikirim. Menunggu konfirmasi stokis.",
        );
      }
      setPvAmount("");
      utils.wallet.getMyWallet.invalidate();
      utils.member.getDashboardStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Belanja</h1>

      {/* PV Purchase Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Beli PV dari Stokis
          </CardTitle>
          <CardDescription>
            Pilih stokis, tentukan jumlah PV, dan pilih metode pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Stokis</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
                  {stokisList?.map((s) => (
                    <div
                      key={s.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                        selectedStokis === s.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedStokis(s.id)}
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stok PV: {Number(s.pvStock).toLocaleString("id-ID")}
                        </p>
                      </div>
                      {selectedStokis === s.id && (
                        <Badge variant="default" className="text-[10px]">
                          Dipilih
                        </Badge>
                      )}
                    </div>
                  ))}
                  {(!stokisList || stokisList.length === 0) && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Belum ada stokis tersedia
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jumlah PV</Label>
                <Input
                  type="number"
                  min="1"
                  value={pvAmount}
                  onChange={(e) => setPvAmount(e.target.value)}
                  placeholder="Masukkan jumlah PV"
                />
                {pvAmount && (
                  <p className="text-xs text-muted-foreground">
                    Total: Rp
                    {(Number(pvAmount) * 1000).toLocaleString("id-ID")} (1 PV =
                    Rp1.000)
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <div className="space-y-2">
                  <div
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      paymentMethod === "wallet"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setPaymentMethod("wallet")}
                  >
                    <Wallet className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">Potong Saldo Dompet</p>
                      <p className="text-xs text-muted-foreground">
                        Langsung dikreditkan setelah pembayaran
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      paymentMethod === "manual_transfer"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setPaymentMethod("manual_transfer")}
                  >
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">Transfer Manual</p>
                      <p className="text-xs text-muted-foreground">
                        Stokis akan mengkonfirmasi setelah pembayaran diterima
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={
                  !selectedStokis ||
                  !pvAmount ||
                  Number(pvAmount) <= 0 ||
                  requestPV.isPending
                }
                onClick={() =>
                  requestPV.mutate({
                    stokisId: selectedStokis!,
                    pvAmount: Number(pvAmount),
                    paymentMethod,
                  })
                }
              >
                {requestPV.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Beli PV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Catalog */}
      <h2 className="text-xl font-bold">Produk Warung</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.products.map((product) => (
          <Card key={product.id}>
            {product.imageUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              {product.description && (
                <CardDescription>{product.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">
                    Rp{Number(product.price).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(product.pvValue)} PV
                  </p>
                </div>
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </div>
              {product.warung && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Store className="h-3 w-3" />
                  {(product.warung as any).user?.name ?? "Warung"}
                </div>
              )}
              <Button className="mt-3 w-full" size="sm">
                <ShoppingBag className="mr-2 h-4 w-4" /> Beli
              </Button>
            </CardContent>
          </Card>
        ))}
        {(!products?.products || products.products.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">Belum ada produk tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
}
