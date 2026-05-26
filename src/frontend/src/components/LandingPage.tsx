import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Search } from "lucide-react";
import type React from "react";
import { useState } from "react";

function WavyUnderline({
  className,
  style,
}: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      fill="none"
      className={className}
      style={style}
      preserveAspectRatio="none"
    >
      <path
        d="M2 8 C30 2, 50 12, 80 6 S130 0, 160 7 S190 4, 198 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ScatteredCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Card 1 — top left, navy, Bonjour */}
      <div
        className="absolute -top-6 -left-8 sm:top-16 sm:left-6 lg:left-12 w-40 sm:w-44 h-56 sm:h-60 animate-card-enter-1"
        style={{ "--rotate": "-12deg" } as React.CSSProperties}
      >
        <div className="w-full h-full rounded-2xl bg-card border border-border shadow-lg rotate-[-12deg] overflow-hidden animate-card-float-slow">
          <div className="h-1.5" style={{ backgroundColor: "#003f87" }} />
          <div className="p-4 ruled-lines h-full">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] uppercase tracking-[0.15em] font-bold"
                style={{ color: "#003f87" }}
              >
                Greetings
              </span>
              <span className="text-xs">🇫🇷</span>
            </div>
            <p
              className="text-lg font-display font-bold leading-snug"
              style={{ color: "#003f87" }}
            >
              Bonjour
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/50">
              bon-ZHOOR
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground/40 leading-relaxed">
              Hello / Good morning
            </p>
          </div>
        </div>
      </div>

      {/* Card 2 — top right, red, Merci */}
      <div
        className="absolute -top-4 -right-6 sm:top-20 sm:right-8 lg:right-16 w-40 sm:w-44 h-56 sm:h-60 animate-card-enter-2"
        style={{ "--rotate": "8deg" } as React.CSSProperties}
      >
        <div className="w-full h-full rounded-2xl bg-card border border-border shadow-lg rotate-[8deg] overflow-hidden animate-card-float">
          <div className="h-1.5" style={{ backgroundColor: "#ef3b36" }} />
          <div className="p-4 ruled-lines h-full">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] uppercase tracking-[0.15em] font-bold"
                style={{ color: "#ef3b36" }}
              >
                Politeness
              </span>
              <span className="text-xs">🤝</span>
            </div>
            <p
              className="text-lg font-display font-bold leading-snug"
              style={{ color: "#ef3b36" }}
            >
              Merci
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/50">
              mehr-SEE
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground/40 leading-relaxed">
              Thank you
            </p>
          </div>
        </div>
      </div>

      {/* Card 3 — bottom left, flip animation */}
      <div
        className="absolute bottom-12 -left-6 sm:bottom-20 sm:left-4 lg:left-16 w-40 sm:w-44 h-56 sm:h-60 animate-card-enter-3"
        style={
          {
            "--rotate": "5deg",
            perspective: "600px",
          } as React.CSSProperties
        }
      >
        <div
          className="relative w-full h-full animate-card-flip"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="card-front-content absolute inset-0 rounded-2xl bg-card border border-border shadow-xl overflow-hidden rotate-[5deg]">
            <div className="h-1.5" style={{ backgroundColor: "#003f87" }} />
            <div className="p-4 ruled-lines h-full">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[9px] uppercase tracking-[0.15em] font-bold"
                  style={{ color: "#003f87" }}
                >
                  Food
                </span>
                <span className="text-xs">🥖</span>
              </div>
              <p
                className="text-lg font-display font-bold leading-snug"
                style={{ color: "#003f87" }}
              >
                La boulangerie
              </p>
              <p className="mt-3 text-[10px] text-muted-foreground/50 italic">
                tap to flip
              </p>
            </div>
          </div>
          <div className="card-back-content rounded-2xl bg-card border border-border shadow-xl overflow-hidden rotate-[5deg]">
            <div className="h-1.5" style={{ backgroundColor: "#003f87" }} />
            <div className="p-4 ruled-lines h-full">
              <span
                className="text-[9px] uppercase tracking-[0.15em] font-bold"
                style={{ color: "#003f87" }}
              >
                Answer
              </span>
              <p className="mt-2 text-[10px] text-foreground/70 leading-relaxed">
                The bakery — a shop that sells freshly baked bread, croissants,
                and pastries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4 — bottom right, Travel */}
      <div
        className="absolute bottom-10 -right-4 sm:bottom-16 sm:right-6 lg:right-20 w-40 sm:w-44 h-56 sm:h-60 animate-card-enter-4"
        style={{ "--rotate": "-6deg" } as React.CSSProperties}
      >
        <div className="w-full h-full rounded-2xl bg-card border border-border shadow-lg rotate-[-6deg] overflow-hidden animate-card-float">
          <div className="h-1.5" style={{ backgroundColor: "#ef3b36" }} />
          <div className="p-4 ruled-lines h-full">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] uppercase tracking-[0.15em] font-bold"
                style={{ color: "#ef3b36" }}
              >
                Travel
              </span>
              <span className="text-xs">🗻</span>
            </div>
            <p
              className="text-lg font-display font-bold leading-snug"
              style={{ color: "#ef3b36" }}
            >
              Où est...?
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/50">oo-ay</p>
            <p className="mt-2 text-[10px] text-muted-foreground/40">
              Where is...?
            </p>
          </div>
        </div>
      </div>

      {/* Decorative dots in tricolore colors */}
      <div className="hidden sm:block">
        <div
          className="absolute top-[18%] left-[22%] w-3 h-3 rounded-full animate-dot-1"
          style={{ backgroundColor: "rgba(0,63,135,0.25)" }}
        />
        <div
          className="absolute top-[12%] right-[30%] w-2 h-2 rounded-full animate-dot-2"
          style={{ backgroundColor: "rgba(239,59,54,0.3)" }}
        />
        <div
          className="absolute bottom-[25%] left-[35%] w-2.5 h-2.5 rounded-full animate-dot-3"
          style={{ backgroundColor: "rgba(0,63,135,0.2)" }}
        />
        <div
          className="absolute bottom-[15%] right-[28%] w-2 h-2 rounded-full animate-dot-4"
          style={{ backgroundColor: "rgba(239,59,54,0.25)" }}
        />
        <div
          className="absolute top-[45%] right-[12%] w-1.5 h-1.5 rounded-full animate-dot-2"
          style={{ backgroundColor: "rgba(0,63,135,0.15)" }}
        />
        <div
          className="absolute top-[55%] left-[10%] w-2 h-2 rounded-full animate-dot-4"
          style={{ backgroundColor: "rgba(239,59,54,0.15)" }}
        />
      </div>
    </div>
  );
}

const MODE_COLORS: Record<string, string> = {
  Flashcards: "bg-primary/10 text-primary border-primary/20",
  "Learn Mode": "border-[#ef3b36]/20 text-[#ef3b36] bg-[#ef3b36]/10",
  "Track Progress": "bg-primary/10 text-primary border-primary/20",
  Phonetics: "border-[#ef3b36]/20 text-[#ef3b36] bg-[#ef3b36]/10",
  "Share Decks": "bg-primary/10 text-primary border-primary/20",
};

export const LandingPage: React.FC = () => {
  const { login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: "/browse",
        search: {
          q: searchQuery.trim(),
          category: "",
          sort: "popular",
          page: 0,
        },
      });
    }
  };

  return (
    <div className="h-dvh overflow-hidden landing-bg landing-dots relative flex flex-col">
      {/* Scattered flashcards */}
      <ScatteredCards />

      {/* Top bar */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-4 animate-fade-up"
        style={{ backgroundColor: "#003f87" }}
      >
        <span className="font-display font-bold text-white text-2xl tracking-tight flex items-center gap-2">
          <span role="img" aria-label="French flag">
            🇫🇷
          </span>
          Français Flashcards
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => login()}
          disabled={isLoggingIn}
          className="text-white/80 hover:text-white hover:bg-white/10"
          data-ocid="landing.sign_in_button"
        >
          Sign in
        </Button>
      </nav>

      {/* Center content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          {/* Headline */}
          <h1 className="select-none mb-5 sm:mb-6">
            <span className="block font-display font-black text-foreground text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight animate-fade-up-delay-1">
              Memorize{" "}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: "#003f87" }}>
                  French
                </span>
                <WavyUnderline
                  className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3"
                  style={{ color: "#ef3b36" }}
                />
              </span>
            </span>
            <span
              className="block font-display font-light italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.2] mt-2 sm:mt-3 animate-fade-up-delay-2"
              style={{ color: "#003f87", opacity: 0.5 }}
            >
              Words &amp; Phrases
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-sm mx-auto leading-relaxed animate-fade-up-delay-2">
            Flip cards, learn with phonetics, track your progress. Built for
            French beginners.
          </p>

          {/* Study mode pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-5 animate-fade-up-delay-3">
            {Object.entries(MODE_COLORS).map(([mode, colors]) => (
              <span
                key={mode}
                className={cn(
                  "text-[11px] font-bold px-3 py-1.5 rounded-full border",
                  colors,
                )}
              >
                {mode}
              </span>
            ))}
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-6 sm:mt-7 animate-fade-up-delay-3"
          >
            <div className="relative max-w-md mx-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors z-10" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search French decks... food, travel, phrases"
                className="h-12 pl-11 pr-12"
                data-ocid="landing.search_input"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg"
                data-ocid="landing.search_button"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 animate-fade-up-delay-4">
            <Button variant="outline" size="lg" asChild>
              <a
                href="#/browse"
                className="group"
                data-ocid="landing.browse_button"
              >
                Browse French decks
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Button>
            <Button
              size="lg"
              onClick={() => login()}
              disabled={isLoggingIn}
              style={{ backgroundColor: "#ef3b36", color: "#ffffff" }}
              className="hover:opacity-90"
              data-ocid="landing.get_started_button"
            >
              {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
              Get Started — It's Free
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-center px-6 py-4 text-sm text-muted-foreground/60">
        &copy; {new Date().getFullYear()}. Built with &hearts; using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary underline underline-offset-2 transition-colors"
          style={{ color: "#003f87" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
};
