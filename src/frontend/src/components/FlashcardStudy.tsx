import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { SpeakButton } from "../components/SpeakButton";
import {
  useGetCards,
  useGetDeck,
  useGetPublicDeck,
  useToggleStarCard,
} from "../hooks/useQueries";
import { useStudyStore } from "../hooks/useStudyStore";
import { shuffleArray } from "../utils/arrays";

export function FlashcardStudy() {
  const { deckId: deckIdParam } = useParams({ strict: false });
  const deckId = BigInt(deckIdParam as string);
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: ownedDeck, isLoading: isOwnedDeckLoading } = useGetDeck(deckId);
  const { data: publicDeck, isLoading: isPublicDeckLoading } =
    useGetPublicDeck(deckId);
  const {
    data: cards,
    isLoading: isCardsLoading,
    isError: isCardsError,
  } = useGetCards(deckId);

  const deck = ownedDeck ?? (publicDeck ? { title: publicDeck.title } : null);
  const isDeckLoading = !deck && (isOwnedDeckLoading || isPublicDeckLoading);
  const isDeckError = !deck && !isDeckLoading && isCardsError;

  const isOwner = isAuthenticated && !!ownedDeck;

  const { mutate: toggleStar } = useToggleStarCard();

  const {
    currentIndex,
    shuffledCardIds,
    isFlipped,
    isShuffled,
    studyStarredOnly,
    setShuffledCardIds,
    setIsShuffled,
    nextCard,
    prevCard,
    toggleFlip,
    resetPosition,
    reset,
  } = useStudyStore();

  const studyCards = useMemo(() => {
    if (!cards) return [];
    return studyStarredOnly ? cards.filter((c) => c.starred) : cards;
  }, [cards, studyStarredOnly]);

  // Initialize card order when cards load
  useEffect(() => {
    if (studyCards.length > 0 && shuffledCardIds.length === 0) {
      setShuffledCardIds(studyCards.map((c) => Number(c.id)));
    }
  }, [studyCards, shuffledCardIds.length, setShuffledCardIds]);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      const SWIPE_THRESHOLD = 50;
      if (deltaX > SWIPE_THRESHOLD) {
        prevCard();
      } else if (deltaX < -SWIPE_THRESHOLD) {
        nextCard();
      }
    },
    [prevCard, nextCard],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const currentCard = useMemo(() => {
    if (!cards || shuffledCardIds.length === 0) return null;
    const cardId = shuffledCardIds[currentIndex];
    return cards.find((c) => Number(c.id) === cardId) ?? null;
  }, [cards, shuffledCardIds, currentIndex]);

  const handleShuffle = useCallback(() => {
    if (studyCards.length === 0) return;
    if (isShuffled) {
      setShuffledCardIds(studyCards.map((c) => Number(c.id)));
      setIsShuffled(false);
    } else {
      setShuffledCardIds(shuffleArray(studyCards.map((c) => Number(c.id))));
      setIsShuffled(true);
    }
    resetPosition();
  }, [
    studyCards,
    isShuffled,
    setShuffledCardIds,
    setIsShuffled,
    resetPosition,
  ]);

  const handleRestart = useCallback(() => {
    if (studyCards.length === 0) return;
    if (isShuffled) {
      setShuffledCardIds(shuffleArray(studyCards.map((c) => Number(c.id))));
    }
    resetPosition();
  }, [studyCards, isShuffled, setShuffledCardIds, resetPosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          toggleFlip();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextCard();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevCard();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFlip, nextCard, prevCard]);

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

  if (!deck || !cards || studyCards.length === 0) {
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
          This deck has no cards to study.
        </p>
      </div>
    );
  }

  const total = shuffledCardIds.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffle}
            className={cn("h-8 w-8", isShuffled && "text-primary")}
            title={isShuffled ? "Restore order" : "Shuffle"}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
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
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            {currentIndex + 1} / {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Flashcard with flip animation */}
      <div
        className="flex-1 flex items-center justify-center min-h-[300px] mb-6 cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={toggleFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFlip();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            "relative w-full max-w-lg h-[300px] sm:h-[360px] transition-transform duration-[400ms] ease-in-out",
            "[transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl border bg-card shadow-md flex flex-col items-center justify-center p-5 sm:p-8 overflow-y-auto">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
              French Term
            </span>
            {currentCard?.frontImage && (
              <img
                src={currentCard.frontImage.getDirectURL()}
                alt=""
                className="max-h-[120px] sm:max-h-[160px] max-w-full rounded object-contain mb-3"
              />
            )}
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl sm:text-2xl font-semibold text-foreground text-center break-words">
                {currentCard?.front}
              </p>
              {currentCard?.front && (
                <SpeakButton
                  text={currentCard.front}
                  className="h-9 w-9 mt-0.5"
                  data-ocid="flashcard.speak_button"
                />
              )}
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border bg-card shadow-md flex flex-col items-center justify-center p-5 sm:p-8 overflow-y-auto">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
              Definition
            </span>
            {currentCard?.backImage && (
              <img
                src={currentCard.backImage.getDirectURL()}
                alt=""
                className="max-h-[120px] sm:max-h-[160px] max-w-full rounded object-contain mb-3"
              />
            )}
            <p className="text-xl sm:text-2xl font-semibold text-foreground text-center break-words">
              {currentCard?.back}
            </p>
            {currentCard?.pronunciation && (
              <p className="mt-2 text-sm italic text-muted-foreground text-center">
                {currentCard.pronunciation}
              </p>
            )}
            {(currentCard?.exampleSentence ||
              currentCard?.exampleTranslation) && (
              <div className="mt-4 pt-4 border-t border-border w-full text-center space-y-1">
                {currentCard?.exampleSentence && (
                  <p className="text-sm text-foreground/80 italic">
                    {currentCard.exampleSentence}
                  </p>
                )}
                {currentCard?.exampleTranslation && (
                  <p className="text-xs text-muted-foreground">
                    {currentCard.exampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mb-4">
        <span className="sm:hidden">
          Tap card to flip · Swipe or use buttons to navigate
        </span>
        <span className="hidden sm:inline">
          Click card or press Space to flip · Arrow keys to navigate
        </span>
      </p>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="h-11 w-11 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (currentCard) {
                toggleStar({ deckId, cardId: currentCard.id });
              }
            }}
            className={cn(
              "h-11 w-11 sm:h-10 sm:w-10",
              currentCard?.starred && "text-yellow-500",
            )}
            title={currentCard?.starred ? "Unstar" : "Star"}
          >
            <Star
              className={cn("h-5 w-5", currentCard?.starred && "fill-current")}
            />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={nextCard}
          disabled={currentIndex === total - 1}
          className="h-11 w-11 sm:h-10 sm:w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
