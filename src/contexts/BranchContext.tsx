import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { branchesApi, Branch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// ─── MVP Multi-Location Invariants ───────────────────────────────────────────
// 1. selectedBranch = UI filter/view state ONLY. NOT a security boundary.
//    → KHÔNG được dùng selectedBranch để derive authorization scope.
//    → KHÔNG được restrict Teacher/Student dựa trên selectedBranch.
// 2. primaryBranch = Branch có isPrimary = true (Cơ sở chính).
//    → Đọc từ server, không suy luận từ vị trí index (branches[0]).
//    → Dùng cho auto-select trên form tạo lớp, modal chuyển Lead, v.v.
// 3. branches = danh sách active branches toàn hệ thống (global pool).
//    → Admin, Teacher, Student đều thấy toàn bộ danh sách.
// ─────────────────────────────────────────────────────────────────────────────

interface BranchContextType {
  branches: Branch[];
  selectedBranch: string; // 'ALL' hoặc branchId — chỉ là filter UI, không phải security scope
  setSelectedBranch: (branchId: string) => void;
  currentBranch: Branch | null;
  primaryBranch: Branch | null; // Cơ sở chính (isPrimary = true)
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

      // Non-admin không được dùng "ALL" — tự động chọn branch đầu tiên nếu cần.
      // Lưu ý: đây chỉ là UX convenience, không phải security enforcement.
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
    // Non-admin không được chọn ALL (UX convenience, không phải security)
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

  // primaryBranch: đọc từ isPrimary flag, KHÔNG suy luận từ index
  const primaryBranch = useMemo(() => {
    return branches.find((b) => b.isPrimary && b.isActive) || null;
  }, [branches]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        setSelectedBranch,
        currentBranch,
        primaryBranch,
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
