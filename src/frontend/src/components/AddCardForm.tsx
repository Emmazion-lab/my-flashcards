import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Loader2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddCard, useTranslateText } from "../hooks/useQueries";
import { MAX_CARD_TEXT_LENGTH } from "../utils/constants";

const PARTS_OF_SPEECH = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "phrase", label: "Phrase" },
  { value: "other", label: "Other" },
];

interface AddCardFormProps {
  deckId: bigint;
}

export function AddCardForm({ deckId }: AddCardFormProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const { mutate: addCard, isPending } = useAddCard();
  const { mutate: translateText, isPending: isTranslating } =
    useTranslateText();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      toast.error("Both French term and English translation are required");
      return;
    }
    addCard(
      {
        deckId,
        front: front.trim(),
        back: back.trim(),
        pronunciation: pronunciation.trim() || null,
        partOfSpeech: partOfSpeech || null,
        exampleSentence: exampleSentence.trim() || null,
        exampleTranslation: exampleTranslation.trim() || null,
      },
      {
        onSuccess: () => {
          setFront("");
          setBack("");
          setPronunciation("");
          setPartOfSpeech("");
          setExampleSentence("");
          setExampleTranslation("");
          setShowAdvanced(false);
          toast.success("Card added");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to add card");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-dashed bg-card p-4 space-y-3"
      data-ocid="add_card.form"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="card-front" className="text-xs text-muted-foreground">
            French term
          </Label>
          <div className="flex gap-1.5">
            <Input
              id="card-front"
              value={front}
              onChange={(e) => {
                setFront(e.target.value);
                setTranslateError("");
              }}
              placeholder="e.g. Bonjour"
              maxLength={MAX_CARD_TEXT_LENGTH}
              disabled={isPending || isTranslating}
              data-ocid="add_card.front_input"
              className="flex-1"
            />
            <button
              type="button"
              title="Auto-translate"
              disabled={isPending || isTranslating || !front.trim()}
              onClick={() => {
                if (!front.trim()) return;
                setTranslateError("");
                if (!showAdvanced) setShowAdvanced(true);
                translateText(
                  { frenchText: front.trim() },
                  {
                    onSuccess: (data) => {
                      setBack(data.translation);
                      setExampleSentence(
                        data.exampleSentence +
                          (data.usageTip
                            ? `\n\n\ud83d\udca1 Usage tip: ${data.usageTip}`
                            : ""),
                      );
                    },
                    onError: (err) => {
                      setTranslateError(err.message || "Translation failed");
                    },
                  },
                );
              }}
              className="flex-shrink-0 h-10 w-10 rounded-md border border-input flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-primary"
              data-ocid="add_card.translate_button"
              aria-label="Auto-translate French term"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </button>
          </div>
          {translateError && (
            <p
              className="text-xs text-destructive"
              data-ocid="add_card.translate_error"
            >
              {translateError}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="card-back" className="text-xs text-muted-foreground">
            English translation
          </Label>
          <Input
            id="card-back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="e.g. Hello / Good morning"
            maxLength={MAX_CARD_TEXT_LENGTH}
            disabled={isPending}
            data-ocid="add_card.back_input"
          />
        </div>
      </div>

      {/* Advanced fields toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        data-ocid="add_card.advanced_toggle"
      >
        {showAdvanced ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {showAdvanced
          ? "Hide advanced fields"
          : "Add pronunciation & example (optional)"}
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="card-pronunciation"
                className="text-xs text-muted-foreground"
              >
                Pronunciation (phonetic)
              </Label>
              <Input
                id="card-pronunciation"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g. bon-ZHOOR"
                maxLength={200}
                disabled={isPending}
                data-ocid="add_card.pronunciation_input"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="card-pos"
                className="text-xs text-muted-foreground"
              >
                Part of speech
              </Label>
              <Select
                value={partOfSpeech}
                onValueChange={setPartOfSpeech}
                disabled={isPending}
              >
                <SelectTrigger
                  id="card-pos"
                  data-ocid="add_card.part_of_speech_select"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PARTS_OF_SPEECH.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="card-example"
              className="text-xs text-muted-foreground"
            >
              Example sentence (French)
            </Label>
            <Textarea
              id="card-example"
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="e.g. Bonjour, comment allez-vous ?"
              rows={2}
              maxLength={500}
              disabled={isPending}
              data-ocid="add_card.example_sentence_input"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="card-example-translation"
              className="text-xs text-muted-foreground"
            >
              Example translation (English)
            </Label>
            <Input
              id="card-example-translation"
              value={exampleTranslation}
              onChange={(e) => setExampleTranslation(e.target.value)}
              placeholder="e.g. Hello, how are you?"
              maxLength={500}
              disabled={isPending}
              data-ocid="add_card.example_translation_input"
            />
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        data-ocid="add_card.submit_button"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isPending ? "Adding..." : "Add Card"}
      </Button>
    </form>
  );
}
