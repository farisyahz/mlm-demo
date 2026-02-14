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
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { Check, X, Loader2, Package, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminProductsPage() {
  const utils = api.useUtils();

  const { data: pendingData } = api.admin.listPendingProducts.useQuery({
    status: "pending",
    limit: 50,
  });
  const { data: approvedData } = api.admin.listPendingProducts.useQuery({
    status: "approved",
    limit: 50,
  });
  const { data: rejectedData } = api.admin.listPendingProducts.useQuery({
    status: "rejected",
    limit: 50,
  });

  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>(
    {},
  );

  const approve = api.admin.approveProduct.useMutation({
    onSuccess: () => {
      toast.success("Produk berhasil disetujui!");
      utils.admin.listPendingProducts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reject = api.admin.rejectProduct.useMutation({
    onSuccess: () => {
      toast.success("Produk berhasil ditolak");
      utils.admin.listPendingProducts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kelola Produk</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Menunggu ({pendingData?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Disetujui ({approvedData?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Ditolak ({rejectedData?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Produk Menunggu Persetujuan
              </CardTitle>
              <CardDescription>
                {pendingData?.total ?? 0} produk perlu ditinjau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingData?.products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex gap-4">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-24 w-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground">
                                {product.description}
                              </p>
                            )}
                            <p className="mt-1 text-sm">
                              Rp
                              {Number(product.price).toLocaleString("id-ID")}{" "}
                              | {Number(product.pvValue)} PV
                            </p>
                            {product.category && (
                              <Badge variant="outline" className="mt-1">
                                {product.category}
                              </Badge>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Warung:{" "}
                              {(product.warung as any)?.user?.name ??
                                "Tidak diketahui"}{" "}
                              |{" "}
                              {format(
                                new Date(product.createdAt),
                                "dd/MM/yyyy HH:mm",
                              )}
                            </p>
                          </div>
                          <Badge>Menunggu</Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              approve.mutate({ productId: product.id })
                            }
                            disabled={approve.isPending}
                          >
                            {approve.isPending ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-3 w-3" />
                            )}
                            Setujui
                          </Button>
                          <Input
                            placeholder="Alasan penolakan"
                            className="h-8 text-sm"
                            value={rejectReasons[product.id] ?? ""}
                            onChange={(e) =>
                              setRejectReasons((prev) => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              reject.mutate({
                                productId: product.id,
                                reason:
                                  rejectReasons[product.id] ??
                                  "Tidak memenuhi syarat",
                              })
                            }
                            disabled={reject.isPending}
                          >
                            <X className="mr-1 h-3 w-3" /> Tolak
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!pendingData?.products ||
                  pendingData.products.length === 0) && (
                  <p className="py-8 text-center text-muted-foreground">
                    Tidak ada produk yang menunggu persetujuan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Produk Disetujui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedData?.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rp{Number(product.price).toLocaleString("id-ID")} |{" "}
                        {Number(product.pvValue)} PV |{" "}
                        {(product.warung as any)?.user?.name ?? ""}
                      </p>
                    </div>
                    <Badge className="bg-green-600">Disetujui</Badge>
                  </div>
                ))}
                {(!approvedData?.products ||
                  approvedData.products.length === 0) && (
                  <p className="py-8 text-center text-muted-foreground">
                    Belum ada produk disetujui
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Produk Ditolak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rejectedData?.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(product.warung as any)?.user?.name ?? ""}
                      </p>
                      {product.rejectionReason && (
                        <p className="text-xs text-red-600">
                          Alasan: {product.rejectionReason}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">Ditolak</Badge>
                  </div>
                ))}
                {(!rejectedData?.products ||
                  rejectedData.products.length === 0) && (
                  <p className="py-8 text-center text-muted-foreground">
                    Belum ada produk ditolak
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
