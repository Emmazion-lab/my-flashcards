import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { SpeakButton } from "../components/SpeakButton";
import {
  useGetCards,
  useGetDeck,
  useGetPublicDeck,
  useSaveStudySession,
} from "../hooks/useQueries";
import { shuffleArray } from "../utils/arrays";

interface CardData {
  id: bigint;
  front: string;
  back: string;
}

interface QueueItem {
  cardId: bigint;
}

type SessionState = "studying" | "complete";

export function LearnMode() {
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

  const [sessionState, setSessionState] = useState<SessionState>("studying");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // Store the result of the current answer so we can advance the queue on "Continue"
  const [pendingResult, setPendingResult] = useState<{
    isCorrect: boolean;
    newQueue: QueueItem[];
    newMastered: number;
    isComplete: boolean;
  } | null>(null);

  const cardMap = useMemo(() => {
    if (!cards) return new Map<string, CardData>();
    const map = new Map<string, CardData>();
    for (const c of cards) {
      map.set(c.id.toString(), { id: c.id, front: c.front, back: c.back });
    }
    return map;
  }, [cards]);

  const allBacks = useMemo(() => {
    if (!cards) return [];
    return cards.map((c) => c.back);
  }, [cards]);

  const generateOptions = useCallback(
    (correctBack: string) => {
      const wrongAnswers = allBacks.filter((b) => b !== correctBack);
      const shuffledWrong = shuffleArray(wrongAnswers).slice(0, 3);
      return shuffleArray([correctBack, ...shuffledWrong]);
    },
    [allBacks],
  );

  // Initialize session
  useEffect(() => {
    if (cards && cards.length >= 4 && !initialized) {
      const shuffled = shuffleArray(cards);
      setQueue(shuffled.map((c) => ({ cardId: c.id })));
      setTotalCards(cards.length);
      setMasteredCount(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setSessionState("studying");
      setSelectedAnswer(null);
      setIsRevealed(false);
      setPendingResult(null);
      setInitialized(true);

      const firstCard = shuffled[0];
      const cardData = cards.find((c) => c.id === firstCard.id);
      if (cardData) {
        setOptions(generateOptions(cardData.back));
      }
    }
  }, [cards, initialized, generateOptions]);

  const currentItem = queue[0] ?? null;
  const currentCard = currentItem
    ? (cardMap.get(currentItem.cardId.toString()) ?? null)
    : null;

  const handleAnswer = useCallback(
    (answer: string) => {
      if (isRevealed || !currentCard || !currentItem) return;

      setSelectedAnswer(answer);
      setIsRevealed(true);

      const isCorrect = answer === currentCard.back;

      if (isCorrect) {
        // Correct - mastered, remove from queue
        const newQueue = queue.slice(1);
        const newMastered = masteredCount + 1;
        setPendingResult({
          isCorrect: true,
          newQueue,
          newMastered,
          isComplete: newQueue.length === 0,
        });
        setCorrectCount((c) => c + 1);
      } else {
        setIncorrectCount((c) => c + 1);
        // Incorrect: reset streak, re-insert 3-5 positions ahead
        const insertPos = Math.min(
          3 + Math.floor(Math.random() * 3),
          queue.length - 1,
        );
        const newQueue = queue.slice(1);
        newQueue.splice(insertPos, 0, { cardId: currentItem.cardId });
        setPendingResult({
          isCorrect: false,
          newQueue,
          newMastered: masteredCount,
          isComplete: false,
        });
      }
    },
    [isRevealed, currentCard, currentItem, queue, masteredCount],
  );

  const handleContinue = useCallback(() => {
    if (!pendingResult) return;

    const { newQueue, newMastered, isComplete } = pendingResult;

    setMasteredCount(newMastered);

    if (isComplete) {
      setQueue([]);
      setSessionState("complete");
      if (isAuthenticated) {
        saveSession({
          deckId,
          cardsStudied: BigInt(
            correctCount + incorrectCount + (pendingResult.isCorrect ? 1 : 0),
          ),
          correctCount: BigInt(
            correctCount + (pendingResult.isCorrect ? 1 : 0),
          ),
          mode: "learn",
        });
      }
    } else {
      setQueue(newQueue);
      // Generate options for the next card
      const nextItem = newQueue[0];
      if (nextItem) {
        const nextCard = cardMap.get(nextItem.cardId.toString());
        if (nextCard) {
          setOptions(generateOptions(nextCard.back));
        }
      }
    }

    setSelectedAnswer(null);
    setIsRevealed(false);
    setPendingResult(null);
  }, [
    pendingResult,
    isAuthenticated,
    deckId,
    correctCount,
    incorrectCount,
    saveSession,
    cardMap,
    generateOptions,
  ]);

  const handleRestart = useCallback(() => {
    if (!cards) return;
    const shuffled = shuffleArray(cards);
    setQueue(shuffled.map((c) => ({ cardId: c.id })));
    setMasteredCount(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSessionState("studying");
    setSelectedAnswer(null);
    setIsRevealed(false);
    setPendingResult(null);

    const firstCard = shuffled[0];
    const cardData = cards.find((c) => c.id === firstCard.id);
    if (cardData) {
      setOptions(generateOptions(cardData.back));
    }
  }, [cards, generateOptions]);

  // Keyboard: 1-4 to select, Enter/Space to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (isRevealed) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleContinue();
        }
        return;
      }

      const num = Number.parseInt(e.key);
      if (num >= 1 && num <= 4 && num <= options.length) {
        e.preventDefault();
        handleAnswer(options[num - 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, options, handleAnswer, handleContinue]);

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
          Learn mode requires at least 4 cards for multiple-choice questions.
        </p>
      </div>
    );
  }

  const progress = totalCards > 0 ? (masteredCount / totalCards) * 100 : 0;

  if (sessionState === "complete") {
    const accuracy =
      correctCount + incorrectCount > 0
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
        : 0;

    return (
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="rounded-full bg-primary/10 p-6 inline-flex">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Session Complete!
            </h2>
            <p className="text-muted-foreground">
              You've mastered all {totalCards} cards in this deck.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">{totalCards}</p>
              <p className="text-xs text-muted-foreground">Cards</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">
                {correctCount + incorrectCount}
              </p>
              <p className="text-xs text-muted-foreground">Attempts</p>
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
              Study again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            {masteredCount} / {totalCards} mastered
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {currentCard && (
        <div className="flex-1 flex flex-col">
          {/* Question card */}
          <div className="rounded-xl border bg-card shadow-md p-5 sm:p-8 mb-6 text-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">
              What is the definition of
            </span>
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl sm:text-2xl font-semibold text-foreground break-words">
                {currentCard.front}
              </p>
              <SpeakButton
                text={currentCard.front}
                className="h-9 w-9 mt-0.5 shrink-0"
                data-ocid="learn.speak_button"
              />
            </div>
          </div>

          {/* Answer options */}
          <div className="grid gap-3 mb-6">
            {options.map((option, i) => {
              const isCorrectOption = option === currentCard.back;
              const isSelected = selectedAnswer === option;

              return (
                <button
                  type="button"
                  key={`${currentCard.id}-${i}`}
                  onClick={() => handleAnswer(option)}
                  disabled={isRevealed}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-colors",
                    "flex items-center gap-3",
                    !isRevealed &&
                      "hover:border-primary/50 hover:bg-accent/50 cursor-pointer",
                    isRevealed &&
                      isCorrectOption &&
                      "border-green-500 bg-green-500/10",
                    isRevealed &&
                      isSelected &&
                      !isCorrectOption &&
                      "border-red-500 bg-red-500/10",
                    isRevealed &&
                      !isCorrectOption &&
                      !isSelected &&
                      "opacity-50",
                    isRevealed && "cursor-default",
                  )}
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground break-words">
                    {option}
                  </span>
                  {isRevealed && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                  {isRevealed && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Continue button after answer */}
          {isRevealed && (
            <div className="text-center">
              <Button onClick={handleContinue} size="lg">
                Continue
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter or Space to continue
              </p>
            </div>
          )}

          {!isRevealed && (
            <p className="text-center text-xs text-muted-foreground">
              Press 1-4 to select an answer
            </p>
          )}
        </div>
      )}
    </div>
  );
}
