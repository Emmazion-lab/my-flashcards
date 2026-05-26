import {
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppHeader } from "./components/AppHeader";
import { AuthLayout } from "./components/AuthLayout";
import { BrowseDecks } from "./components/BrowseDecks";
import { DeckPage } from "./components/DeckPage";
import { FlashcardStudy } from "./components/FlashcardStudy";
import { LearnMode } from "./components/LearnMode";
import { MatchGame } from "./components/MatchGame";
import { MyDecksPage } from "./components/MyDecksPage";
import { StudyLayout } from "./components/StudyLayout";
import { StudyModeSelector } from "./components/StudyModeSelector";
import { TestMode } from "./components/TestMode";
import { WriteMode } from "./components/WriteMode";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-sm w-full text-center space-y-6">
          <p className="font-display text-7xl font-bold text-muted-foreground/30">
            404
          </p>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Page not found
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <a
            href="#/"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
});

// Auth layout wraps all protected routes
const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  component: AuthLayout,
});

const myDecksRoute = createRoute({
  getParentRoute: () => authLayout,
  path: "/",
  component: MyDecksPage,
});

// Public routes (no auth required)
const publicDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deck/$deckId",
  component: DeckPage,
});

const browseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/browse",
  component: BrowseDecks,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
    category: (search.category as string) || "",
    sort: (search.sort as string) || "popular",
    page: Number(search.page) || 0,
  }),
});

// Public study routes (guests can study public decks)
const studyModeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deck/$deckId/study",
  component: PublicStudyModeSelector,
});

const studyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deck/$deckId/study/$mode",
  component: PublicStudyModeRouter,
});

function PublicStudyModeSelector() {
  return (
    <StudyLayout>
      <StudyModeSelector />
    </StudyLayout>
  );
}

function PublicStudyModeRouter() {
  const { mode } = studyRoute.useParams();
  return (
    <StudyLayout>
      {mode === "flashcards" ? (
        <FlashcardStudy />
      ) : mode === "learn" ? (
        <LearnMode />
      ) : mode === "test" ? (
        <TestMode />
      ) : mode === "match" ? (
        <MatchGame />
      ) : mode === "write" ? (
        <WriteMode />
      ) : (
        <div className="flex-1 p-6 text-center text-muted-foreground">
          Study mode "{mode}" coming soon.
        </div>
      )}
    </StudyLayout>
  );
}

const routeTree = rootRoute.addChildren([
  browseRoute,
  publicDeckRoute,
  studyModeRoute,
  studyRoute,
  authLayout.addChildren([myDecksRoute]),
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
