import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  MousePointerClick,
  RotateCcw,
  Timer,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeakButton } from "../components/SpeakButton";
import {
  useGetCards,
  useGetDeck,
  useGetPublicDeck,
  useSaveStudySession,
} from "../hooks/useQueries";
import { shuffleArray } from "../utils/arrays";

interface Tile {
  id: string;
  cardId: string;
  text: string;
  type: "term" | "definition";
}

type GameState = "playing" | "checking" | "complete";

export function MatchGame() {
  const { deckId: deckIdParam } = useParams({ strict: false });
  const deckId = BigInt(deckIdParam as string);
  const navigate = useNavigate();

  const { data: ownedDeck, isLoading: isOwnedDeckLoading } = useGetDeck(deckId);
  const { data: publicDeck, isLoading: isPublicDeckLoading } =
    useGetPublicDeck(deckId);
  const {
    data: cards,
    isLoading: isCardsLoading,
    isError: isCardsError,
  } = useGetCards(deckId);

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { mutate: saveSession } = useSaveStudySession();

  const deck = ownedDeck ?? (publicDeck ? { title: publicDeck.title } : null);
  const isDeckLoading = !deck && (isOwnedDeckLoading || isPublicDeckLoading);
  const isDeckError = !deck && !isDeckLoading && isCardsError;

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [matchedCardIds, setMatchedCardIds] = useState<Set<string>>(new Set());
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [initialized, setInitialized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPairs = useMemo(() => {
    if (!tiles.length) return 0;
    return tiles.length / 2;
  }, [tiles]);

  const initializeGame = useCallback(() => {
    if (!cards || cards.length < 4) return;

    // Sample up to 8 cards
    const sampled = shuffleArray([...cards]).slice(0, 8);

    // Create term + definition tiles for each card
    const newTiles: Tile[] = [];
    for (const card of sampled) {
      const cardIdStr = card.id.toString();
      newTiles.push({
        id: `term-${cardIdStr}`,
        cardId: cardIdStr,
        text: card.front,
        type: "term",
      });
      newTiles.push({
        id: `def-${cardIdStr}`,
        cardId: cardIdStr,
        text: card.back,
        type: "definition",
      });
    }

    setTiles(shuffleArray(newTiles));
    setRevealedIds([]);
    setMatchedCardIds(new Set());
    setMoveCount(0);
    setElapsedSeconds(0);
    setGameState("playing");
    setInitialized(true);
  }, [cards]);

  // Initialize on first load
  useEffect(() => {
    if (cards && cards.length >= 4 && !initialized) {
      initializeGame();
    }
  }, [cards, initialized, initializeGame]);

  // Timer
  useEffect(() => {
    if (gameState === "playing" && initialized) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, initialized]);

  // Cleanup check timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const handleTileClick = useCallback(
    (tileId: string) => {
      if (gameState !== "playing") return;

      const tile = tiles.find((t) => t.id === tileId);
      if (!tile) return;

      // Already matched or already revealed
      if (matchedCardIds.has(tile.cardId) || revealedIds.includes(tileId))
        return;

      if (revealedIds.length === 0) {
        // First tile
        setRevealedIds([tileId]);
      } else if (revealedIds.length === 1) {
        // Second tile
        const firstTileId = revealedIds[0];
        const firstTile = tiles.find((t) => t.id === firstTileId);
        if (!firstTile || firstTileId === tileId) return;

        setRevealedIds([firstTileId, tileId]);
        setMoveCount((m) => m + 1);
        setGameState("checking");

        if (firstTile.cardId === tile.cardId) {
          // Match found
          const newMatched = new Set(matchedCardIds);
          newMatched.add(tile.cardId);
          setMatchedCardIds(newMatched);

          // Check win condition
          if (newMatched.size === totalPairs) {
            setGameState("complete");
            if (isAuthenticated) {
              saveSession({
                deckId,
                cardsStudied: BigInt(totalPairs),
                correctCount: BigInt(totalPairs),
                mode: "match",
              });
            }
          } else {
            checkTimeoutRef.current = setTimeout(() => {
              setRevealedIds([]);
              setGameState("playing");
            }, 400);
          }
        } else {
          // No match — flip back after delay
          checkTimeoutRef.current = setTimeout(() => {
            setRevealedIds([]);
            setGameState("playing");
          }, 800);
        }
      }
    },
    [
      gameState,
      tiles,
      matchedCardIds,
      revealedIds,
      totalPairs,
      isAuthenticated,
      deckId,
      saveSession,
    ],
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleRestart = useCallback(() => {
    setInitialized(false);
    // Re-initialize will trigger via the effect
    setTimeout(() => initializeGame(), 0);
  }, [initializeGame]);

  if (isDeckError || isCardsError) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <p className="text-destructive">Failed to load deck.</p>
      </div>
    );
  }

  if (isDeckLoading || isCardsLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!deck || !cards || cards.length < 4) {
    return (
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate({
              to: "/deck/$deckId/study",
              params: { deckId: deckIdParam! },
            })
          }
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to study modes
        </Button>
        <p className="text-muted-foreground">
          Match game requires at least 4 cards.
        </p>
      </div>
    );
  }

  if (gameState === "complete") {
    return (
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="rounded-full bg-primary/10 p-6 inline-flex">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              All Matched!
            </h2>
            <p className="text-muted-foreground">
              You matched all {totalPairs} pairs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">
                {formatTime(elapsedSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">Time</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">{moveCount}</p>
              <p className="text-xs text-muted-foreground">Moves</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/deck/$deckId/study",
                  params: { deckId: deckIdParam! },
                })
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Study modes
            </Button>
            <Button onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
              Play again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine grid columns based on tile count
  const tileCount = tiles.length;
  const gridCols =
    tileCount <= 8
      ? "grid-cols-2 sm:grid-cols-4"
      : tileCount <= 12
        ? "grid-cols-3 sm:grid-cols-4"
        : "grid-cols-4";

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate({
              to: "/deck/$deckId/study",
              params: { deckId: deckIdParam! },
            })
          }
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-lg font-semibold text-foreground truncate px-4">
          {deck.title}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRestart}
          className="h-8 w-8"
          title="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-6 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MousePointerClick className="h-4 w-4" />
          <span>{moveCount} moves</span>
        </div>
        <span>
          {matchedCardIds.size} / {totalPairs} matched
        </span>
      </div>

      <div className={cn("grid gap-2 sm:gap-3", gridCols)}>
        {tiles.map((tile) => {
          const isMatched = matchedCardIds.has(tile.cardId);
          const isRevealed = revealedIds.includes(tile.id);
          const isVisible = isMatched || isRevealed;

          return (
            <button
              type="button"
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              disabled={isMatched}
              className={cn(
                "relative aspect-[3/2] rounded-lg border-2 p-2 sm:p-3 transition-all duration-200",
                "flex flex-col items-center justify-center text-center",
                "text-sm font-medium",
                isMatched &&
                  "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 cursor-default",
                isRevealed &&
                  !isMatched &&
                  "border-primary bg-primary/10 text-foreground",
                !isVisible &&
                  "border-muted-foreground/20 bg-card hover:border-primary/50 hover:bg-accent/30 cursor-pointer",
                !isVisible && "shadow-sm hover:shadow-md",
              )}
            >
              {isVisible ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="line-clamp-3 break-words text-xs sm:text-sm">
                        {tile.text}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-64">
                      {tile.text}
                    </TooltipContent>
                  </Tooltip>
                  {tile.type === "term" && (
                    <SpeakButton
                      text={tile.text}
                      className="h-6 w-6 mt-0.5"
                      data-ocid="match.speak_button"
                    />
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground/40 text-lg">?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
