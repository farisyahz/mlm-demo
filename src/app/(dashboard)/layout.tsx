import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { memberProfiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import { DashboardHeader } from "~/components/dashboard/dashboard-header";
import { Toaster } from "~/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has a member profile
  const profile = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/register");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          user={session.user}
          role={profile.role}
          rank={profile.rank}
        />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={session.user} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
