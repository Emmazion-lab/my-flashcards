import { cn } from "@/lib/utils";
import { useSpeech } from "../hooks/useSpeech";

interface SpeakButtonProps {
  text: string;
  className?: string;
  "data-ocid"?: string;
}

export function SpeakButton({
  text,
  className,
  "data-ocid": dataOcid,
}: SpeakButtonProps) {
  const { speak, isSpeaking, isSupported } = useSpeech();

  if (!isSupported) return null;

  return (
    <button
      type="button"
      aria-label={`Pronounce in French: ${text}`}
      data-ocid={dataOcid}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "h-8 w-8 shrink-0",
        "border border-border/60 bg-card",
        "text-muted-foreground hover:text-primary hover:border-primary/50",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        isSpeaking && "text-primary border-primary bg-primary/10 scale-110",
        className,
      )}
    >
      {isSpeaking ? (
        // Animated sound waves icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse" />
          <path
            d="M19.07 4.93a10 10 0 0 1 0 14.14"
            className="animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
        </svg>
      ) : (
        // Static speaker icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
