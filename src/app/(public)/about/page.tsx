import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeft, Building2, Target, Eye, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                SC
              </div>
              <span className="text-lg font-bold">Seramart Coin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Daftar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-4xl font-extrabold">Profil Perusahaan</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          CV Rolan Karya Pratama
        </p>

        <div className="mt-8 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Tentang Kami
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert">
              <p>
                CV Rolan Karya Pratama adalah perusahaan yang bergerak di bidang
                perdagangan dan distribusi produk konsumen melalui sistem Multi
                Level Konsumen (MLK) dengan brand Seramart Coin.
              </p>
              <p>
                Kami mengusung konsep hybrid system yang memadukan 4 plan
                keuntungan (Plan A, B, C, dan D) untuk memberikan kesempatan
                penghasilan yang optimal bagi seluruh mitra.
              </p>
              <p>
                Dengan target menjadikan koperasi desa sebagai mitra toko dan
                masyarakat sebagai konsumen, kami berkomitmen untuk membangun
                ekosistem perdagangan yang adil, transparan, dan berkelanjutan.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Visi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Menjadi platform Multi Level Konsumen terdepan di Indonesia yang
                memberdayakan masyarakat melalui sistem perdagangan digital yang
                transparan, aman, dan menguntungkan semua pihak.
              </p>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" /> Misi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Membangun jaringan distribusi produk yang efisien dan
                  terjangkau hingga ke pelosok desa.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Memberikan kesempatan penghasilan yang adil melalui sistem
                  bonus berlapis dan transparan.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Mengembangkan teknologi digital (SERACOIN) sebagai sarana
                  tabungan dan investasi mitra.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">4.</span>
                  Menjalin kerjasama dengan koperasi desa untuk memperkuat
                  ekonomi lokal.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">5.</span>
                  Mematuhi regulasi pemerintah (Kominfo dan OJK) untuk menjamin
                  keamanan dan kepercayaan mitra.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Team (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Stakeholder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { role: "Direktur Utama", name: "—" },
                  { role: "Bendahara", name: "—" },
                  { role: "Admin & IT", name: "—" },
                ].map((person) => (
                  <div
                    key={person.role}
                    className="flex flex-col items-center rounded-lg border p-6 text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                      {person.name === "—" ? "?" : person.name.slice(0, 2)}
                    </div>
                    <p className="mt-3 font-semibold">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.role}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Data stakeholder akan diperbarui sesuai profil perusahaan.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} CV Rolan Karya Pratama. Semua hak
            dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
