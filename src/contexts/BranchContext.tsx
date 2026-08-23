import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { branchesApi, Branch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface BranchContextType {
  branches: Branch[];
  selectedBranch: string; // 'ALL' or branchId
  setSelectedBranch: (branchId: string) => void;
  currentBranch: Branch | null;
  isLoading: boolean;
  canSelectAll: boolean;
  refetchBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = "aris_admin_selected_branch";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranchState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    }
    return "ALL";
  });

  const loadBranches = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await branchesApi.list();
      setBranches(data);

      // Rule: Nếu không phải Admin và selectedBranch đang là 'ALL', tự động chuyển sang branch đầu tiên
      if (!isAdmin && selectedBranch === "ALL" && data.length > 0) {
        setSelectedBranchState(data[0].id);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, data[0].id);
        }
      }
    } catch (err) {
      console.warn("[BranchContext] Failed to load branches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [isAuthenticated, user?.id]);

  const setSelectedBranch = (branchId: string) => {
    // Non-admin cannot select ALL
    if (!isAdmin && branchId === "ALL") {
      if (branches.length > 0) {
        branchId = branches[0].id;
      }
    }
    setSelectedBranchState(branchId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, branchId);
    }
  };

  const currentBranch = useMemo(() => {
    if (selectedBranch === "ALL") return null;
    return branches.find((b) => b.id === selectedBranch) || null;
  }, [selectedBranch, branches]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        setSelectedBranch,
        currentBranch,
        isLoading,
        canSelectAll: isAdmin,
        refetchBranches: loadBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
