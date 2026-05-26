import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info, Loader2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBulkAddCards } from "../hooks/useQueries";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: bigint;
}

type CardRow = [
  string,
  string,
  string | null,
  string | null,
  string | null,
  string | null,
];

function parseCards(text: string, delimiter: string): CardRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(delimiter).map((s) => s.trim());
      if (parts.length < 2) return null;
      const [
        front,
        back,
        pronunciation,
        partOfSpeech,
        exampleSentence,
        exampleTranslation,
      ] = parts;
      if (!front || !back) return null;
      return [
        front,
        back,
        pronunciation || null,
        partOfSpeech || null,
        exampleSentence || null,
        exampleTranslation || null,
      ] as CardRow;
    })
    .filter((pair): pair is CardRow => pair !== null);
}

export function BulkImportDialog({
  open,
  onOpenChange,
  deckId,
}: BulkImportDialogProps) {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState("\t");
  const [error, setError] = useState("");

  const { mutate: bulkAdd, isPending } = useBulkAddCards();

  const parsedCards = useMemo(
    () => parseCards(text, delimiter),
    [text, delimiter],
  );

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setText("");
      setDelimiter("\t");
      setError("");
    }
  };

  const handleImport = () => {
    if (parsedCards.length === 0) {
      setError(
        "No valid cards found. Each line needs at least a French term and English translation separated by the delimiter.",
      );
      return;
    }
    bulkAdd(
      { deckId, cards: parsedCards },
      {
        onSuccess: (added) => {
          toast.success(`Imported ${added.length} cards`);
          handleOpenChange(false);
        },
        onError: (err) => {
          setError(err.message || "Failed to import cards");
        },
      },
    );
  };

  const delimiterLabel = delimiter === "\t" ? "Tab" : delimiter;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] flex flex-col"
        data-ocid="bulk_import.dialog"
      >
        <DialogHeader>
          <DialogTitle>Bulk Import Cards</DialogTitle>
          <DialogDescription>
            Paste your French vocabulary — one card per line, columns separated
            by the delimiter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Format guide */}
          <div className="rounded-md bg-muted/60 border border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Info className="h-3.5 w-3.5 text-primary" />
              6-column format (columns 3–6 are optional)
            </div>
            <div className="font-mono text-[11px] text-muted-foreground space-y-0.5">
              <div className="grid grid-cols-6 gap-1">
                <span className="col-span-1 font-semibold text-foreground">
                  1
                </span>
                <span className="col-span-1 font-semibold text-foreground">
                  2
                </span>
                <span className="col-span-1">3</span>
                <span className="col-span-1">4</span>
                <span className="col-span-2">5 / 6</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                <span className="col-span-1">French</span>
                <span className="col-span-1">English</span>
                <span className="col-span-1">Pronunciation</span>
                <span className="col-span-1">Part of speech</span>
                <span className="col-span-2">Example FR / Example EN</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Example:{" "}
              <span className="font-mono">
                bonjour{delimiterLabel === "Tab" ? "  " : delimiter}hello
                {delimiterLabel === "Tab" ? "  " : delimiter}bon-ZHOOR
                {delimiterLabel === "Tab" ? "  " : delimiter}phrase
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delimiter">Delimiter</Label>
            <div className="flex items-center gap-2">
              <Input
                id="delimiter"
                value={delimiter === "\t" ? "\\t" : delimiter}
                onChange={(e) => {
                  const val = e.target.value;
                  setDelimiter(val === "\\t" ? "\t" : val);
                }}
                placeholder="\t"
                className="w-24 font-mono"
                disabled={isPending}
              />
              <span className="text-xs text-muted-foreground">
                Current: <strong>{delimiterLabel}</strong> (tab recommended for
                spreadsheet paste)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-text">Cards</Label>
            <Textarea
              id="bulk-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              placeholder={
                "bonjour\thello\tbon-ZHOOR\tphrase\nmerci\tthank you\tmer-SEE\tphrase\nmaison\thouse\tmeh-ZON\tnoun"
              }
              rows={8}
              disabled={isPending}
              className="font-mono text-xs"
              data-ocid="bulk_import.textarea"
            />
          </div>

          {text.trim() && (
            <p className="text-sm text-muted-foreground">
              {parsedCards.length} card{parsedCards.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          )}

          {parsedCards.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded border p-3 space-y-1.5">
              {parsedCards.map(
                ([front, back, pronunciation, partOfSpeech], i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                  <div key={i} className="text-xs flex gap-2 items-start">
                    <span className="font-medium text-foreground shrink-0 min-w-[80px]">
                      {front}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {back}
                    </span>
                    {pronunciation && (
                      <span className="text-muted-foreground/70 italic shrink-0">
                        {pronunciation}
                      </span>
                    )}
                    {partOfSpeech && (
                      <span className="text-primary/70 shrink-0 capitalize">
                        {partOfSpeech}
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

          {error && (
            <p
              className="text-sm text-destructive"
              data-ocid="bulk_import.error_state"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            data-ocid="bulk_import.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isPending || parsedCards.length === 0}
            data-ocid="bulk_import.submit_button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isPending ? "Importing..." : `Import ${parsedCards.length} Cards`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
