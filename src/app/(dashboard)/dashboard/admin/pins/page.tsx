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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminPinsPage() {
  const [count, setCount] = useState("10");
  const utils = api.useUtils();

  const { data: pinData, isLoading } = api.admin.listPins.useQuery({
    limit: 50,
  });

  const generatePins = api.admin.generatePins.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count} PIN berhasil di-generate!`);
      utils.admin.listPins.invalidate();
      utils.admin.getDashboard.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kelola PIN</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Generate PINs */}
        <Card>
          <CardHeader>
            <CardTitle>Generate PIN</CardTitle>
            <CardDescription>
              PIN registrasi untuk member baru
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Jumlah PIN</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <Button
              onClick={() => generatePins.mutate({ count: Number(count) })}
              disabled={generatePins.isPending}
              className="w-full"
            >
              {generatePins.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate {count} PIN
            </Button>
          </CardContent>
        </Card>

        {/* PIN Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daftar PIN</CardTitle>
            <CardDescription>
              Total: {pinData?.total ?? 0} PIN
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {pinData?.pins.map((pin) => (
                <div
                  key={pin.id}
                  className="flex items-center justify-between rounded border p-2 text-sm"
                >
                  <code className="font-mono">{pin.pin}</code>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Number(pin.pvValue)} PV
                    </span>
                    <Badge
                      variant={
                        pin.status === "available"
                          ? "default"
                          : pin.status === "used"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {pin.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!pinData?.pins || pinData.pins.length === 0) && (
                <p className="py-4 text-center text-muted-foreground">
                  Belum ada PIN
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
