import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface EssayControlProps {
  questionId: string;
  value: string;
  onChange: (questionId: string, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EssayControl({
  questionId,
  value,
  onChange,
  placeholder = "Nhập câu trả lời của bạn...",
  disabled = false,
}: EssayControlProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(questionId, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-background p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary shadow-xs font-medium leading-relaxed transition-all resize-y min-h-[100px]"
      />
    </div>
  );
}
