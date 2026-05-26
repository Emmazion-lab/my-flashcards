import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ClipboardList,
  GraduationCap,
  Grid3X3,
  Layers,
  PenLine,
  Star,
} from "lucide-react";
import { useGetCards, useGetDeck, useGetPublicDeck } from "../hooks/useQueries";
import { useStudyStore } from "../hooks/useStudyStore";

const STUDY_MODES = [
  {
    id: "flashcards",
    name: "Flashcards",
    description: "Flip through cards at your own pace",
    icon: Layers,
    minCards: 1,
  },
  {
    id: "learn",
    name: "Learn",
    description: "Multiple-choice questions with spaced repetition",
    icon: GraduationCap,
    minCards: 4,
  },
  {
    id: "test",
    name: "Test",
    description:
      "Mixed quiz with multiple choice, true/false, and written answers",
    icon: ClipboardList,
    minCards: 4,
  },
  {
    id: "match",
    name: "Match",
    description: "Match terms with definitions in a timed game",
    icon: Grid3X3,
    minCards: 4,
  },
  {
    id: "write",
    name: "Write",
    description: "Type the answer from memory",
    icon: PenLine,
    minCards: 1,
  },
] as const;

export function StudyModeSelector() {
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

  const { studyStarredOnly, setStudyStarredOnly } = useStudyStore();
  const cardCount = cards?.length ?? 0;
  const starredCount = cards?.filter((c) => c.starred).length ?? 0;

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
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loader has no unique IDs
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!deck) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate({ to: "/deck/$deckId", params: { deckId: deckIdParam! } })
        }
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {deck.title}
      </Button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold font-display text-foreground mb-1">
          Choose a study mode
        </h2>
        <p className="text-muted-foreground">
          {deck.title} · {studyStarredOnly ? starredCount : cardCount}{" "}
          {(studyStarredOnly ? starredCount : cardCount) === 1
            ? "card"
            : "cards"}
          {studyStarredOnly && " (starred)"}
        </p>
      </div>

      {isOwner && starredCount > 0 && (
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg border bg-card">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
          <Label
            htmlFor="starred-only"
            className="flex-1 cursor-pointer text-sm"
          >
            Study starred cards only ({starredCount})
          </Label>
          <Switch
            id="starred-only"
            checked={studyStarredOnly}
            onCheckedChange={setStudyStarredOnly}
          />
        </div>
      )}

      {(studyStarredOnly ? starredCount : cardCount) === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            This deck has no cards. Add some cards before studying.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {STUDY_MODES.map((mode) => {
            const effectiveCount = studyStarredOnly ? starredCount : cardCount;
            const disabled = effectiveCount < mode.minCards;
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className={cn(
                  "transition-colors cursor-pointer",
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-primary/50 hover:bg-accent/50",
                )}
                onClick={() => {
                  if (!disabled) {
                    navigate({
                      to: "/deck/$deckId/study/$mode",
                      params: { deckId: deckIdParam!, mode: mode.id },
                    });
                  }
                }}
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {mode.name}
                      </h3>
                      {disabled && (
                        <Badge variant="outline" className="text-xs">
                          {mode.minCards}+ cards needed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
