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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { format } from "date-fns";

export default function StokisPinsPage() {
  const { data: available } = api.stokis.getPinStock.useQuery({
    limit: 100,
    status: "available",
  });
  const { data: used } = api.stokis.getPinStock.useQuery({
    limit: 100,
    status: "used",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stok PIN</h1>

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">
            Tersedia ({available?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="used">
            Terpakai ({used?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>PIN Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {available?.pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div>
                      <code className="font-mono font-bold">{pin.pin}</code>
                      <p className="text-xs text-muted-foreground">
                        {Number(pin.pvValue)} PV | Rp{Number(pin.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <Badge>Tersedia</Badge>
                  </div>
                ))}
                {(!available?.pins || available.pins.length === 0) && (
                  <p className="py-4 text-center text-muted-foreground">
                    Tidak ada PIN tersedia
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="used">
          <Card>
            <CardHeader>
              <CardTitle>PIN Terpakai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {used?.pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div>
                      <code className="font-mono">{pin.pin}</code>
                      {pin.usedAt && (
                        <p className="text-xs text-muted-foreground">
                          Dipakai:{" "}
                          {format(new Date(pin.usedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">Terpakai</Badge>
                  </div>
                ))}
                {(!used?.pins || used.pins.length === 0) && (
                  <p className="py-4 text-center text-muted-foreground">
                    Belum ada PIN terpakai
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
