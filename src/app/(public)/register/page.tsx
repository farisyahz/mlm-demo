"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";

  const [step, setStep] = useState(1); // 1 = account, 2 = MLM registration
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [position, setPosition] = useState<"left" | "right" | "auto">("auto");
  const [sponsorCode, setSponsorCode] = useState(refCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registerMember = api.member.register.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const sponsorQuery = api.member.resolveReferral.useQuery(
    { code: sponsorCode },
    { enabled: sponsorCode.length >= 3 },
  );

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(
          result.error.message ?? "Gagal membuat akun. Coba email lain.",
        );
        setLoading(false);
        return;
      }

      setStep(2);
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    registerMember.mutate({
      pinCode,
      sponsorReferralCode: sponsorCode || undefined,
      position: position === "auto" ? undefined : position,
      autoPlacement: position === "auto",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? "Buat Akun" : "Registrasi Member"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Daftar ke Seramart Coin"
              : "Masukkan PIN dan data sponsor"}
          </CardDescription>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <div className="h-0.5 w-8 bg-muted" />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              2
            </div>
          </div>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleStep1}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  placeholder="08xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lanjutkan
              </Button>
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Masuk disini
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleStep2}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="pin">Kode PIN Registrasi</Label>
                <Input
                  id="pin"
                  placeholder="Masukkan PIN dari stokis"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  PIN dapat dibeli dari stokis resmi Seramart.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor">Kode Referral Sponsor</Label>
                <Input
                  id="sponsor"
                  placeholder="Kode referral sponsor (opsional)"
                  value={sponsorCode}
                  onChange={(e) => setSponsorCode(e.target.value)}
                />
                {sponsorQuery.data && (
                  <p className="text-xs text-green-600">
                    Sponsor: {sponsorQuery.data.sponsorName}
                  </p>
                )}
                {sponsorCode && !sponsorQuery.data && !sponsorQuery.isLoading && (
                  <p className="text-xs text-yellow-600">
                    Sponsor tidak ditemukan
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Posisi di Jaringan</Label>
                <Select
                  value={position}
                  onValueChange={(v) => setPosition(v as "left" | "right" | "auto")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Otomatis (auto-balance)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Otomatis</SelectItem>
                    <SelectItem value="left">Kiri</SelectItem>
                    <SelectItem value="right">Kanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftar Sebagai Member
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
