import { Button } from "@/components/ui/button";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { createActor } from "../backend";
import {
  useGetDeck,
  useGetPublicDeck,
  useIsDeckOwner,
  useProfile,
} from "../hooks/useQueries";
import { AppHeader } from "./AppHeader";
import { DeckDetailPage } from "./DeckDetailPage";
import { ProfileSetupDialog } from "./ProfileSetupDialog";
import { PublicDeckDetail } from "./PublicDeckDetail";

export function DeckPage() {
  const { deckId: deckIdParam } = useParams({ strict: false });
  const isValidId = /^\d+$/.test(deckIdParam as string);
  const deckId = isValidId ? BigInt(deckIdParam as string) : BigInt(0);
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);
  const isAuthenticated = !!identity;

  const { data: profile, isLoading: isProfileLoading } = useProfile();

  const { data: _publicDeck } = useGetPublicDeck(deckId);

  const { data: isOwner, isLoading: isOwnerLoading } = useIsDeckOwner(deckId);

  // getDeck works for owners, public, and shared users
  const { data: accessibleDeck } = useGetDeck(deckId);
  const hasSharedAccess = isAuthenticated && !isOwner && !!accessibleDeck;

  // Loading state
  if (
    isInitializing ||
    !actor ||
    isFetching ||
    (isAuthenticated && isOwnerLoading)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidId) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Deck not found
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This deck may have been deleted or the link could be incorrect.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/browse",
                  search: { q: "", category: "", sort: "popular", page: 0 },
                })
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Browse public decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasProfile = profile?.username;

  // Owner view
  if (isOwner && isAuthenticated) {
    if (isProfileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <>
        <ProfileSetupDialog open={!hasProfile} />
        <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
          <AppHeader />
          <DeckDetailPage isOwner />
        </div>
      </>
    );
  }

  // Shared user view (read-only)
  if (hasSharedAccess) {
    return (
      <>
        {!hasProfile && <ProfileSetupDialog open />}
        <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
          <AppHeader />
          <DeckDetailPage isOwner={false} />
        </div>
      </>
    );
  }

  // Public view
  return (
    <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
      <AppHeader />
      <PublicDeckDetail />
    </div>
  );
}
