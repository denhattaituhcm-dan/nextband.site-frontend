import React, { useRef, useState, useEffect } from 'react';
import { AudioSample } from './types';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Trash2,
  RefreshCw,
  FileAudio,
  Play,
  Pause,
  AlertCircle,
  Clock,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';

interface SampleAudioUploadProps {
  value?: AudioSample | null;
  onChange: (audio: AudioSample | null) => void;
  disabled?: boolean;
  bandLabel?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];
const ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
];

export const formatDuration = (totalSeconds?: number): string => {
  if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const SampleAudioUpload: React.FC<SampleAudioUploadProps> = ({
  value,
  onChange,
  disabled = false,
  bandLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(value?.duration || 0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync duration if value changes externally
  useEffect(() => {
    if (value?.duration && !duration) {
      setDuration(value.duration);
    }
  }, [value?.duration, duration]);

  // Cleanup object URL on unmount if it was a created blob URL
  const currentBlobUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (value?.fileUrl?.startsWith('blob:')) {
      currentBlobUrlRef.current = value.fileUrl;
    } else {
      currentBlobUrlRef.current = null;
    }
  }, [value?.fileUrl]);

  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  const handleOpenPicker = () => {
    if (disabled) return;
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // 1. Validate File Format
    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isMimeValid = file.type.startsWith('audio/') || ACCEPTED_MIME_TYPES.includes(file.type);
    const isExtValid = ACCEPTED_EXTENSIONS.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      const err = 'Unsupported format. Supported formats: .mp3, .wav, .m4a, .webm, .ogg';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    // 2. Validate File Size (< 10 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const err = `File too large (${formatFileSize(file.size)}). Maximum size is 10 MB.`;
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setErrorMsg(null);

    // Stop current audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }

    // Clean up previous blob URL if replacing
    if (value?.fileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.fileUrl);
    }

    // Create object URL for local mock preview
    const blobUrl = URL.createObjectURL(file);

    // Detect duration using temporary Audio instance
    const tempAudio = new Audio(blobUrl);
    tempAudio.onloadedmetadata = () => {
      const detectedDuration = Math.round(tempAudio.duration) || 0;
      setDuration(detectedDuration);
      onChange({
        fileName: file.name,
        fileUrl: blobUrl,
        duration: detectedDuration,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      });
      toast.success(`Uploaded ${file.name}`);
    };

    tempAudio.onerror = () => {
      // Fallback if metadata fails
      onChange({
        fileName: file.name,
        fileUrl: blobUrl,
        fileSize: file.size,
        duration: 0,
        uploadedAt: new Date().toISOString(),
      });
      toast.success(`Uploaded ${file.name}`);
    };
  };

  const handleRemove = () => {
    if (disabled) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (value?.fileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.fileUrl);
    }

    onChange(null);
    toast.info('Audio sample removed');
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !value?.fileUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Audio play error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.round(audioRef.current.currentTime));
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = Math.round(audioRef.current.duration) || 0;
      if (dur > 0 && dur !== duration) {
        setDuration(dur);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  return (
    <div className="space-y-2 pt-3 border-t border-border/60">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
        className="hidden"
        disabled={disabled}
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileAudio className="h-3.5 w-3.5 text-primary" />
          Audio Sample {bandLabel ? `(${bandLabel})` : ''}
        </label>
        {value && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Ready for preview
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CASE 1: No Audio Uploaded */}
      {!value ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-colors hover:bg-muted/30">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              No audio uploaded.
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Supported formats: MP3, WAV, M4A, WEBM, OGG (Max 10 MB).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenPicker}
            disabled={disabled}
            className="text-xs font-semibold h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            + Upload Audio
          </Button>
        </div>
      ) : (
        /* CASE 2: Audio Uploaded - Preview Card */
        <div className="rounded-lg border bg-card p-3.5 space-y-3 shadow-2xs">
          {/* Audio HTML element (hidden controller) */}
          <audio
            ref={audioRef}
            src={value.fileUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleAudioEnded}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          />

          {/* File Metadata & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileAudio className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate max-w-[280px] sm:max-w-md" title={value.fileName}>
                  {value.fileName}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" />
                    Duration: {formatDuration(duration || value.duration)}
                  </span>
                  {value.fileSize && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(value.fileSize)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Replace & Remove */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenPicker}
                disabled={disabled}
                className="h-7 px-2.5 text-xs gap-1"
                title="Thay đổi file audio"
              >
                <RefreshCw className="h-3 w-3" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="h-7 px-2.5 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Xóa audio"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>

          {/* Audio Player Controls */}
          <div className="flex items-center gap-3 pt-2 border-t bg-muted/20 p-2 rounded-md">
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={togglePlayPause}
              className="h-7 w-7 rounded-full shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </Button>

            <span className="text-[11px] font-mono text-muted-foreground min-w-[35px] text-right">
              {formatDuration(currentTime)}
            </span>

            <input
              type="range"
              min={0}
              max={duration || value.duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <span className="text-[11px] font-mono text-muted-foreground min-w-[35px]">
              {formatDuration(duration || value.duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
