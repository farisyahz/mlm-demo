import Link from "next/link";
import { getSession } from "~/server/better-auth/server";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ArrowRight,
  Users,
  Coins,
  TrendingUp,
  Shield,
  Gift,
  Network,
  ChevronRight,
  Zap,
  Star,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
              SC
              <div className="absolute -inset-0.5 rounded-xl bg-linear-to-br from-blue-600 to-violet-600 opacity-40 blur-sm" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Seramart<span className="text-blue-600">Coin</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Cara Kerja
            </a>
            <a href="#bonuses" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Bonus
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button size="sm" className="bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 border-0" asChild>
              <Link href="/register">
                Daftar Gratis
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-24 sm:py-32 lg:py-40">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
          <div className="absolute -right-32 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[120px] animate-pulse [animation-delay:1s]" />
          <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-6 border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-blue-300 backdrop-blur-sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Platform MLK Terpercaya di Indonesia
          </Badge>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Bangun Jaringan,{" "}
            <span className="bg-linear-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Raih Penghasilan
            </span>{" "}
            Tanpa Batas
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
            Bergabung dengan ekosistem Multi Level Konsumen Seramart Coin.
            Belanja, rekrut, dan nikmati bonus berlapis melalui sistem binary
            yang transparan, adil, dan menguntungkan.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-8 text-base text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:brightness-110 border-0"
              asChild
            >
              <Link href="/register">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-slate-700 bg-white/5 px-8 text-base text-slate-300 backdrop-blur-sm hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="#how-it-works">Pelajari Lebih Lanjut</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/10 pt-12">
            {[
              { value: "6+", label: "Jenis Bonus" },
              { value: "4", label: "Plan Pendapatan" },
              { value: "20%", label: "Bonus Hingga" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TRUST BAR                                                          */}
      {/* ================================================================== */}
      <section className="border-b bg-muted/50 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 text-center sm:px-6 lg:px-8">
          {[
            { icon: Shield, text: "Sistem Transparan" },
            { icon: CheckCircle2, text: "Legal & Terdaftar" },
            { icon: Zap, text: "Bonus Real-time" },
            { icon: Star, text: "Reward Menarik" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <item.icon className="h-4 w-4 text-blue-600" />
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* FEATURES                                                           */}
      {/* ================================================================== */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Fitur Unggulan
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Semua yang Anda Butuhkan dalam{" "}
              <span className="text-blue-600">Satu Platform</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Kami menyediakan tools dan sistem lengkap untuk membantu Anda
              membangun dan mengembangkan jaringan bisnis secara efektif.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Network,
                title: "Sistem Binary Otomatis",
                desc: "Jaringan binary kiri-kanan yang terstruktur dengan auto-placement dan spillover untuk pertumbuhan optimal.",
                gradient: "from-blue-500/10 to-cyan-500/10",
                iconColor: "text-blue-600",
                borderColor: "hover:border-blue-500/30",
              },
              {
                icon: Coins,
                title: "SERACOIN",
                desc: "Mata uang digital internal dari 10% omzet nasional. Tabungan digital yang bisa dijual kapan saja.",
                gradient: "from-amber-500/10 to-orange-500/10",
                iconColor: "text-amber-600",
                borderColor: "hover:border-amber-500/30",
              },
              {
                icon: TrendingUp,
                title: "Dashboard Real-time",
                desc: "Pantau perkembangan jaringan, bonus, PV, dan performa bisnis Anda secara real-time.",
                gradient: "from-emerald-500/10 to-teal-500/10",
                iconColor: "text-emerald-600",
                borderColor: "hover:border-emerald-500/30",
              },
              {
                icon: Shield,
                title: "Keamanan Terjamin",
                desc: "Sistem keamanan berlapis dengan enkripsi data dan audit trail untuk setiap transaksi.",
                gradient: "from-violet-500/10 to-purple-500/10",
                iconColor: "text-violet-600",
                borderColor: "hover:border-violet-500/30",
              },
              {
                icon: Users,
                title: "Manajemen Jaringan",
                desc: "Lihat pohon binary, downline, dan jejak sponsor dengan visualisasi interaktif yang mudah dipahami.",
                gradient: "from-pink-500/10 to-rose-500/10",
                iconColor: "text-pink-600",
                borderColor: "hover:border-pink-500/30",
              },
              {
                icon: Zap,
                title: "Withdrawal Cepat",
                desc: "Proses pencairan bonus cepat dengan dual-approval dari bendahara dan direktur untuk keamanan.",
                gradient: "from-cyan-500/10 to-blue-500/10",
                iconColor: "text-cyan-600",
                borderColor: "hover:border-cyan-500/30",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feature.borderColor}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${feature.gradient}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS                                                       */}
      {/* ================================================================== */}
      <section id="how-it-works" className="relative overflow-hidden bg-muted/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Cara Kerja
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mulai dalam{" "}
              <span className="text-blue-600">3 Langkah Mudah</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Proses bergabung yang simpel dan langsung bisa mulai
              menghasilkan.
            </p>
          </div>

          <div className="relative mt-16">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-linear-to-b from-blue-600/50 via-violet-600/50 to-transparent lg:block" />

            <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Daftar & Aktivasi",
                  desc: "Buat akun, dapatkan PIN aktivasi dari stokis terdekat, dan aktifkan keanggotaan Anda untuk masuk ke jaringan.",
                  color: "from-blue-600 to-blue-700",
                },
                {
                  step: "02",
                  title: "Bangun Jaringan",
                  desc: "Rekrut member baru dan tempatkan di binary tree kiri-kanan Anda. Semakin aktif jaringan, semakin besar potensi bonus.",
                  color: "from-violet-600 to-violet-700",
                },
                {
                  step: "03",
                  title: "Nikmati Bonus",
                  desc: "Terima bonus sponsor, pasangan, matching, SHU, SERACOIN, dan rewards otomatis langsung ke dompet digital Anda.",
                  color: "from-cyan-600 to-cyan-700",
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div
                    className={`relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${item.color} text-xl font-bold text-white shadow-xl`}
                  >
                    {item.step}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BONUS SYSTEM                                                       */}
      {/* ================================================================== */}
      <section id="bonuses" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Sistem Bonus
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-blue-600">6 Jenis Bonus</span> yang
              Menguntungkan
            </h2>
            <p className="mt-4 text-muted-foreground">
              Dapatkan penghasilan dari berbagai jenis bonus dalam 4 plan yang
              saling melengkapi untuk memaksimalkan pendapatan Anda.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Gift,
                title: "Bonus Sponsor",
                percentage: "20%",
                desc: "Dari omzet PV belanja orang yang Anda rekrut langsung. Semakin banyak referral, semakin besar pendapatan.",
                plan: "Plan A",
              },
              {
                icon: Users,
                title: "Bonus Pasangan",
                percentage: "20%",
                desc: "Dari PV pasangan kiri-kanan yang telah terpenuhi. Sistem binary memastikan pertumbuhan seimbang.",
                plan: "Plan A",
              },
              {
                icon: Network,
                title: "Bonus Matching",
                percentage: "20%",
                desc: "Dari bonus pasangan orang yang Anda rekrut langsung. Leverage dari jaringan Anda.",
                plan: "Plan B",
              },
              {
                icon: TrendingUp,
                title: "Bonus SHU",
                percentage: "20%",
                desc: "Dari omzet nasional, dibagi sesuai jumlah SHU yang Anda miliki. Passive income sejati.",
                plan: "Plan C",
              },
              {
                icon: Coins,
                title: "SERACOIN",
                percentage: "10%",
                desc: "Omzet nasional sebagai tabungan coin digital yang bisa dijual. Aset digital masa depan.",
                plan: "Plan C",
              },
              {
                icon: Shield,
                title: "Auto System",
                percentage: "Auto",
                desc: "Bonus otomatis dari perkembangan jaringan binary Anda. Sistem bekerja untuk Anda 24/7.",
                plan: "Plan D",
              },
            ].map((bonus) => (
              <div
                key={bonus.title}
                className="group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                      <bonus.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {bonus.plan}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-semibold">{bonus.title}</h3>
                    </div>
                    <div className="mt-1 text-2xl font-bold text-blue-600">
                      {bonus.percentage}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {bonus.desc}
                  </p>
                </div>
                {/* Bottom accent line */}
                <div className="h-1 w-full bg-linear-to-r from-blue-600 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* REWARDS SHOWCASE                                                   */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-20 sm:py-28 text-white">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-48 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute -left-48 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-4 border-blue-500/30 bg-blue-500/10 text-blue-300"
            >
              <Star className="mr-1.5 h-3.5 w-3.5" />
              Reward Eksklusif
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Raih{" "}
              <span className="bg-linear-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Reward Mewah
              </span>{" "}
              dari Pencapaian Anda
            </h2>
            <p className="mt-4 text-slate-400">
              Selain bonus uang tunai, member berprestasi mendapatkan reward
              non-cash eksklusif berdasarkan rank.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { rank: "Silver", reward: "Smartphone", color: "from-slate-400 to-slate-500" },
              { rank: "Gold", reward: "Motor", color: "from-amber-400 to-amber-600" },
              { rank: "Diamond", reward: "Mobil", color: "from-cyan-300 to-blue-500" },
              { rank: "Crown", reward: "Rumah Mewah", color: "from-violet-400 to-purple-600" },
            ].map((item) => (
              <div
                key={item.rank}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${item.color} shadow-lg`}
                >
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4 text-sm font-medium text-slate-400">
                  Rank
                </div>
                <div className="text-lg font-bold">{item.rank}</div>
                <div className="mt-2 text-sm text-slate-400">Reward</div>
                <div
                  className={`bg-linear-to-r ${item.color} bg-clip-text text-lg font-bold text-transparent`}
                >
                  {item.reward}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA                                                          */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-violet-600 to-purple-700 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20">
            {/* Background pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Siap Memulai Perjalanan Anda?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
                Ribuan member telah membuktikan. Bergabung sekarang dan mulai
                bangun jaringan bisnis Anda bersama Seramart Coin.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-white px-8 text-base font-semibold text-blue-700 shadow-xl hover:bg-blue-50 border-0"
                  asChild
                >
                  <Link href="/register">
                    Daftar Sekarang
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20"
                  asChild
                >
                  <Link href="/login">Sudah Punya Akun?</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER                                                             */}
      {/* ================================================================== */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
                  SC
                </div>
                <span className="text-lg font-bold tracking-tight">
                  Seramart<span className="text-blue-600">Coin</span>
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Platform Multi Level Konsumen dengan sistem binary, bonus berlapis, dan SERACOIN.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold">Platform</h4>
              <ul className="mt-3 space-y-2">
                {["Dashboard", "Jaringan Binary", "Wallet", "Marketplace"].map(
                  (link) => (
                    <li key={link}>
                      <span className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-default">
                        {link}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Perusahaan</h4>
              <ul className="mt-3 space-y-2">
                {["Tentang Kami", "Kebijakan Privasi", "Syarat & Ketentuan", "Hubungi Kami"].map(
                  (link) => (
                    <li key={link}>
                      <span className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-default">
                        {link}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Bantuan</h4>
              <ul className="mt-3 space-y-2">
                {["FAQ", "Panduan Member", "Hubungi Support", "Stokis"].map(
                  (link) => (
                    <li key={link}>
                      <span className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-default">
                        {link}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CV Rolan Karya Pratama. Semua hak
              dilindungi.
            </p>
            <p className="text-xs text-muted-foreground">
              Seramart Coin &mdash; Multi Level Konsumen
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
