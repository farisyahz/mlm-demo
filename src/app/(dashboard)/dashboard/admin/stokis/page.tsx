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
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminStokisPage() {
  const utils = api.useUtils();
  const { data: stokisList } = api.stokis.listStokis.useQuery();

  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const createStokis = api.admin.createStokis.useMutation({
    onSuccess: () => {
      toast.success("Stokis berhasil ditambahkan!");
      setMemberId("");
      setName("");
      setAddress("");
      setPhone("");
      utils.stokis.listStokis.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kelola Stokis</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Stokis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Tambah Stokis Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createStokis.mutate({
                  memberId: Number(memberId),
                  name,
                  address: address || undefined,
                  phone: phone || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Member ID</Label>
                <Input
                  type="number"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="ID member yang akan dijadikan stokis"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Stokis</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createStokis.isPending}
              >
                {createStokis.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tambah Stokis
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stokis List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Stokis</CardTitle>
            <CardDescription>
              {stokisList?.length ?? 0} stokis terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stokisList?.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      No. {s.stokisNumber} | {s.member?.user?.name}
                    </p>
                    {s.phone && (
                      <p className="text-xs text-muted-foreground">
                        {s.phone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PIN: {s.pinStock} | PV: {Number(s.pvStock).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
              {(!stokisList || stokisList.length === 0) && (
                <p className="py-4 text-center text-muted-foreground">
                  Belum ada stokis
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
