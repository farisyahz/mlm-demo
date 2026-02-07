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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Loader2, Building2, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

export default function AdminStokisPage() {
  const utils = api.useUtils();
  const { data: stokisList } = api.stokis.listStokis.useQuery();

  // Fetch members who are NOT already stokis (role = 'member')
  const { data: membersData } = api.member.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const createStokis = api.admin.createStokis.useMutation({
    onSuccess: () => {
      toast.success("Stokis berhasil ditambahkan!");
      setSelectedMemberId(null);
      setName("");
      setAddress("");
      setPhone("");
      utils.stokis.listStokis.invalidate();
      utils.member.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Filter out members who are already stokis
  const existingStokisMemberIds = new Set(
    stokisList?.map((s: any) => s.memberId) ?? [],
  );
  const availableMembers =
    membersData?.members.filter(
      (m) => !existingStokisMemberIds.has(m.id) && m.role !== "stokis",
    ) ?? [];

  const selectedMember = availableMembers.find(
    (m) => m.id === selectedMemberId,
  );

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
            <CardDescription>
              Pilih member yang akan dijadikan stokis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedMemberId) {
                  toast.error("Pilih member terlebih dahulu");
                  return;
                }
                createStokis.mutate({
                  memberId: selectedMemberId,
                  name,
                  address: address || undefined,
                  phone: phone || undefined,
                });
              }}
            >
              {/* Member Combobox */}
              <div className="space-y-2">
                <Label>Pilih Member</Label>
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedMember ? (
                        <span className="truncate">
                          {selectedMember.user.name} ({selectedMember.user.email}
                          )
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Cari member...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cari nama atau email..." />
                      <CommandList>
                        <CommandEmpty>Member tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {availableMembers.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={`${m.user.name} ${m.user.email}`}
                              onSelect={() => {
                                setSelectedMemberId(m.id);
                                // Auto-fill name with member name if empty
                                if (!name) {
                                  setName(`Stokis ${m.user.name}`);
                                }
                                setComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMemberId === m.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {m.user.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {m.user.email} · ID #{m.id} ·{" "}
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {m.role}
                                  </Badge>
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedMember && (
                  <p className="text-xs text-muted-foreground">
                    Member ID: #{selectedMember.id} · PV:{" "}
                    {Number(selectedMember.personalPV).toLocaleString("id-ID")} ·
                    Rank: {selectedMember.rank}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nama Stokis</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama untuk stokis ini"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat stokis (opsional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="No. telepon (opsional)"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createStokis.isPending || !selectedMemberId}
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
                      PIN: {s.pinStock} | PV:{" "}
                      {Number(s.pvStock).toLocaleString("id-ID")}
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
