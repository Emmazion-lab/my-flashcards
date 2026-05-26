import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { BarChart3, BookOpen, Calendar, Target } from "lucide-react";
import { useGetDeckSessions } from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

function modeLabel(mode: string): string {
  switch (mode) {
    case "flashcards":
      return "Flashcards";
    case "learn":
      return "Learn";
    case "test":
      return "Test";
    case "match":
      return "Match";
    case "write":
      return "Write";
    default:
      return mode;
  }
}

export function DeckStats({ deckId }: { deckId: bigint }) {
  const { data: sessions, isLoading, isError } = useGetDeckSessions(deckId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load study history.</p>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          No study sessions yet. Start studying to track your progress.
        </p>
      </div>
    );
  }

  const totalSessions = sessions.length;
  const totalCards = sessions.reduce(
    (sum, s) => sum + Number(s.cardsStudied),
    0,
  );
  const totalCorrect = sessions.reduce(
    (sum, s) => sum + Number(s.correctCount),
    0,
  );
  const avgAccuracy =
    totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;

  const lastSession = sessions.reduce((latest, s) => {
    return Number(s.timestamp) > Number(latest.timestamp) ? s : latest;
  }, sessions[0]);
  const lastStudiedDate = fromNanoseconds(lastSession.timestamp);

  // Count sessions by mode
  const modeCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.mode] = (acc[s.mode] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Study History</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium">Sessions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium">Cards Studied</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCards}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgAccuracy}%</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Last Studied</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {formatDistanceToNow(lastStudiedDate, { addSuffix: true })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(lastStudiedDate, "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(modeCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([mode, count]) => (
            <span
              key={mode}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
            >
              {modeLabel(mode)}
              <span className="font-semibold text-foreground">{count}</span>
            </span>
          ))}
      </div>
    </div>
  );
}
