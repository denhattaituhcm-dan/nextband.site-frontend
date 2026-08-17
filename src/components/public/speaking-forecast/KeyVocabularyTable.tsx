import React from 'react';
import { VocabularyItem } from '@/services/forecast';
import { BookOpen } from 'lucide-react';

interface KeyVocabularyTableProps {
  vocabulary: VocabularyItem[];
}

export const KeyVocabularyTable: React.FC<KeyVocabularyTableProps> = ({ vocabulary }) => {
  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
          <BookOpen className="h-4 w-4" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          Từ vựng &amp; Collocations ăn điểm (Key Vocabulary)
        </h3>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/80 text-muted-foreground font-bold">
                <th className="py-3 px-4 w-[28%] min-w-[140px]">Từ / Cụm từ</th>
                <th className="py-3 px-4 w-[34%] min-w-[160px]">Giải nghĩa</th>
                <th className="py-3 px-4 w-[38%] min-w-[200px]">Ví dụ trong ngữ cảnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {vocabulary.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-primary align-top">
                    {item.word}
                  </td>
                  <td className="py-3.5 px-4 text-foreground/90 align-top leading-relaxed">
                    {item.meaning}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground italic align-top leading-relaxed">
                    “{item.example}”
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
