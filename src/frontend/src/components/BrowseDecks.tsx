import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Globe, Search } from "lucide-react";
import { useState } from "react";
import { useGetPublicDecks } from "../hooks/useQueries";
import { CATEGORIES } from "../utils/constants";
import { AppHeader } from "./AppHeader";
import { PublicDeckCard } from "./PublicDeckCard";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "alphabetical", label: "A-Z" },
] as const;

export function BrowseDecks() {
  const { q, category, sort, page } = useSearch({ strict: false }) as {
    q: string;
    category: string;
    sort: string;
    page: number;
  };
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading, isFetching, isError } = useGetPublicDecks(
    q,
    category,
    sort,
    page,
    PAGE_SIZE,
  );

  const totalPages = data ? Math.ceil(Number(data.total) / PAGE_SIZE) : 0;

  const updateParams = (updates: Record<string, string | number>) => {
    const next = { q, category, sort, page, ...updates };
    navigate({
      to: "/browse",
      search: next,
      replace: true,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim(), page: 0 });
  };

  const handleCategoryToggle = (cat: string) => {
    updateParams({ category: category === cat ? "" : cat, page: 0 });
  };

  const handleSortChange = (value: string) => {
    updateParams({ sort: value, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
      <AppHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display mb-1">
            Browse French Decks
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover community decks and add them to your library
          </p>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search French decks..."
                className="pl-9"
                data-ocid="browse.search_input"
              />
            </div>
            <Button type="submit" data-ocid="browse.search_button">
              Search
            </Button>
          </form>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger
              className="w-full sm:w-[140px]"
              data-ocid="browse.sort_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors min-h-[32px] flex items-center",
                category === cat ? "" : "hover:bg-accent",
              )}
              onClick={() => handleCategoryToggle(cat)}
              data-ocid={`browse.category_filter.${cat.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Results */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-4 pt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div
            className="text-center py-20 text-destructive"
            data-ocid="browse.error_state"
          >
            Failed to load decks.
          </div>
        )}

        {data &&
          !isLoading &&
          (data.decks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="browse.empty_state"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                No French decks found
              </h3>
              <p className="text-muted-foreground">
                {q || category
                  ? "Try different keywords or remove the category filter."
                  : "Be the first to share a French vocabulary deck with the community!"}
              </p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200",
                  isFetching && "opacity-50 pointer-events-none",
                )}
                data-ocid="browse.deck_list"
              >
                {data.decks.map((deck, i) => (
                  <PublicDeckCard
                    key={Number(deck.deckId)}
                    deck={deck}
                    onClick={() =>
                      navigate({
                        to: "/deck/$deckId",
                        params: { deckId: deck.deckId.toString() },
                      })
                    }
                    data-ocid={`browse.deck.item.${i + 1}`}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(0, page - 1))}
                        className={cn(
                          page === 0 && "pointer-events-none opacity-50",
                        )}
                        data-ocid="browse.pagination_prev"
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i)
                      .filter((i) => {
                        if (i === 0 || i === totalPages - 1) return true;
                        return Math.abs(i - page) <= 1;
                      })
                      .map((i, idx, arr) => (
                        <PaginationItem key={i}>
                          {idx > 0 && arr[idx - 1] !== i - 1 && (
                            <span className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )}
                          <PaginationLink
                            isActive={i === page}
                            onClick={() => handlePageChange(i)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(Math.min(totalPages - 1, page + 1))
                        }
                        className={cn(
                          page === totalPages - 1 &&
                            "pointer-events-none opacity-50",
                        )}
                        data-ocid="browse.pagination_next"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ))}
      </main>
    </div>
  );
}
