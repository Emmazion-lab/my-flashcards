import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Visibility } from "../backend";
import { fromNanoseconds } from "../utils/formatting";

interface DeckCardProps {
  deck: {
    id: bigint;
    title: string;
    category: string;
    cardCount: bigint;
    updatedAt: bigint;
    visibility?: Visibility;
  };
  onClick?: () => void;
  index?: number;
}

export function DeckCard({ deck, onClick, index }: DeckCardProps) {
  const updatedDate = fromNanoseconds(deck.updatedAt);
  const vis = deck.visibility as string | undefined;
  const cardCount = Number(deck.cardCount);

  return (
    <button
      type="button"
      className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group min-h-[44px] active:scale-[0.98] text-left w-full"
      onClick={onClick}
      aria-label={`Open deck: ${deck.title}`}
      data-ocid={index !== undefined ? `deck.item.${index + 1}` : "deck.card"}
    >
      {/* Tricolore top accent bar */}
      <div className="h-1 rounded-t-xl bg-gradient-to-r from-primary via-background to-destructive opacity-60" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-foreground line-clamp-2 font-display group-hover:text-primary transition-colors">
            {deck.title}
          </h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {deck.category}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80">
            <span className="text-primary font-semibold">{cardCount}</span>
            <span className="text-muted-foreground">
              {cardCount === 1 ? "card" : "cards"}
            </span>
          </span>
          <span className="text-muted-foreground/50">&middot;</span>
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(updatedDate, { addSuffix: true })}
          </span>
          {vis === "Public" && (
            <Badge variant="outline" className="text-xs py-0 ml-auto">
              Public
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
