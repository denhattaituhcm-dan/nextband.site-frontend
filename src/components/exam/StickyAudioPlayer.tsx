import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyAudioPlayerProps {
  audioUrl: string;
  strictMode?: boolean;
}

export function StickyAudioPlayer({ audioUrl, strictMode = false }: StickyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Reset player when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (value: number[]) => {
    if (strictMode || duration === 0) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b transition-all duration-180 shadow-xs",
      isCollapsed ? "py-2 px-4" : "py-3 px-4 md:py-4"
    )}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 md:gap-4">
        {/* Play / Pause Primary CTA */}
        <Button
          onClick={togglePlay}
          className="shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-95 transition-all"
          size="icon"
        >
          {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
        </Button>

        {/* Audio Context Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md shrink-0">
          <Headphones className="h-3.5 w-3.5" />
          <span>Audio Section</span>
        </div>

        {/* Progress Slider Bar */}
        {!isCollapsed && (
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration > 0 ? duration : 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={duration === 0 || strictMode}
              className={cn("flex-1", (strictMode || duration === 0) && "opacity-50 pointer-events-none")}
            />
            <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Mini progress text in collapsed state */}
        {isCollapsed && (
          <div className="flex-1 text-xs font-mono text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}

        {/* Volume Controls & Strict Mode Indicator */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.05}
            onValueChange={handleVolumeChange}
            className="w-16"
          />
        </div>

        {strictMode && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded shrink-0">
            Nghiêm ngặt
          </span>
        )}

        {/* Collapse / Expand Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          title={isCollapsed ? "Mở rộng audio player" : "Thu gọn audio player"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
