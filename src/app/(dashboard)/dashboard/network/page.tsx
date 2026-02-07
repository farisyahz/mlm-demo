"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { BinaryTreeView } from "~/components/dashboard/binary-tree-view";

export default function NetworkPage() {
  const { data: treeData, isLoading } = api.tree.getMyTree.useQuery({
    depth: 5,
  });
  const { data: stats } = api.tree.getNetworkStats.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Jaringan Binary</h1>

      {/* Network Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kiri (HU)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.leftGroupHU ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              PV: {Number(stats?.leftGroupPV ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kanan (HU)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.rightGroupHU ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              PV: {Number(stats?.rightGroupPV ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total HU</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalGroupHU ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kedalaman</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.depth ?? 0}</p>
            <p className="text-xs text-muted-foreground">Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Tree Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Diagram Jaringan</CardTitle>
          <CardDescription>
            Klik pada node untuk melihat detail member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : treeData ? (
            <BinaryTreeView data={treeData} />
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Belum ada jaringan. Ajak teman bergabung melalui link referral Anda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
