import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  data: Uint8Array | null;
  isRecording: boolean;
  className?: string;
}

export function AudioWaveform({ data, isRecording, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Background rounded container fill
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, 'rgba(254, 242, 242, 0.9)'); // crimson-50 soft tint
      bgGradient.addColorStop(1, 'rgba(254, 226, 226, 0.6)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle center baseline
      ctx.strokeStyle = 'rgba(192, 0, 0, 0.2)'; // brand-crimson/20
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      if (!isRecording) {
        return;
      }

      // Render vertical audio visualizer bars
      const numBars = 36;
      const barGap = 4;
      const totalBarWidth = width - (numBars + 1) * barGap;
      const barWidth = Math.max(3, totalBarWidth / numBars);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#C00000'); // Brand Crimson
      gradient.addColorStop(1, '#990000');
      ctx.fillStyle = gradient;

      step += 0.15;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;

        if (data && data.length > 0) {
          const dataIndex = Math.floor((i / numBars) * data.length);
          const rawVal = data[dataIndex] || 0;
          barHeight = (rawVal / 255) * (height * 0.75);
        }

        // Ambient idle animation fallback if volume is low so it never looks frozen
        if (barHeight < 6) {
          barHeight = Math.sin(step + i * 0.4) * 5 + 6;
        }

        barHeight = Math.min(height - 8, Math.max(4, barHeight));

        const x = barGap + i * (barWidth + barGap);
        const y = centerY - barHeight / 2;
        const borderRadius = Math.min(barWidth / 2, 3);

        // Draw rounded rectangle bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, borderRadius);
        ctx.fill();
      }

      if (isRecording) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [data, isRecording]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-orange-200/80 shadow-inner ${className}`}>
      <canvas
        ref={canvasRef}
        width={500}
        height={64}
        className="w-full h-full block"
      />
    </div>
  );
}
