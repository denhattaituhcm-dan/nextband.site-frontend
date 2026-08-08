# 📋 ORPHAN GROUPS PREFLIGHT REPORT

## 1. Minimal Required Scope
- **Total Orphan Groups in System**: 208
- **MINIMUM Required Groups for 36 Missing Questions**: **7**
- **Unnecessary Orphan Groups Filtered Out**: **201**

## 2. Parent Dependency Check
- **Target Section Foreign Key Exists**: **4 / 7**
- **Target Exam Foreign Key Exists**: **4 / 7**
- **Parent Dependency Missing**: **3**

## 3. Classification Summary
- **READY_FOR_INSERT**: 4 (Section & Exam parents exist in Target)
- **NO_HISTORICAL_DEPENDENCY**: 6 (0 student answers in group)
- **HISTORICAL_DEPENDENCY**: 1 (Contains student answers)
- **PARENT_DEPENDENCY_MISSING**: 3

## 4. Governance & Execution Status
- **DATABASE_MUTATIONS**: 0
- **RECOVERY_A**: UNTOUCHED
- **RECOVERY_B1**: ROLLED_BACK
- **STATUS**: READY_FOR_REVIEW
