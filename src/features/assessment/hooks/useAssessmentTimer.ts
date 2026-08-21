import { useState, useEffect, useRef } from "react";

export function useAssessmentTimer(initialSeconds: number = 2700, onTimeUp?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onTimeUpRef.current?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            onTimeUpRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSeconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  const isUrgent = secondsLeft < 300 && secondsLeft > 0; // Less than 5 minutes

  return {
    secondsLeft,
    formattedTime,
    isUrgent,
    isTimeUp: secondsLeft <= 0,
  };
}
