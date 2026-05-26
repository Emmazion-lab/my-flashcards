import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type QuestionType = "multiple-choice" | "true-false" | "written";

interface MultipleChoiceQuestion {
  type: "multiple-choice";
  card: CardData;
  options: string[];
}

interface TrueFalseQuestion {
  type: "true-false";
  card: CardData;
  shownAnswer: string;
  isCorrectPairing: boolean;
}

interface WrittenQuestion {
  type: "written";
  card: CardData;
}

type Question = MultipleChoiceQuestion | TrueFalseQuestion | WrittenQuestion;

interface Answer {
  questionIndex: number;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

type SessionState = "config" | "testing" | "complete";

function generateQuestions(cards: CardData[], count: number): Question[] {
  const shuffled = shuffleArray(cards);
  const selected = shuffled.slice(0, count);
  const allBacks = cards.map((c) => c.back);

  const types: QuestionType[] = ["multiple-choice", "true-false", "written"];

  return selected.map((card, i) => {
    const type = types[i % 3];

    if (type === "multiple-choice") {
      const wrongAnswers = shuffleArray(
        allBacks.filter((b) => b !== card.back),
      ).slice(0, 3);
      const options = shuffleArray([card.back, ...wrongAnswers]);
      return { type, card, options };
    }

    if (type === "true-false") {
      const isCorrectPairing = Math.random() > 0.5;
      let shownAnswer = card.back;
      if (!isCorrectPairing) {
        const others = allBacks.filter((b) => b !== card.back);
        shownAnswer = others[Math.floor(Math.random() * others.length)];
      }
      return { type, card, shownAnswer, isCorrectPairing };
    }

    return { type: "written" as const, card };
  });
}

export function TestMode() {
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

  const [sessionState, setSessionState] = useState<SessionState>("config");
  const [questionCount, setQuestionCount] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  const cardData = useMemo(() => {
    if (!cards) return [];
    return cards.map((c) => ({ id: c.id, front: c.front, back: c.back }));
  }, [cards]);

  const maxQuestions = cardData.length;

  // Set default question count when cards load
  useEffect(() => {
    if (cardData.length > 0 && questionCount === 0) {
      setQuestionCount(cardData.length);
    }
  }, [cardData.length, questionCount]);

  const handleStartTest = useCallback(() => {
    if (cardData.length < 4) return;
    const q = generateQuestions(cardData, questionCount);
    setQuestions(q);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setTrueFalseAnswer(null);
    setWrittenAnswer("");
    setIsRevealed(false);
    setSessionState("testing");
  }, [cardData, questionCount]);

  const currentQuestion = questions[currentIndex] ?? null;

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || isRevealed) return;

    let isCorrect = false;
    let userAnswer = "";

    if (currentQuestion.type === "multiple-choice") {
      if (!selectedOption) return;
      isCorrect = selectedOption === currentQuestion.card.back;
      userAnswer = selectedOption;
    } else if (currentQuestion.type === "true-false") {
      if (trueFalseAnswer === null) return;
      isCorrect = trueFalseAnswer === currentQuestion.isCorrectPairing;
      userAnswer = trueFalseAnswer ? "True" : "False";
    } else {
      if (!writtenAnswer.trim()) return;
      userAnswer = writtenAnswer.trim();
      const correct = currentQuestion.card.back.trim().toLowerCase();
      const given = userAnswer.toLowerCase();
      isCorrect = given === correct;
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        isCorrect,
        userAnswer,
        correctAnswer: currentQuestion.card.back,
      },
    ]);
    setIsRevealed(true);
  }, [
    currentQuestion,
    selectedOption,
    trueFalseAnswer,
    writtenAnswer,
    currentIndex,
    isRevealed,
  ]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setSessionState("complete");
      if (isAuthenticated) {
        const correct = answers.filter((a) => a.isCorrect).length;
        saveSession({
          deckId,
          cardsStudied: BigInt(questions.length),
          correctCount: BigInt(correct),
          mode: "test",
        });
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setTrueFalseAnswer(null);
      setWrittenAnswer("");
      setIsRevealed(false);
    }
  }, [
    currentIndex,
    questions.length,
    isAuthenticated,
    deckId,
    answers,
    saveSession,
  ]);

  const handleRestart = useCallback(() => {
    setSessionState("config");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setTrueFalseAnswer(null);
    setWrittenAnswer("");
    setIsRevealed(false);
  }, []);

  // Keyboard: Enter to submit/continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (sessionState === "testing") {
        if (isRevealed && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleNext();
          return;
        }

        if (!isRevealed && currentQuestion?.type === "multiple-choice") {
          const num = Number.parseInt(e.key);
          if (num >= 1 && num <= 4 && currentQuestion.options[num - 1]) {
            e.preventDefault();
            setSelectedOption(currentQuestion.options[num - 1]);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionState, isRevealed, handleNext, currentQuestion]);

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
          Test mode requires at least 4 cards for multiple-choice questions.
        </p>
      </div>
    );
  }

  // Config screen
  if (sessionState === "config") {
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

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Test Settings
            </h2>
            <p className="text-muted-foreground">{deck.title}</p>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-count">Number of questions</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="question-count"
                  type="number"
                  min={4}
                  max={maxQuestions}
                  value={questionCount}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value);
                    if (!Number.isNaN(val)) {
                      setQuestionCount(
                        Math.max(4, Math.min(val, maxQuestions)),
                      );
                    }
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  of {cardData.length} cards
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Question types</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Multiple Choice</Badge>
                <Badge variant="secondary">True / False</Badge>
                <Badge variant="secondary">Written Answer</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Questions are mixed automatically across all types.
              </p>
            </div>
          </div>

          <Button
            onClick={handleStartTest}
            size="lg"
            className="w-full sm:w-auto"
          >
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  // Complete screen
  if (sessionState === "complete") {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / answers.length) * 100);

    return (
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <div className="text-center space-y-6 mb-8">
          <div className="rounded-full bg-primary/10 p-6 inline-flex">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Test Complete!
            </h2>
            <p className="text-muted-foreground">
              You scored {correctCount} out of {answers.length}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center p-3 rounded-lg border bg-card">
              <p className="text-2xl font-bold text-foreground">
                {answers.length}
              </p>
              <p className="text-xs text-muted-foreground">Questions</p>
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
              Retake
            </Button>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Question Breakdown</h3>
          <ScrollArea className="h-[300px] sm:h-[400px]">
            <div className="space-y-2 pr-4">
              {answers.map((answer, i) => {
                const question = questions[answer.questionIndex];
                return (
                  <div
                    key={question.card.id.toString()}
                    className={cn(
                      "rounded-lg border p-4",
                      answer.isCorrect
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {answer.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            Q{i + 1}: {question.card.front}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {question.type === "multiple-choice"
                              ? "MC"
                              : question.type === "true-false"
                                ? "T/F"
                                : "Written"}
                          </Badge>
                        </div>
                        {!answer.isCorrect && (
                          <div className="text-sm">
                            <p className="text-red-600">
                              Your answer: {answer.userAnswer}
                            </p>
                            <p className="text-green-600">
                              Correct: {answer.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Testing screen
  if (!currentQuestion) return null;

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentIndex];

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
        <Badge variant="outline" className="shrink-0">
          {currentIndex + 1} / {questions.length}
        </Badge>
      </div>

      <div className="mb-6">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question card */}
      <div className="rounded-xl border bg-card shadow-md p-5 sm:p-8 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {currentQuestion.type === "multiple-choice"
              ? "Multiple Choice"
              : currentQuestion.type === "true-false"
                ? "True / False"
                : "Written Answer"}
          </Badge>
        </div>

        {currentQuestion.type === "true-false" ? (
          <>
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">
              Is this the correct definition?
            </span>
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-xl sm:text-2xl font-semibold text-foreground break-words">
                {currentQuestion.card.front}
              </p>
              <SpeakButton
                text={currentQuestion.card.front}
                className="h-9 w-9 shrink-0"
                data-ocid="test.speak_button"
              />
            </div>
            <p className="text-lg text-muted-foreground border-t pt-3 break-words">
              "{currentQuestion.shownAnswer}"
            </p>
          </>
        ) : (
          <>
            <span className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">
              {currentQuestion.type === "written"
                ? "Type the definition of"
                : "What is the definition of"}
            </span>
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl sm:text-2xl font-semibold text-foreground break-words">
                {currentQuestion.card.front}
              </p>
              <SpeakButton
                text={currentQuestion.card.front}
                className="h-9 w-9 shrink-0"
                data-ocid="test.speak_button"
              />
            </div>
          </>
        )}
      </div>

      {/* Answer area */}
      <div className="mb-6">
        {currentQuestion.type === "multiple-choice" && (
          <div className="grid gap-3">
            {currentQuestion.options.map((option, i) => {
              const isCorrectOption = option === currentQuestion.card.back;
              const isSelected = selectedOption === option;

              return (
                <button
                  type="button"
                  key={`${currentQuestion.card.id}-${i}`}
                  onClick={() => !isRevealed && setSelectedOption(option)}
                  disabled={isRevealed}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-colors",
                    "flex items-center gap-3",
                    !isRevealed && isSelected && "border-primary bg-primary/5",
                    !isRevealed &&
                      !isSelected &&
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
        )}

        {currentQuestion.type === "true-false" && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((value) => {
              const label = value ? "True" : "False";
              const isSelected = trueFalseAnswer === value;
              const isCorrectChoice =
                value === currentQuestion.isCorrectPairing;

              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => !isRevealed && setTrueFalseAnswer(value)}
                  disabled={isRevealed}
                  className={cn(
                    "p-4 rounded-lg border transition-colors text-center font-medium",
                    !isRevealed && isSelected && "border-primary bg-primary/5",
                    !isRevealed &&
                      !isSelected &&
                      "hover:border-primary/50 hover:bg-accent/50 cursor-pointer",
                    isRevealed &&
                      isCorrectChoice &&
                      "border-green-500 bg-green-500/10",
                    isRevealed &&
                      isSelected &&
                      !isCorrectChoice &&
                      "border-red-500 bg-red-500/10",
                    isRevealed &&
                      !isCorrectChoice &&
                      !isSelected &&
                      "opacity-50",
                    isRevealed && "cursor-default",
                  )}
                >
                  <span className="text-foreground">{label}</span>
                  {isRevealed && isCorrectChoice && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mt-2" />
                  )}
                  {isRevealed && isSelected && !isCorrectChoice && (
                    <XCircle className="h-5 w-5 text-red-500 mx-auto mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.type === "written" && (
          <div className="space-y-3">
            <Input
              placeholder="Type your answer..."
              value={writtenAnswer}
              onChange={(e) => setWrittenAnswer(e.target.value)}
              disabled={isRevealed}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRevealed && writtenAnswer.trim()) {
                  handleSubmitAnswer();
                }
              }}
              autoFocus
            />
            {isRevealed && currentAnswer && (
              <div
                className={cn(
                  "rounded-lg border p-3",
                  currentAnswer.isCorrect
                    ? "border-green-500 bg-green-500/10"
                    : "border-red-500 bg-red-500/10",
                )}
              >
                {currentAnswer.isCorrect ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Correct!</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Incorrect</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Correct answer:{" "}
                      <strong>{currentQuestion.card.back}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit / Continue */}
      <div className="text-center mt-auto">
        {!isRevealed ? (
          <Button
            onClick={handleSubmitAnswer}
            size="lg"
            disabled={
              (currentQuestion.type === "multiple-choice" && !selectedOption) ||
              (currentQuestion.type === "true-false" &&
                trueFalseAnswer === null) ||
              (currentQuestion.type === "written" && !writtenAnswer.trim())
            }
          >
            Submit Answer
          </Button>
        ) : (
          <div>
            <Button onClick={handleNext} size="lg">
              {currentIndex + 1 >= questions.length
                ? "See Results"
                : "Next Question"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter or Space to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
