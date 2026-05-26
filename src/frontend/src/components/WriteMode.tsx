import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Trophy,
  XCircle,
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

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function isCloseEnough(userAnswer: string, correctAnswer: string): boolean {
  const given = userAnswer.trim().toLowerCase();
  const correct = correctAnswer.trim().toLowerCase();

  if (given === correct) return true;

  // Fuzzy matching only for answers > 5 chars
  if (correct.length > 5) {
    return levenshteinDistance(given, correct) <= 2;
  }

  return false;
}

interface CardData {
  id: bigint;
  front: string;
  back: string;
}

interface CardResult {
  card: CardData;
  userAnswer: string;
  isCorrect: boolean;
  wasOverridden: boolean;
}

type SessionState = "studying" | "complete";

export function WriteMode() {
  const { deckId: deckIdParam } = useParams({ strict: false });
  const deckId = BigInt(deckIdParam as string);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const [sessionState, setSessionState] = useState<SessionState>("studying");
  const [cardOrder, setCardOrder] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentCorrect, setCurrentCorrect] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [initialized, setInitialized] = useState(false);

  const cardData = useMemo(() => {
    if (!cards) return [];
    return cards.map((c) => ({ id: c.id, front: c.front, back: c.back }));
  }, [cards]);

  // Initialize session
  useEffect(() => {
    if (cardData.length > 0 && !initialized) {
      setCardOrder(shuffleArray(cardData));
      setCurrentIndex(0);
      setUserAnswer("");
      setIsRevealed(false);
      setResults([]);
      setSessionState("studying");
      setInitialized(true);
    }
  }, [cardData, initialized]);

  const currentCard = cardOrder[currentIndex] ?? null;

  const handleSubmit = useCallback(() => {
    if (!currentCard || isRevealed) return;
    if (!userAnswer.trim()) return;

    const correct = isCloseEnough(userAnswer, currentCard.back);
    setCurrentCorrect(correct);
    setIsRevealed(true);
  }, [currentCard, isRevealed, userAnswer]);

  const handleNext = useCallback(
    (override?: boolean) => {
      if (!currentCard) return;

      const wasCorrect = override ? true : currentCorrect;

      setResults((prev) => [
        ...prev,
        {
          card: currentCard,
          userAnswer: userAnswer.trim(),
          isCorrect: wasCorrect,
          wasOverridden: override ?? false,
        },
      ]);

      if (currentIndex + 1 >= cardOrder.length) {
        setSessionState("complete");
        if (isAuthenticated) {
          const allResults = [
            ...results,
            {
              card: currentCard,
              userAnswer: userAnswer.trim(),
              isCorrect: wasCorrect,
              wasOverridden: override ?? false,
            },
          ];
          const correct = allResults.filter((r) => r.isCorrect).length;
          saveSession({
            deckId,
            cardsStudied: BigInt(allResults.length),
            correctCount: BigInt(correct),
            mode: "write",
          });
        }
      } else {
        setCurrentIndex((i) => i + 1);
        setUserAnswer("");
        setIsRevealed(false);
        setCurrentCorrect(false);
        // Focus input for next card
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [
      currentCard,
      currentCorrect,
      userAnswer,
      currentIndex,
      cardOrder.length,
      isAuthenticated,
      results,
      deckId,
      saveSession,
    ],
  );

  const handleRestart = useCallback(() => {
    setCardOrder(shuffleArray(cardData));
    setCurrentIndex(0);
    setUserAnswer("");
    setIsRevealed(false);
    setCurrentCorrect(false);
    setResults([]);
    setSessionState("studying");
  }, [cardData]);

  // Keyboard: Enter to submit or continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionState !== "studying") return;

      if (isRevealed && e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionState, isRevealed, handleNext]);

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

  if (!deck || !cards || cards.length === 0) {
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

  if (sessionState === "complete") {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy =
      results.length > 0
        ? Math.round((correctCount / results.length) * 100)
        : 0;

    return (
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <div className="text-center space-y-6 mb-8">
          <div className="rounded-full bg-primary/10 p-6 inline-flex">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Write Complete!
            </h2>
            <p className="text-muted-foreground">
              You got {correctCount} out of {results.length} correct
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">
                {results.length}
              </p>
              <p className="text-xs text-muted-foreground">Cards</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">
                {correctCount}
              </p>
              <p className="text-xs text-muted-foreground">Correct</p>
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
              Try again
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Results</h3>
          <ScrollArea className="h-[300px] sm:h-[400px]">
            <div className="space-y-2 pr-4">
              {results.map((result) => (
                <div
                  key={result.card.id.toString()}
                  className={cn(
                    "rounded-lg border p-4",
                    result.isCorrect
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {result.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {result.card.front}
                      </p>
                      {result.isCorrect ? (
                        <p className="text-sm text-green-600">
                          {result.userAnswer}
                          {result.wasOverridden && (
                            <span className="text-muted-foreground ml-1">
                              (overridden)
                            </span>
                          )}
                        </p>
                      ) : (
                        <div className="text-sm space-y-0.5">
                          <p className="text-red-600">
                            Your answer: {result.userAnswer}
                          </p>
                          <p className="text-green-600">
                            Correct: {result.card.back}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Studying screen
  if (!currentCard) return null;

  const progress = ((currentIndex + 1) / cardOrder.length) * 100;

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
        <span className="text-sm text-muted-foreground shrink-0">
          {currentIndex + 1} / {cardOrder.length}
        </span>
      </div>

      <div className="mb-6">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Term card */}
      <div className="rounded-xl border bg-card shadow-md p-5 sm:p-8 mb-6 text-center">
        <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">
          Type the definition of
        </span>
        <div className="flex items-center justify-center gap-2">
          <p className="text-xl sm:text-2xl font-semibold text-foreground break-words">
            {currentCard.front}
          </p>
          <SpeakButton
            text={currentCard.front}
            className="h-9 w-9 shrink-0"
            data-ocid="write.speak_button"
          />
        </div>
      </div>

      {/* Answer input */}
      <div className="space-y-3 mb-6">
        <Input
          ref={inputRef}
          placeholder="Type your answer..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={isRevealed}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isRevealed && userAnswer.trim()) {
              handleSubmit();
            }
          }}
          autoFocus
        />

        {isRevealed && (
          <div
            className={cn(
              "rounded-lg border p-4",
              currentCorrect
                ? "border-green-500 bg-green-500/10"
                : "border-red-500 bg-red-500/10",
            )}
          >
            {currentCorrect ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Correct!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Incorrect</span>
                </div>
                <p className="text-sm text-foreground">
                  Correct answer: <strong>{currentCard.back}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Your answer: {userAnswer.trim()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="text-center mt-auto">
        {!isRevealed ? (
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              {!currentCorrect && (
                <Button variant="outline" onClick={() => handleNext(true)}>
                  I was right
                </Button>
              )}
              <Button onClick={() => handleNext()} size="lg">
                {currentIndex + 1 >= cardOrder.length ? "See Results" : "Next"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
