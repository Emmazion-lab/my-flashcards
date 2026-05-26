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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Layers,
  Loader2,
  Pencil,
  Play,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useDeleteDeck,
  useDuplicateDeck,
  useGetCards,
  useGetDeck,
  useGetUserLikes,
  useLikeDeck,
  useRequestDeckAccess,
  useUnlikeDeck,
  useUpdateDeck,
} from "../hooks/useQueries";
import {
  CATEGORIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
} from "../utils/constants";
import { fromNanoseconds } from "../utils/formatting";
import { AddCardForm } from "./AddCardForm";
import { BulkImportDialog } from "./BulkImportDialog";
import { CardItem } from "./CardItem";
import { DeckStats } from "./DeckStats";
import { ShareDeckDialog } from "./ShareDeckDialog";

export function DeckDetailPage({ isOwner = true }: { isOwner?: boolean }) {
  const { deckId: deckIdParam } = useParams({ strict: false });
  const deckId = BigInt(deckIdParam as string);
  const navigate = useNavigate();

  const { identity } = useInternetIdentity();
  const {
    data: deck,
    isLoading: isDeckLoading,
    isError: isDeckError,
  } = useGetDeck(deckId);
  const {
    data: cards,
    isLoading: isCardsLoading,
    isError: isCardsError,
  } = useGetCards(deckId);
  const { mutate: requestAccess, isPending: isRequesting } =
    useRequestDeckAccess();

  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { mutate: updateDeck, isPending: isUpdatingDeck } = useUpdateDeck();
  const { mutate: deleteDeck, isPending: isDeletingDeck } = useDeleteDeck();
  const { mutate: duplicateDeck, isPending: isDuplicating } =
    useDuplicateDeck();
  const { data: userLikes } = useGetUserLikes();
  const { mutate: likeDeck, isPending: isLiking } = useLikeDeck();
  const { mutate: unlikeDeck, isPending: isUnliking } = useUnlikeDeck();

  const isLiked = userLikes?.some((id) => BigInt(id) === deckId) ?? false;

  const startEditDeck = () => {
    if (!deck) return;
    setEditTitle(deck.title);
    setEditDescription(deck.description);
    setEditCategory(deck.category);
    setIsEditingDeck(true);
  };

  const handleSaveDeck = () => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editCategory) {
      toast.error("Category is required");
      return;
    }
    updateDeck(
      {
        deckId,
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
      },
      {
        onSuccess: () => {
          toast.success("Deck updated");
          setIsEditingDeck(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update deck");
        },
      },
    );
  };

  const handleDeleteDeck = () => {
    deleteDeck(
      { deckId },
      {
        onSuccess: () => {
          toast.success("Deck deleted");
          navigate({ to: "/" });
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete deck");
        },
      },
    );
  };

  const handleRequestAccess = () => {
    requestAccess(
      { deckId },
      {
        onSuccess: () => {
          toast.success("Access request sent to the deck owner");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to request access");
        },
      },
    );
  };

  if (isDeckError || isCardsError) {
    return (
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          This deck is not available. It may be private or shared with specific
          users.
        </p>
        {!!identity && (
          <Button onClick={handleRequestAccess} disabled={isRequesting}>
            {isRequesting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRequesting ? "Requesting..." : "Request Access"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="h-4 w-4" />
          Back to My Decks
        </Button>
      </div>
    );
  }

  if (isDeckLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!deck) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/" })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Decks
        </Button>

        {isEditingDeck ? (
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                disabled={isUpdatingDeck}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                maxLength={MAX_DESCRIPTION_LENGTH}
                disabled={isUpdatingDeck}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editDescription.length}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editCategory}
                onValueChange={setEditCategory}
                disabled={isUpdatingDeck}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingDeck(false)}
                disabled={isUpdatingDeck}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDeck}
                disabled={isUpdatingDeck}
              >
                {isUpdatingDeck ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isUpdatingDeck ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {deck.title}
                </h2>
                <Badge variant="secondary">{deck.category}</Badge>
                <Badge variant="outline" className="text-xs">
                  {(deck.visibility as string) === "Public"
                    ? "Public"
                    : "Private"}
                </Badge>
              </div>
              {deck.description && (
                <p
                  className="text-muted-foreground mb-2 truncate"
                  title={deck.description}
                >
                  {deck.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {Number(deck.cardCount)}{" "}
                {Number(deck.cardCount) === 1 ? "card" : "cards"}
                {" \u00b7 "}
                Created {format(fromNanoseconds(deck.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  navigate({
                    to: "/deck/$deckId/study",
                    params: { deckId: deckIdParam! },
                  })
                }
                disabled={Number(deck.cardCount) === 0}
              >
                <Play className="h-4 w-4" />
                Study
              </Button>
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isLiked) {
                    unlikeDeck(
                      { deckId },
                      {
                        onError: (err) =>
                          toast.error(err.message || "Failed to unlike"),
                      },
                    );
                  } else {
                    likeDeck(
                      { deckId },
                      {
                        onError: (err) =>
                          toast.error(err.message || "Failed to like"),
                      },
                    );
                  }
                }}
                disabled={isLiking || isUnliking}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                {isLiked ? "Liked" : "Like"}
              </Button>
              {!isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    duplicateDeck(
                      { deckId },
                      {
                        onSuccess: () =>
                          toast.success("Deck duplicated to your library"),
                        onError: (err) =>
                          toast.error(
                            err.message || "Failed to duplicate deck",
                          ),
                      },
                    )
                  }
                  disabled={isDuplicating}
                >
                  {isDuplicating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {isDuplicating ? "Duplicating..." : "Duplicate to My Library"}
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={startEditDeck}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <DeckStats deckId={deckId} />

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Cards</h3>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </Button>
          )}
        </div>

        {isOwner && <AddCardForm deckId={deckId} />}

        {isCardsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : cards && cards.length > 0 ? (
          <div className="space-y-2">
            {cards.map((card, index) => (
              <CardItem
                key={Number(card.id)}
                card={card}
                deckId={deckId}
                index={index}
                isOwner={isOwner}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {isOwner
                ? "No cards yet. Add your first card above."
                : "This deck has no cards yet."}
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deck?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deck.title}" and all its cards.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDeck}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteDeck();
              }}
              disabled={isDeletingDeck}
            >
              {isDeletingDeck && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeletingDeck ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        deckId={deckId}
      />

      <ShareDeckDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        deckId={deckId}
        visibility={deck.visibility}
      />
    </div>
  );
}
