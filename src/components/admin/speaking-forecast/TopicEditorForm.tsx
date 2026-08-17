import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ForecastTopic,
  Season,
  SpeakingPart,
  TopicType,
  TopicStatus,
  VocabularyItem,
  AudioSample,
} from './types';
import { SampleAudioUpload } from './SampleAudioUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Plus,
  Trash2,
  Sparkles,
  Search,
  Globe,
  Layers,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Save,
  Send,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TopicEditorFormProps {
  initialTopic?: ForecastTopic;
  seasons: Season[];
  defaultSeasonId?: string;
  onSave: (data: Omit<ForecastTopic, 'id' | 'updatedAt'>) => void;
  mode: 'create' | 'edit';
}

export const TopicEditorForm: React.FC<TopicEditorFormProps> = ({
  initialTopic,
  seasons,
  defaultSeasonId,
  onSave,
  mode,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Basic Info State
  const [seasonId, setSeasonId] = useState<string>(
    initialTopic?.seasonId || defaultSeasonId || seasons[0]?.id || ''
  );
  const [topicName, setTopicName] = useState<string>(initialTopic?.topicName || '');
  const [category, setCategory] = useState<string>(initialTopic?.category || '');
  const [part, setPart] = useState<SpeakingPart>(initialTopic?.part || 'Part 1');
  const [type, setType] = useState<TopicType>(initialTopic?.type || 'New');
  const [status, setStatus] = useState<TopicStatus>(initialTopic?.status || 'Draft');

  // Question Content State
  const [questions, setQuestions] = useState<string[]>(
    initialTopic?.questions && initialTopic.questions.length > 0
      ? initialTopic.questions
      : ['']
  );
  const [cueCardPrompt, setCueCardPrompt] = useState<string>(
    initialTopic?.cueCardPrompt || ''
  );
  const [cueCardBulletPoints, setCueCardBulletPoints] = useState<string[]>(
    initialTopic?.cueCardBulletPoints && initialTopic.cueCardBulletPoints.length > 0
      ? initialTopic.cueCardBulletPoints
      : ['']
  );

  // Learning Content State
  const [sampleAnswerBand65, setSampleAnswerBand65] = useState<string>(() => {
    const sa = initialTopic?.sampleAnswers as any;
    if (sa?.band65 !== undefined) return sa.band65;
    if (sa?.band80 !== undefined && sa?.band75 !== undefined) return sa.band75;
    return '';
  });
  const [sampleAnswerBand75, setSampleAnswerBand75] = useState<string>(() => {
    const sa = initialTopic?.sampleAnswers as any;
    if (sa?.band65 !== undefined && sa?.band75 !== undefined) return sa.band75;
    if (sa?.band80 !== undefined) return sa.band80;
    if (sa?.band75 !== undefined) return sa.band75;
    return '';
  });
  const [sampleAnswerBand65Audio, setSampleAnswerBand65Audio] = useState<AudioSample | null>(() => {
    return initialTopic?.sampleAnswers?.band65Audio || null;
  });
  const [sampleAnswerBand75Audio, setSampleAnswerBand75Audio] = useState<AudioSample | null>(() => {
    return initialTopic?.sampleAnswers?.band75Audio || null;
  });
  const [keyVocabulary, setKeyVocabulary] = useState<VocabularyItem[]>(
    initialTopic?.keyVocabulary || []
  );
  const [ideas, setIdeas] = useState<string>(initialTopic?.ideas || '');

  // SEO State
  const [seoTitle, setSeoTitle] = useState<string>(initialTopic?.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState<string>(
    initialTopic?.metaDescription || ''
  );
  const [slug, setSlug] = useState<string>(initialTopic?.slug || '');

  // Auto slugify helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-fill SEO slug & title if creating new topic
  useEffect(() => {
    if (mode === 'create' && topicName) {
      const selectedSeason = seasons.find((s) => s.id === seasonId);
      const seasonPrefix = selectedSeason ? selectedSeason.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'season';
      const partPrefix = part.toLowerCase().replace(/\s+/g, '');
      const topicSlug = slugify(topicName);
      
      if (!slug || slug.startsWith(seasonPrefix)) {
        setSlug(`${seasonPrefix}-${partPrefix}-${topicSlug}`);
      }
      if (!seoTitle) {
        setSeoTitle(`IELTS Speaking Forecast ${selectedSeason?.name || ''} - ${topicName}`);
      }
    }
  }, [topicName, part, seasonId, mode, seasons]);

  // Questions handlers (Part 1 & Part 3)
  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    const updated = [...questions];
    updated[index] = val;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      setQuestions(['']);
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Cue card bullet points handlers (Part 2)
  const handleAddBulletPoint = () => {
    setCueCardBulletPoints([...cueCardBulletPoints, '']);
  };

  const handleUpdateBulletPoint = (index: number, val: string) => {
    const updated = [...cueCardBulletPoints];
    updated[index] = val;
    setCueCardBulletPoints(updated);
  };

  const handleRemoveBulletPoint = (index: number) => {
    if (cueCardBulletPoints.length === 1) {
      setCueCardBulletPoints(['']);
      return;
    }
    setCueCardBulletPoints(cueCardBulletPoints.filter((_, i) => i !== index));
  };

  // Vocabulary handlers
  const handleAddVocabulary = () => {
    const newItem: VocabularyItem = {
      id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      word: '',
      meaning: '',
      example: '',
    };
    setKeyVocabulary([...keyVocabulary, newItem]);
  };

  const handleUpdateVocabulary = (
    id: string,
    field: keyof VocabularyItem,
    value: string
  ) => {
    setKeyVocabulary(
      keyVocabulary.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVocabulary = (id: string) => {
    setKeyVocabulary(keyVocabulary.filter((v) => v.id !== id));
  };

  // Submit handler
  const handleSubmit = (finalStatus: TopicStatus) => {
    if (!topicName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a Topic Name.',
        variant: 'destructive',
      });
      return;
    }

    const payload: Omit<ForecastTopic, 'id' | 'updatedAt'> = {
      seasonId,
      topicName: topicName.trim(),
      category: category.trim() || 'General',
      part,
      type,
      status: finalStatus,
      sampleAnswers: {
        band65: sampleAnswerBand65,
        band75: sampleAnswerBand75,
        band65Audio: sampleAnswerBand65Audio,
        band75Audio: sampleAnswerBand75Audio,
      },
      keyVocabulary: keyVocabulary.filter((v) => v.word.trim() || v.meaning.trim()),
      ideas,
      seoTitle: seoTitle.trim() || topicName,
      metaDescription: metaDescription.trim(),
      slug: slug.trim() || slugify(topicName),
    };

    if (part === 'Part 2') {
      payload.cueCardPrompt = cueCardPrompt.trim();
      payload.cueCardBulletPoints = cueCardBulletPoints.filter((b) => b.trim());
    } else {
      payload.questions = questions.filter((q) => q.trim());
    }

    onSave(payload);
    toast({
      title: finalStatus === 'Published' ? 'Topic Published' : 'Draft Saved',
      description: `"${topicName}" has been successfully saved.`,
    });
    navigate('/admin/speaking-forecast');
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/speaking-forecast')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'create' ? 'Add New Topic' : `Edit Topic: ${topicName || 'Untitled'}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure IELTS Speaking questions, sample responses, key vocabulary, and SEO metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              status === 'Published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1'
                : 'bg-amber-50 text-amber-700 border-amber-200 text-xs px-2.5 py-1'
            }
          >
            {status === 'Published' ? 'Status: Published' : 'Status: Draft'}
          </Badge>
        </div>
      </div>

      {/* SECTION 1: BASIC INFORMATION */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            1. Basic Information
          </CardTitle>
          <CardDescription className="text-xs">
            Core properties of the forecast topic.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Season Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Season</Label>
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speaking Part Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part</Label>
              <Select
                value={part}
                onValueChange={(val) => setPart(val as SpeakingPart)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Part 1">Part 1 (Short Q&A)</SelectItem>
                  <SelectItem value="Part 2">Part 2 (Cue Card)</SelectItem>
                  <SelectItem value="Part 3">Part 3 (Discussion)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Topic Type (New vs Retained) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Forecast Type</Label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as TopicType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">✨ New Topic</SelectItem>
                  <SelectItem value="Retained">🔄 Retained (50% từ quý cũ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Topic Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">
                Topic Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Robots & Automation, A memorable journey..."
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="h-9 font-medium"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Input
                placeholder="e.g. Technology, Education, Travel..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: QUESTION CONTENT */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                2. Question Content ({part})
              </CardTitle>
              <CardDescription className="text-xs">
                {part === 'Part 1' && 'List of warm-up questions asked by the examiner.'}
                {part === 'Part 2' && 'Cue card topic and bullet points prompting the 2-minute speech.'}
                {part === 'Part 3' && 'In-depth analytical and abstract discussion questions.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* If Part 1 or Part 3: Questions list */}
          {part !== 'Part 2' && (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-7 text-right">
                    Q{idx + 1}.
                  </span>
                  <Input
                    placeholder={`Enter ${part} question ${idx + 1}...`}
                    value={q}
                    onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                    className="h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                className="gap-1.5 text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Question
              </Button>
            </div>
          )}

          {/* If Part 2: Cue Card Prompt + Bullet Points */}
          {part === 'Part 2' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cue Card Prompt</Label>
                <Textarea
                  placeholder="Describe a memorable journey you made by public transport..."
                  value={cueCardPrompt}
                  onChange={(e) => setCueCardPrompt(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold text-muted-foreground block">
                  You should say: (Bullet points)
                </Label>
                {cueCardBulletPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4 text-center">•</span>
                    <Input
                      placeholder={`e.g. Where you went / Who you traveled with...`}
                      value={point}
                      onChange={(e) => handleUpdateBulletPoint(idx, e.target.value)}
                      className="h-9 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveBulletPoint(idx)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBulletPoint}
                  className="gap-1.5 text-xs mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Bullet Point
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: LEARNING CONTENT */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            3. Learning Content
          </CardTitle>
          <CardDescription className="text-xs">
            Sample answers for different bands, key vocabulary list, and idea brainstorming.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {/* Sample Answers Tabs (Band 6.5 & Band 7.5 ★) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold block">Sample Answers</Label>
            <Tabs defaultValue="band65" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[280px] h-8">
                <TabsTrigger value="band65" className="text-xs">
                  Band 6.5
                </TabsTrigger>
                <TabsTrigger value="band75" className="text-xs">
                  Band 7.5 ★
                </TabsTrigger>
              </TabsList>

              <TabsContent value="band65" className="mt-3 space-y-3">
                <div className="rounded-md border">
                  <RichTextEditor
                    value={sampleAnswerBand65}
                    onChange={setSampleAnswerBand65}
                    placeholder="Enter Band 6.5 model response (mục tiêu trung cấp khá)..."
                    minHeight={160}
                  />
                </div>
                <SampleAudioUpload
                  value={sampleAnswerBand65Audio}
                  onChange={setSampleAnswerBand65Audio}
                  bandLabel="Band 6.5"
                />
              </TabsContent>

              <TabsContent value="band75" className="mt-3 space-y-3">
                <div className="rounded-md border">
                  <RichTextEditor
                    value={sampleAnswerBand75}
                    onChange={setSampleAnswerBand75}
                    placeholder="Enter Band 7.5 ★ target model response (mục tiêu nâng cao / target)..."
                    minHeight={160}
                  />
                </div>
                <SampleAudioUpload
                  value={sampleAnswerBand75Audio}
                  onChange={setSampleAnswerBand75Audio}
                  bandLabel="Band 7.5 ★"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Key Vocabulary Table */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold block">Key Vocabulary & Collocations</Label>
                <span className="text-[11px] text-muted-foreground">
                  High-yield vocabulary items with definitions and illustrative examples.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVocabulary}
                className="gap-1 text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Vocabulary
              </Button>
            </div>

            {keyVocabulary.length === 0 ? (
              <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                No vocabulary items added yet. Click &quot;Add Vocabulary&quot; to build the wordlist for this topic.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                  <div className="col-span-3">Word / Phrase</div>
                  <div className="col-span-4">Meaning</div>
                  <div className="col-span-4">Example Sentence</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {keyVocabulary.map((vocab) => (
                  <div key={vocab.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-3">
                      <Input
                        placeholder="e.g. Streamline"
                        value={vocab.word}
                        onChange={(e) =>
                          handleUpdateVocabulary(vocab.id, 'word', e.target.value)
                        }
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="e.g. To make a process more efficient"
                        value={vocab.meaning}
                        onChange={(e) =>
                          handleUpdateVocabulary(vocab.id, 'meaning', e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="e.g. Automated tools streamline workflows."
                        value={vocab.example}
                        onChange={(e) =>
                          handleUpdateVocabulary(vocab.id, 'example', e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVocabulary(vocab.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ideas & Mindmap */}
          <div className="space-y-1.5 pt-2 border-t">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Ideas & Outline Notes
            </Label>
            <Textarea
              placeholder="Jot down brainstorming points, pros/cons, or mindmap keywords for teachers and students..."
              value={ideas}
              onChange={(e) => setIdeas(e.target.value)}
              rows={4}
              className="text-xs font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: SEO */}
      <Card className="border shadow-none bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            4. Search Engine Optimization (SEO)
          </CardTitle>
          <CardDescription className="text-xs">
            Meta tags and Google search appearance preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">SEO Title</Label>
              <Input
                placeholder="e.g. IELTS Speaking Forecast Q3/2026 - Topic: Robots"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL Slug</Label>
              <Input
                placeholder="q3-2026-part1-robots"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Meta Description</Label>
            <Textarea
              placeholder="Brief summary displayed in Google search results (120-160 characters)..."
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Google Search Preview Box */}
          <div className="mt-3 p-4 bg-muted/30 rounded-lg border">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Google Search Preview
            </span>
            <div className="space-y-1">
              <div className="text-xs text-slate-600 truncate">
                nextband.site &rsaquo; ielts-speaking-forecast &rsaquo; {slug || 'topic-slug'}
              </div>
              <div className="text-base text-blue-700 hover:underline cursor-pointer font-medium line-clamp-1">
                {seoTitle || topicName || 'IELTS Speaking Forecast Topic'}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2">
                {metaDescription ||
                  'Tổng hợp bộ đề IELTS Speaking Forecast mới nhất kèm bài mẫu Band 7.5 ★, từ vựng ăn điểm và gợi ý dàn ý chi tiết.'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5: PUBLISHING & STICKY FOOTER */}
      <div className="sticky bottom-4 z-10 p-4 bg-card/95 backdrop-blur border rounded-lg shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as TopicStatus)}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/speaking-forecast')}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit('Draft')}
            className="text-xs h-9 gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit('Published')}
            className="text-xs h-9 font-semibold gap-1.5"
          >
            {mode === 'edit' && initialTopic?.status === 'Published' ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save Changes
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Publish Topic
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
