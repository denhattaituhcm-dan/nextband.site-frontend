import React, { useState } from 'react';
import { ForecastTopic } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  FileQuestion,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopicTableProps {
  topics: ForecastTopic[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TopicTable: React.FC<TopicTableProps> = ({
  topics,
  onDuplicate,
  onDelete,
}) => {
  const [topicToDelete, setTopicToDelete] = useState<ForecastTopic | null>(null);
  const [sortField, setSortField] = useState<'topicName' | 'updatedAt' | 'part'>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: 'topicName' | 'updatedAt' | 'part') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTopics = [...topics].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'topicName') {
      comparison = a.topicName.localeCompare(b.topicName);
    } else if (sortField === 'part') {
      comparison = a.part.localeCompare(b.part);
    } else {
      comparison = a.updatedAt.localeCompare(b.updatedAt);
    }
    return sortAsc ? comparison : -comparison;
  });

  const getPartBadge = (part: string) => {
    switch (part) {
      case 'Part 1':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Part 1
          </span>
        );
      case 'Part 2':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Part 2
          </span>
        );
      case 'Part 3':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Part 3
          </span>
        );
      default:
        return <Badge variant="outline">{part}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'New') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-300">
          <Sparkles className="h-3 w-3 text-emerald-600" />
          New
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        Retained
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Published') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Draft
      </span>
    );
  };

  return (
    <>
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead
                className="cursor-pointer font-semibold"
                onClick={() => handleSort('topicName')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Topic</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer font-semibold w-[100px]"
                onClick={() => handleSort('part')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Part</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold w-[110px]">Type</TableHead>
              <TableHead className="font-semibold w-[110px]">Status</TableHead>
              <TableHead
                className="cursor-pointer font-semibold w-[130px]"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Last Updated</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTopics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileQuestion className="h-8 w-8 text-muted-foreground/40" />
                    <p className="font-medium text-sm">No topics found matching your criteria</p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing some filters or create a new topic.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedTopics.map((topic) => (
                <TableRow key={topic.id} className="hover:bg-muted/30 transition-colors">
                  {/* Topic name and quick question preview */}
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <Link
                        to={`/admin/speaking-forecast/${topic.id}/edit`}
                        className="font-semibold text-foreground hover:text-primary transition-colors block line-clamp-1"
                      >
                        {topic.topicName}
                      </Link>
                      {topic.part === 'Part 2' && topic.cueCardPrompt ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {topic.cueCardPrompt}
                        </p>
                      ) : topic.questions && topic.questions.length > 0 ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {topic.questions[0]} ({topic.questions.length} questions)
                        </p>
                      ) : null}
                    </div>
                  </TableCell>

                  {/* Part */}
                  <TableCell>{getPartBadge(topic.part)}</TableCell>

                  {/* Category */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded">
                      {topic.category || 'General'}
                    </span>
                  </TableCell>

                  {/* Type */}
                  <TableCell>{getTypeBadge(topic.type)}</TableCell>

                  {/* Status */}
                  <TableCell>{getStatusBadge(topic.status)}</TableCell>

                  {/* Last Updated */}
                  <TableCell className="text-xs text-muted-foreground">
                    {topic.updatedAt}
                  </TableCell>

                  {/* Actions dropdown */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/admin/speaking-forecast/${topic.id}/edit`}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDuplicate(topic.id)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setTopicToDelete(topic)}
                          className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!topicToDelete} onOpenChange={() => setTopicToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete topic{' '}
              <strong className="text-foreground">{topicToDelete?.topicName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (topicToDelete) {
                  onDelete(topicToDelete.id);
                  setTopicToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
