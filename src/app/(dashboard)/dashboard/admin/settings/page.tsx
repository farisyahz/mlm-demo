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
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { data: settings } = api.admin.getSettings.useQuery();
  const utils = api.useUtils();

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  const upsertSetting = api.admin.upsertSetting.useMutation({
    onSuccess: () => {
      toast.success("Pengaturan berhasil disimpan!");
      setKey("");
      setValue("");
      setDescription("");
      utils.admin.getSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Tambah/Update Pengaturan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                upsertSetting.mutate({
                  key,
                  value,
                  description: description || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="company_name, pv_rate, dll"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={upsertSetting.isPending}
              >
                {upsertSetting.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Saat Ini</CardTitle>
            <CardDescription>
              {settings?.length ?? 0} pengaturan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settings?.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <code className="text-sm font-mono font-bold">{s.key}</code>
                    {s.description && (
                      <p className="text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <code className="text-sm">{s.value}</code>
                </div>
              ))}
              {(!settings || settings.length === 0) && (
                <p className="py-4 text-center text-muted-foreground">
                  Belum ada pengaturan
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
