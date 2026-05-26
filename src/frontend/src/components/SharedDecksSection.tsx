import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useGetSharedDecks } from "../hooks/useQueries";

interface SharedDeck {
  deckId: bigint;
  ownerName: string;
  title: string;
  description: string;
  category: string;
  cardCount: bigint;
}

export function SharedDecksSection() {
  const { data: sharedDecks, isLoading, isError } = useGetSharedDecks();
  const navigate = useNavigate();

  if (isError) {
    return (
      <p className="text-destructive text-sm">Failed to load shared decks.</p>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!sharedDecks || sharedDecks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">
          No decks have been shared with you yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sharedDecks.map((deck: SharedDeck) => (
        <div
          key={Number(deck.deckId)}
          className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() =>
            navigate({
              to: "/deck/$deckId",
              params: { deckId: deck.deckId.toString() },
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate({
                to: "/deck/$deckId",
                params: { deckId: deck.deckId.toString() },
              });
            }
          }}
          // biome-ignore lint/a11y/useSemanticElements: interactive div
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground line-clamp-2">
              {deck.title}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              {deck.category}
            </Badge>
          </div>
          {deck.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {deck.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>by {deck.ownerName}</span>
            <span>&middot;</span>
            <span>
              {Number(deck.cardCount)}{" "}
              {Number(deck.cardCount) === 1 ? "card" : "cards"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
