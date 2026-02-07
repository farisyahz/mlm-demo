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
import { ShoppingBag, Store, MapPin } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function ShopPage() {
  const { data: products, isLoading } = api.product.list.useQuery({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Belanja</h1>

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
