import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { useGetMyDecks } from "../hooks/useQueries";
import { CreateDeckDialog } from "./CreateDeckDialog";
import { DeckCard } from "./DeckCard";
import { SharedDecksSection } from "./SharedDecksSection";

export function MyDecksPage() {
  const { data: decks, isLoading, isError } = useGetMyDecks();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  if (isError) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <p className="text-destructive">Failed to load decks.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">
            My French Decks
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Study, build, and grow your vocabulary
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="min-h-[44px]"
          data-ocid="my_decks.create_deck_button"
        >
          <Plus className="h-4 w-4" />
          New Deck
        </Button>
      </div>

      <Tabs defaultValue="my-decks" data-ocid="my_decks.tabs">
        <TabsList className="mb-4">
          <TabsTrigger value="my-decks" data-ocid="my_decks.my_decks_tab">
            My Decks
          </TabsTrigger>
          <TabsTrigger value="shared" data-ocid="my_decks.shared_tab">
            Shared with Me
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-decks" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                  key={i}
                  className="rounded-lg border bg-card p-5 space-y-3"
                >
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : decks && decks.length > 0 ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="my_decks.list"
            >
              {decks.map((deck, i) => (
                <DeckCard
                  key={Number(deck.id)}
                  deck={deck}
                  index={i}
                  onClick={() =>
                    navigate({
                      to: "/deck/$deckId",
                      params: { deckId: deck.id.toString() },
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="my_decks.empty_state"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                Start your French journey
              </h3>
              <p className="text-muted-foreground mb-5 max-w-xs">
                Your French decks will appear here. Create your first deck or
                explore the sample decks loaded for you.
              </p>
              <Button
                onClick={() => setCreateOpen(true)}
                className="min-h-[44px]"
                data-ocid="my_decks.create_first_button"
              >
                <Plus className="h-4 w-4" />
                Create Your First Deck
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-0">
          <SharedDecksSection />
        </TabsContent>
      </Tabs>

      <CreateDeckDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
