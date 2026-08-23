import React from "react";
import { Building2, Check, ChevronDown, MapPin, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/contexts/BranchContext";

export function BranchSwitcher() {
  const {
    branches,
    selectedBranch,
    setSelectedBranch,
    currentBranch,
    canSelectAll,
    isLoading,
  } = useBranch();

  if (isLoading && branches.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md animate-pulse">
        <Building2 className="h-3.5 w-3.5" />
        <span>Đang tải cơ sở...</span>
      </div>
    );
  }

  // Label to display on trigger button
  const displayLabel = selectedBranch === "ALL" 
    ? "Tất cả chi nhánh" 
    : currentBranch?.name || "Chọn chi nhánh";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-background/80 font-normal hover:bg-muted border-primary/20 text-xs sm:text-sm"
        >
          {selectedBranch === "ALL" ? (
            <Layers className="h-3.5 w-3.5 text-primary" />
          ) : (
            <MapPin className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="font-medium max-w-[140px] truncate">{displayLabel}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 shadow-lg">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Phạm vi quản lý
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {canSelectAll && (
          <>
            <DropdownMenuItem
              onClick={() => setSelectedBranch("ALL")}
              className="flex items-center justify-between cursor-pointer py-2"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Tất cả chi nhánh</span>
              </div>
              {selectedBranch === "ALL" && (
                <Check className="h-4 w-4 text-primary font-bold" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {branches.length === 0 ? (
          <div className="py-2 px-3 text-xs text-muted-foreground text-center">
            Chưa có chi nhánh nào
          </div>
        ) : (
          branches.map((branch) => {
            const isSelected = selectedBranch === branch.id;
            return (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className="flex items-center justify-between cursor-pointer py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {branch.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {branch.code}
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary font-bold" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
