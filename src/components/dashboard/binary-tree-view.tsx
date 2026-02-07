"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { User, ChevronDown } from "lucide-react";

interface TreeNode {
  id: number;
  memberId: number;
  position: string | null;
  leftGroupPV: string;
  rightGroupPV: string;
  leftGroupHU: number;
  rightGroupHU: number;
  depth: number;
  member: {
    id: number;
    referralCode: string;
    rank: string;
    personalPV: string;
    accumulatedPV: string;
    isActive: boolean;
    user: { name: string; email: string; image: string | null };
  } | null;
  left: TreeNode | null;
  right: TreeNode | null;
}

const rankColors: Record<string, string> = {
  none: "bg-gray-100 border-gray-300",
  sapphire: "bg-blue-50 border-blue-400",
  emerald: "bg-emerald-50 border-emerald-400",
  bronze: "bg-amber-50 border-amber-400",
  silver: "bg-gray-50 border-gray-400",
  gold: "bg-yellow-50 border-yellow-400",
  diamond: "bg-cyan-50 border-cyan-400",
  crown: "bg-purple-50 border-purple-400",
};

function TreeNodeComponent({ node, level = 0 }: { node: TreeNode; level?: number }) {
  if (!node.member) return null;

  const rank = node.member.rank ?? "none";
  const bgClass = rankColors[rank] ?? "bg-gray-100 border-gray-300";

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`flex flex-col items-center rounded-lg border-2 p-2 transition-shadow hover:shadow-md ${bgClass} min-w-[100px]`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {node.member.user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="mt-1 text-xs font-medium truncate max-w-[90px]">
              {node.member.user.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {node.member.referralCode}
            </span>
            {rank !== "none" && (
              <Badge
                variant="secondary"
                className="mt-1 text-[9px] capitalize px-1 py-0"
              >
                {rank}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <p className="font-semibold">{node.member.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {node.member.user.email}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">PV Pribadi</p>
                <p className="font-medium">{node.member.personalPV}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Akumulasi PV</p>
                <p className="font-medium">{node.member.accumulatedPV}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kiri HU</p>
                <p className="font-medium">{node.leftGroupHU}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kanan HU</p>
                <p className="font-medium">{node.rightGroupHU}</p>
              </div>
            </div>
            <Badge className="capitalize">{rank}</Badge>
            <Badge variant={node.member.isActive ? "default" : "destructive"}>
              {node.member.isActive ? "Aktif" : "Tidak Aktif"}
            </Badge>
          </div>
        </PopoverContent>
      </Popover>

      {/* Children */}
      {(node.left || node.right) && (
        <>
          {/* Connector lines */}
          <div className="flex h-6 w-px border-l-2 border-dashed border-muted-foreground/30" />
          <div className="flex">
            <div className="flex flex-col items-center">
              {node.left && (
                <div className="flex flex-col items-center">
                  <div className="h-px w-12 border-t-2 border-dashed border-muted-foreground/30 self-end" />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              {node.right && (
                <div className="flex flex-col items-center">
                  <div className="h-px w-12 border-t-2 border-dashed border-muted-foreground/30 self-start" />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 md:gap-8">
            <div className="flex flex-col items-center">
              {node.left ? (
                <TreeNodeComponent node={node.left} level={level + 1} />
              ) : (
                <EmptySlot side="Kiri" />
              )}
            </div>
            <div className="flex flex-col items-center">
              {node.right ? (
                <TreeNodeComponent node={node.right} level={level + 1} />
              ) : (
                <EmptySlot side="Kanan" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptySlot({ side }: { side: string }) {
  return (
    <div className="flex min-w-[100px] flex-col items-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-3">
      <User className="h-6 w-6 text-muted-foreground/40" />
      <span className="mt-1 text-[10px] text-muted-foreground/60">
        {side} - Kosong
      </span>
    </div>
  );
}

export function BinaryTreeView({ data }: { data: TreeNode }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[600px] justify-center py-4">
        <TreeNodeComponent node={data} />
      </div>
    </div>
  );
}
