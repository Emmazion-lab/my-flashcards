import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import {
  useDeleteCard,
  useToggleStarCard,
  useUpdateCard,
  useUpdateCardImages,
} from "../hooks/useQueries";
import { MAX_CARD_TEXT_LENGTH } from "../utils/constants";
import { CardImageUpload } from "./CardImageUpload";
import { SpeakButton } from "./SpeakButton";

const PARTS_OF_SPEECH = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "phrase", label: "Phrase" },
  { value: "other", label: "Other" },
];

const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-100 text-blue-700 border-blue-200",
  verb: "bg-green-100 text-green-700 border-green-200",
  adjective: "bg-purple-100 text-purple-700 border-purple-200",
  adverb: "bg-orange-100 text-orange-700 border-orange-200",
  phrase: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-muted text-muted-foreground border-border",
};

interface CardItemProps {
  card: {
    id: bigint;
    front: string;
    back: string;
    frontImage?: ExternalBlob | null;
    backImage?: ExternalBlob | null;
    starred: boolean;
    position: bigint;
    pronunciation?: string;
    partOfSpeech?: string;
    exampleSentence?: string;
    exampleTranslation?: string;
  };
  deckId: bigint;
  index: number;
  isOwner?: boolean;
}

export function CardItem({
  card,
  deckId,
  index,
  isOwner = true,
}: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [pronunciation, setPronunciation] = useState(card.pronunciation ?? "");
  const [partOfSpeech, setPartOfSpeech] = useState(card.partOfSpeech ?? "");
  const [exampleSentence, setExampleSentence] = useState(
    card.exampleSentence ?? "",
  );
  const [exampleTranslation, setExampleTranslation] = useState(
    card.exampleTranslation ?? "",
  );
  const [frontImage, setFrontImage] = useState<ExternalBlob | null>(
    card.frontImage ?? null,
  );
  const [backImage, setBackImage] = useState<ExternalBlob | null>(
    card.backImage ?? null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: updateCard, isPending: isUpdating } = useUpdateCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();
  const { mutate: toggleStar } = useToggleStarCard();
  const { mutate: updateImages, isPending: isUploadingImages } =
    useUpdateCardImages();

  const imagesChanged =
    frontImage !== card.frontImage || backImage !== card.backImage;

  const handleSave = () => {
    if (!front.trim() || !back.trim()) {
      toast.error("Both front and back text are required");
      return;
    }
    const currentPronunciation = card.pronunciation ?? "";
    const currentPartOfSpeech = card.partOfSpeech ?? "";
    const currentExampleSentence = card.exampleSentence ?? "";
    const currentExampleTranslation = card.exampleTranslation ?? "";

    const textChanged =
      front.trim() !== card.front ||
      back.trim() !== card.back ||
      pronunciation.trim() !== currentPronunciation ||
      partOfSpeech !== currentPartOfSpeech ||
      exampleSentence.trim() !== currentExampleSentence ||
      exampleTranslation.trim() !== currentExampleTranslation;

    const finish = () => {
      if (imagesChanged) {
        updateImages(
          { deckId, cardId: card.id, frontImage, backImage },
          {
            onSuccess: () => {
              toast.success("Card updated");
              setIsEditing(false);
              setShowAdvanced(false);
            },
            onError: (err) => {
              toast.error(err.message || "Failed to update images");
            },
          },
        );
      } else {
        toast.success("Card updated");
        setIsEditing(false);
        setShowAdvanced(false);
      }
    };

    if (textChanged) {
      updateCard(
        {
          deckId,
          cardId: card.id,
          front: front.trim(),
          back: back.trim(),
          pronunciation: pronunciation.trim() || null,
          partOfSpeech: partOfSpeech || null,
          exampleSentence: exampleSentence.trim() || null,
          exampleTranslation: exampleTranslation.trim() || null,
        },
        {
          onSuccess: finish,
          onError: (err) => toast.error(err.message || "Failed to update card"),
        },
      );
    } else {
      finish();
    }
  };

  const handleCancel = () => {
    setFront(card.front);
    setBack(card.back);
    setPronunciation(card.pronunciation ?? "");
    setPartOfSpeech(card.partOfSpeech ?? "");
    setExampleSentence(card.exampleSentence ?? "");
    setExampleTranslation(card.exampleTranslation ?? "");
    setFrontImage(card.frontImage ?? null);
    setBackImage(card.backImage ?? null);
    setIsEditing(false);
    setShowAdvanced(false);
  };

  const handleDelete = () => {
    deleteCard(
      { deckId, cardId: card.id },
      {
        onSuccess: () => {
          toast.success("Card deleted");
          setDeleteOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete card");
        },
      },
    );
  };

  // Read display values
  const displayPronunciation = card.pronunciation ?? "";
  const displayPartOfSpeech = card.partOfSpeech ?? "";
  const displayExampleSentence = card.exampleSentence ?? "";
  const displayExampleTranslation = card.exampleTranslation ?? "";

  if (isEditing) {
    return (
      <div
        className="rounded-lg border bg-card p-4 space-y-3"
        data-ocid={`card.item.${index + 1}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Card {index + 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
              data-ocid={`card.cancel_button.${index + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating || isUploadingImages}
              data-ocid={`card.save_button.${index + 1}`}
            >
              {isUpdating || isUploadingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isUpdating || isUploadingImages ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Input
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="French term"
              maxLength={MAX_CARD_TEXT_LENGTH}
              disabled={isUpdating}
            />
            <CardImageUpload
              label="Front"
              image={frontImage}
              onUpload={setFrontImage}
              onRemove={() => setFrontImage(null)}
              disabled={isUpdating || isUploadingImages}
            />
          </div>
          <div className="space-y-2">
            <Input
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="English translation"
              maxLength={MAX_CARD_TEXT_LENGTH}
              disabled={isUpdating}
            />
            <CardImageUpload
              label="Back"
              image={backImage}
              onUpload={setBackImage}
              onRemove={() => setBackImage(null)}
              disabled={isUpdating || isUploadingImages}
            />
          </div>
        </div>

        {/* Advanced edit toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {showAdvanced
            ? "Hide advanced fields"
            : "Edit pronunciation & example"}
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Pronunciation
                </Label>
                <Input
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                  placeholder="e.g. bon-ZHOOR"
                  maxLength={200}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Part of speech
                </Label>
                <Select
                  value={partOfSpeech}
                  onValueChange={setPartOfSpeech}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
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
              <Label className="text-xs text-muted-foreground">
                Example sentence (French)
              </Label>
              <Textarea
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                placeholder="e.g. Bonjour, comment allez-vous ?"
                rows={2}
                maxLength={500}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Example translation (English)
              </Label>
              <Input
                value={exampleTranslation}
                onChange={(e) => setExampleTranslation(e.target.value)}
                placeholder="e.g. Hello, how are you?"
                maxLength={500}
                disabled={isUpdating}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-lg border bg-card p-4 group"
        data-ocid={`card.item.${index + 1}`}
      >
        <div className="flex items-start gap-4">
          <span className="text-sm font-medium text-muted-foreground w-8 shrink-0 pt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            {/* Main term/translation row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {card.frontImage && (
                  <img
                    src={card.frontImage.getDirectURL()}
                    alt=""
                    className="h-8 w-8 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {card.front}
                    </p>
                    <SpeakButton
                      text={card.front}
                      className="h-6 w-6 shrink-0"
                      data-ocid={`card.speak_button.${index + 1}`}
                    />
                  </div>
                  {displayPronunciation && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      {displayPronunciation}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                {card.backImage && (
                  <img
                    src={card.backImage.getDirectURL()}
                    alt=""
                    className="h-8 w-8 rounded object-cover shrink-0"
                  />
                )}
                <p className="text-sm text-muted-foreground truncate">
                  {card.back}
                </p>
              </div>
            </div>

            {/* Part of speech badge */}
            {displayPartOfSpeech && (
              <div className="mb-1">
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize",
                    POS_COLORS[displayPartOfSpeech] ?? POS_COLORS.other,
                  )}
                >
                  {displayPartOfSpeech}
                </span>
              </div>
            )}

            {/* Example sentence/translation */}
            {(displayExampleSentence || displayExampleTranslation) && (
              <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-0.5">
                {displayExampleSentence && (
                  <p className="text-xs text-foreground/70 italic">
                    {displayExampleSentence}
                  </p>
                )}
                {displayExampleTranslation && (
                  <p className="text-xs text-muted-foreground">
                    {displayExampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  card.starred
                    ? "text-yellow-500"
                    : "sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                )}
                onClick={() => toggleStar({ deckId, cardId: card.id })}
                title={card.starred ? "Unstar" : "Star"}
                aria-label={card.starred ? "Unstar card" : "Star card"}
              >
                <Star
                  className={cn("h-4 w-4", card.starred && "fill-current")}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
                aria-label="Edit card"
                data-ocid={`card.edit_button.${index + 1}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete card"
                data-ocid={`card.delete_button.${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid={`card.dialog.${index + 1}`}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this card from the deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              data-ocid={`card.cancel_button.${index + 1}`}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              data-ocid={`card.confirm_button.${index + 1}`}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
