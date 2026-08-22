import { useState, useRef, useCallback, useEffect } from "react";

const HARD_RECORDER_CAP_SECONDS = 300; // 5-minute defense-in-depth safety cap

interface UseSpeakingRecorderOptions {
  maxDurationSeconds?: number;
  onAudioReady?: (blob: Blob, localUrl: string) => void;
}

export function useSpeakingRecorder(options?: UseSpeakingRecorderOptions | ((blob: Blob, audioUrl: string) => void)) {
  const normalizedOptions: UseSpeakingRecorderOptions =
    typeof options === "function" ? { onAudioReady: options } : options || {};

  const { maxDurationSeconds = 120, onAudioReady } = normalizedOptions;
  const effectiveMaxSeconds = Math.min(maxDurationSeconds, HARD_RECORDER_CAP_SECONDS);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAutoStopped, setIsAutoStopped] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Safe failover
      }
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setIsAutoStopped(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Select optimal available MIME type
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000, // 32 kbps voice optimization target
      };

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mimeType || "audio/webm";
        const finalBlob = new Blob(chunksRef.current, { type: finalType });
        const localUrl = URL.createObjectURL(finalBlob);
        setAudioBlob(finalBlob);
        setAudioUrl(localUrl);
        onAudioReady?.(finalBlob, localUrl);

        // Stop and release audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Collect audio chunks every 1000ms
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          const next = prev + 1;
          if (next >= effectiveMaxSeconds) {
            setIsAutoStopped(true);
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
              }
              setIsRecording(false);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }, 0);
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone permission error:", err);
      setPermissionError("Không thể truy cập Microphone. Vui lòng cấp quyền micro trong trình duyệt để thu âm.");
    }
  }, [effectiveMaxSeconds, onAudioReady]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordSeconds(0);
    setIsAutoStopped(false);
    setIsRecording(false);
    chunksRef.current = [];
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const minutes = Math.floor(recordSeconds / 60);
  const seconds = recordSeconds % 60;
  const formattedRecordTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const remaining = Math.max(0, effectiveMaxSeconds - recordSeconds);
  const remMinutes = Math.floor(remaining / 60);
  const remSeconds = remaining % 60;
  const formattedRemainingTime = `${String(remMinutes).padStart(2, "0")}:${String(remSeconds).padStart(2, "0")}`;

  return {
    isRecording,
    recordSeconds,
    remainingSeconds: remaining,
    formattedRecordTime,
    formattedRemainingTime,
    maxDurationSeconds: effectiveMaxSeconds,
    isAutoStopped,
    audioUrl,
    audioBlob,
    permissionError,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
