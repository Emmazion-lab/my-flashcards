import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateDeck } from "../hooks/useQueries";
import {
  CATEGORIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
} from "../utils/constants";

interface CreateDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeckDialog({
  open,
  onOpenChange,
}: CreateDeckDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Language");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { mutate: createDeck, isPending } = useCreateDeck();

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setTitle("");
      setDescription("");
      setCategory("Language");
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Deck title is required");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    createDeck(
      { title: title.trim(), description: description.trim(), category },
      {
        onSuccess: (newDeck) => {
          toast.success("Deck created — add your first cards!");
          onOpenChange(false);
          navigate({
            to: "/deck/$deckId",
            params: { deckId: newDeck.id.toString() },
          });
        },
        onError: (err) => {
          setError(err.message || "Failed to create deck");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="create_deck.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            Create New French Deck
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deck title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              placeholder="e.g. Essential Greetings, Paris Vocabulary"
              maxLength={MAX_TITLE_LENGTH}
              disabled={isPending}
              data-ocid="create_deck.title_input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What French words or phrases will you learn?"
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              disabled={isPending}
              data-ocid="create_deck.description_input"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val);
                setError("");
              }}
              disabled={isPending}
            >
              <SelectTrigger
                id="category"
                data-ocid="create_deck.category_select"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p
              className="text-sm text-destructive"
              data-ocid="create_deck.error_state"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-ocid="create_deck.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="create_deck.submit_button"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
