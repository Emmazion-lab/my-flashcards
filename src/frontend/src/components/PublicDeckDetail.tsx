import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Copy,
  Heart,
  Layers,
  Loader2,
  Lock,
  Play,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDeckExists,
  useDuplicateDeck,
  useGetPublicDeck,
  useGetUserLikes,
  useLikeDeck,
  useRequestDeckAccess,
  useUnlikeDeck,
} from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

export function PublicDeckDetail() {
  const { deckId: deckIdParam } = useParams({ strict: false });
  const deckId = BigInt(deckIdParam as string);
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: deck, isLoading, isError } = useGetPublicDeck(deckId);

  const { data: deckExists, isLoading: isCheckingExists } =
    useDeckExists(deckId);
  const { mutate: requestAccess, isPending: isRequesting } =
    useRequestDeckAccess();
  const { data: userLikes } = useGetUserLikes();
  const { mutate: likeDeck, isPending: isLiking } = useLikeDeck();
  const { mutate: unlikeDeck, isPending: isUnliking } = useUnlikeDeck();
  const { mutate: duplicateDeck, isPending: isDuplicating } =
    useDuplicateDeck();

  const isLiked = userLikes?.some((id) => BigInt(id) === deckId) ?? false;

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (isLiked) {
      unlikeDeck(
        { deckId },
        {
          onError: (err) => toast.error(err.message || "Failed to unlike deck"),
        },
      );
    } else {
      likeDeck(
        { deckId },
        {
          onError: (err) => toast.error(err.message || "Failed to like deck"),
        },
      );
    }
  };

  const handleDuplicate = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    duplicateDeck(
      { deckId },
      {
        onSuccess: () => {
          toast.success("Deck duplicated to your library");
        },
        onError: (err) =>
          toast.error(err.message || "Failed to duplicate deck"),
      },
    );
  };

  const handleStudy = () => {
    navigate({
      to: "/deck/$deckId/study",
      params: { deckId: deckIdParam! },
    });
  };

  if (isLoading || isCheckingExists) {
    return (
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-9 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    );
  }

  if (isError || !deck) {
    // Deck exists but is not public — offer request access
    if (deckExists) {
      const handleRequestAccess = () => {
        if (!isAuthenticated) {
          login();
          return;
        }
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

      return (
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-foreground">
                This deck is private
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The owner hasn't made this deck public. You can send them a
                request to get access.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleRequestAccess}
                disabled={isRequesting}
                className="w-full"
              >
                {isRequesting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRequesting ? "Sending request..." : "Request Access"}
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground">
                  You'll need to{" "}
                  <button
                    type="button"
                    onClick={() => login()}
                    className="text-primary underline hover:no-underline"
                  >
                    sign in
                  </button>{" "}
                  first.
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate({
                    to: "/browse",
                    search: { q: "", category: "", sort: "popular", page: 0 },
                  })
                }
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Browse public decks
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Deck doesn't exist at all
    return (
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Deck not found
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This deck may have been deleted or the link could be incorrect.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: "/browse",
                search: { q: "", category: "", sort: "popular", page: 0 },
              })
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Browse public decks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate({
            to: "/browse",
            search: { q: "", category: "", sort: "popular", page: 0 },
          })
        }
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Browse Decks
      </Button>

      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{deck.title}</h1>
            <Badge variant="secondary" className="shrink-0">
              {deck.category}
            </Badge>
          </div>
          {deck.description && (
            <p className="text-muted-foreground mb-3">{deck.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>by {deck.ownerName}</span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {Number(deck.cardCount)}{" "}
              {Number(deck.cardCount) === 1 ? "card" : "cards"}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {Number(deck.likesCount)}{" "}
              {Number(deck.likesCount) === 1 ? "like" : "likes"}
            </span>
            <span className="flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" />
              {Number(deck.copyCount)}{" "}
              {Number(deck.copyCount) === 1 ? "copy" : "copies"}
            </span>
            <span>
              Created {format(fromNanoseconds(deck.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleStudy} disabled={Number(deck.cardCount) === 0}>
            <Play className="h-4 w-4" />
            Study
          </Button>
          <Button
            variant={isLiked ? "default" : "outline"}
            onClick={handleToggleLike}
            disabled={isLiking || isUnliking}
          >
            {isLiking || isUnliking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            )}
            {isLiked ? "Liked" : "Like"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {isDuplicating ? "Duplicating..." : "Duplicate to My Library"}
          </Button>
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => login()}
                className="text-primary underline hover:no-underline"
              >
                Sign in
              </button>{" "}
              to like or duplicate this deck.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
