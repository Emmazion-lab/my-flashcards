import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, ClipboardCopy, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "../components/AppHeader";
import { useTranslateText } from "../hooks/useQueries";

interface TranslationResult {
  translation: string;
  exampleSentence: string;
  usageTip: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy to clipboard"
      data-ocid="translator.copy_button"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <ClipboardCopy className="h-4 w-4" />
      )}
    </button>
  );
}

function ResultCard({
  label,
  value,
  ocid,
  highlight = false,
}: {
  label: string;
  value: string;
  ocid: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-1",
        highlight ? "bg-primary/5 border-primary/30" : "bg-card border-border",
      )}
      data-ocid={ocid}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <CopyButton text={value} />
      </div>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

export function TranslatorPage() {
  const [frenchText, setFrenchText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translateMutation = useTranslateText();

  const handleTranslate = () => {
    if (!frenchText.trim()) {
      toast.error("Please enter some French text to translate.");
      return;
    }
    setError(null);
    setResult(null);
    translateMutation.mutate(
      { frenchText: frenchText.trim() },
      {
        onSuccess: (data) => {
          setResult(data);
        },
        onError: (err) => {
          setError(err.message || "Translation failed. Please try again.");
        },
      },
    );
  };

  const handleClear = () => {
    setFrenchText("");
    setResult(null);
    setError(null);
    translateMutation.reset();
  };

  const isPending = translateMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-8">
      <AppHeader />
      {/* Page header */}
      <div className="bg-card border-b px-4 sm:px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">
                AI Translator
              </h1>
              <p className="text-xs text-muted-foreground">
                Get English translation, example sentence, and usage tips for
                any French word or phrase.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Input section */}
        <div className="space-y-2">
          <Label
            htmlFor="french-input"
            className="text-sm font-medium text-foreground"
          >
            French word or phrase
          </Label>
          <Textarea
            id="french-input"
            value={frenchText}
            onChange={(e) => setFrenchText(e.target.value)}
            placeholder="e.g. Je suis ravi de vous rencontrer"
            rows={3}
            disabled={isPending}
            className="resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                handleTranslate();
            }}
            data-ocid="translator.input"
          />
          <p className="text-xs text-muted-foreground">
            Tip: Press Cmd/Ctrl + Enter to translate quickly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleTranslate}
            disabled={isPending || !frenchText.trim()}
            className="flex-1 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            data-ocid="translator.translate_button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isPending ? "Translating..." : "Translate"}
          </Button>
          {(frenchText || result || error) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isPending}
              data-ocid="translator.clear_button"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Loading spinner */}
        {isPending && (
          <div
            className="flex flex-col items-center justify-center py-10 gap-3"
            data-ocid="translator.loading_state"
          >
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Asking the AI…</p>
          </div>
        )}

        {/* Error state */}
        {error && !isPending && (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3"
            data-ocid="translator.error_state"
          >
            <X className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !isPending && (
          <div
            className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            data-ocid="translator.results"
          >
            <ResultCard
              label="English Translation"
              value={result.translation}
              ocid="translator.translation_card"
              highlight
            />
            <ResultCard
              label="Example Sentence"
              value={result.exampleSentence}
              ocid="translator.example_card"
            />
            <ResultCard
              label="Usage Tip"
              value={result.usageTip}
              ocid="translator.usage_tip_card"
            />
          </div>
        )}
      </div>
    </div>
  );
}
