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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminMembersPage() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const utils = api.useUtils();

  const { data, isLoading } = api.member.list.useQuery({
    limit: 50,
    role: roleFilter === "all" ? undefined : (roleFilter as any),
  });

  const updateRole = api.member.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role berhasil diupdate!");
      utils.member.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Member</h1>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="stokis">Stokis</SelectItem>
            <SelectItem value="bendahara">Bendahara</SelectItem>
            <SelectItem value="direktur">Direktur</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Member</CardTitle>
          <CardDescription>Total: {data?.total ?? 0} member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.user.email} | {m.referralCode}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {m.role}
                    </Badge>
                    {m.rank !== "none" && (
                      <Badge variant="secondary" className="capitalize text-[10px]">
                        {m.rank}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {Number(m.accumulatedPV).toLocaleString("id-ID")} PV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: Rp{Number(m.wallet?.mainBalance ?? 0).toLocaleString("id-ID")}
                  </p>
                  <Select
                    value={m.role}
                    onValueChange={(val) =>
                      updateRole.mutate({
                        memberId: m.id,
                        role: val as any,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="stokis">Stokis</SelectItem>
                      <SelectItem value="bendahara">Bendahara</SelectItem>
                      <SelectItem value="direktur">Direktur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {(!data?.members || data.members.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">
                Tidak ada member
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
