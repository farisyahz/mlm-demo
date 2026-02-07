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

export default function ProfilePage() {
  const { data: profile, isLoading } = api.member.getMyProfile.useQuery();
  const utils = api.useUtils();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");

  const updateProfile = api.member.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui!");
      utils.member.getMyProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Populate form when data loads
  if (profile && !phone && !address) {
    if (profile.phone) setPhone(profile.phone);
    if (profile.address) setAddress(profile.address);
    if (profile.bankName) setBankName(profile.bankName);
    if (profile.bankAccountNumber) setBankAccountNumber(profile.bankAccountNumber);
    if (profile.bankAccountHolder) setBankAccountHolder(profile.bankAccountHolder);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profil Saya</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">{profile?.user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kode Referral</p>
              <code className="font-mono font-bold">
                {profile?.referralCode}
              </code>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">
                {profile?.role}
              </Badge>
              {profile?.rank !== "none" && (
                <Badge className="capitalize">{profile?.rank}</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">PV Pribadi</p>
                <p className="font-bold">
                  {Number(profile?.personalPV ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Akumulasi PV</p>
                <p className="font-bold">
                  {Number(profile?.accumulatedPV ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profil</CardTitle>
            <CardDescription>
              Perbarui data kontak dan rekening bank Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate({
                  phone: phone || undefined,
                  address: address || undefined,
                  bankName: bankName || undefined,
                  bankAccountNumber: bankAccountNumber || undefined,
                  bankAccountHolder: bankAccountHolder || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Bank</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BCA, BRI, BNI..."
                />
              </div>
              <div className="space-y-2">
                <Label>No. Rekening</Label>
                <Input
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Nomor rekening"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Pemilik Rekening</Label>
                <Input
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="Sesuai buku rekening"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Perubahan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
