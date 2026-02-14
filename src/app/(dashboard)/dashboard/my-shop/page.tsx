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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Loader2, Store, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useUploadFiles } from "@better-upload/client";
import { UploadDropzone } from "~/components/ui/upload-dropzone";

export default function MyShopPage() {
  const { data: profile } = api.member.getMyProfile.useQuery();
  const { data: products } = api.product.getMyProducts.useQuery();
  const utils = api.useUtils();

  const [warungName, setWarungName] = useState("");

  const enableWarung = api.member.enableWarung.useMutation({
    onSuccess: () => {
      toast.success("Mode warung diaktifkan!");
      utils.member.getMyProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // New product form
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productPV, setProductPV] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");

  const uploader = useUploadFiles({
    route: "images",
    onUploadComplete: ({ files }) => {
      if (files.length > 0) {
        const key = files[0]!.objectInfo.key;
        const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${key}`;
        setProductImageUrl(url);
        toast.success("Gambar berhasil diunggah!");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Gagal mengunggah gambar");
    },
  });

  const createProduct = api.product.create.useMutation({
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan!");
      setProductName("");
      setProductPrice("");
      setProductPV("");
      setProductDesc("");
      setProductCategory("");
      setProductImageUrl("");
      utils.product.getMyProducts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!profile?.isWarung) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Toko Saya</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> Aktifkan Mode Warung
            </CardTitle>
            <CardDescription>
              Dengan mode warung, Anda bisa upload produk dan menjual kepada
              member lain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Warung</Label>
              <Input
                value={warungName}
                onChange={(e) => setWarungName(e.target.value)}
                placeholder="Nama warung Anda"
              />
            </div>
            <Button
              onClick={() =>
                enableWarung.mutate({ warungName })
              }
              disabled={enableWarung.isPending || !warungName}
            >
              {enableWarung.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Aktifkan Warung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Toko Saya</h1>
        <Badge>
          <Store className="mr-1 h-3 w-3" /> {profile.warungName}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Tambah Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createProduct.mutate({
                  name: productName,
                  price: Number(productPrice),
                  pvValue: Number(productPV),
                  description: productDesc || undefined,
                  category: productCategory || undefined,
                  imageUrl: productImageUrl || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Nama Produk</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga (Rp)</Label>
                  <Input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nilai PV</Label>
                  <Input
                    type="number"
                    value={productPV}
                    onChange={(e) => setProductPV(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="contoh: makanan, minuman, PPOB"
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar Produk</Label>
                {productImageUrl ? (
                  <div className="relative">
                    <img
                      src={productImageUrl}
                      alt="Preview"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => setProductImageUrl("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <UploadDropzone
                    control={uploader.control}
                    accept="image/*"
                    description={{
                      fileTypes: "gambar (JPG, PNG, WebP)",
                      maxFiles: 1,
                      maxFileSize: "5MB",
                    }}
                  />
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createProduct.isPending}
              >
                {createProduct.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tambah Produk
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produk Saya</CardTitle>
            <CardDescription>
              {products?.length ?? 0} produk terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rp{Number(p.price).toLocaleString("id-ID")} | {Number(p.pvValue)} PV
                    </p>
                  </div>
                  <Badge variant={p.isActive ? "default" : "secondary"}>
                    {p.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              ))}
              {(!products || products.length === 0) && (
                <p className="py-4 text-center text-muted-foreground">
                  Belum ada produk
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
