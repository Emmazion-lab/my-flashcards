import { Badge } from "@/components/ui/badge";
import { Copy, Heart, Layers } from "lucide-react";

interface PublicDeckCardProps {
  deck: {
    deckId: bigint;
    ownerName: string;
    title: string;
    description: string;
    category: string;
    cardCount: bigint;
    likesCount: bigint;
    copyCount: bigint;
  };
  onClick?: () => void;
}

export function PublicDeckCard({ deck, onClick }: PublicDeckCardProps) {
  return (
    <div
      className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
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
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {deck.description}
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>by {deck.ownerName}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {Number(deck.cardCount)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {Number(deck.likesCount)}
          </span>
          <span className="flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" />
            {Number(deck.copyCount)}
          </span>
        </div>
      </div>
    </div>
  );
}
