import { create } from "zustand";

interface StudyState {
  currentIndex: number;
  shuffledCardIds: number[];
  isFlipped: boolean;
  isShuffled: boolean;
  studyStarredOnly: boolean;
  sessionStartTime: number;
  setCurrentIndex: (index: number) => void;
  setShuffledCardIds: (ids: number[]) => void;
  setIsFlipped: (flipped: boolean) => void;
  setIsShuffled: (shuffled: boolean) => void;
  setStudyStarredOnly: (starredOnly: boolean) => void;
  nextCard: () => void;
  prevCard: () => void;
  toggleFlip: () => void;
  resetPosition: () => void;
  reset: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentIndex: 0,
  shuffledCardIds: [],
  isFlipped: false,
  isShuffled: false,
  studyStarredOnly: false,
  sessionStartTime: Date.now(),

  setCurrentIndex: (index) => set({ currentIndex: index, isFlipped: false }),
  setShuffledCardIds: (ids) => set({ shuffledCardIds: ids }),
  setIsFlipped: (flipped) => set({ isFlipped: flipped }),
  setIsShuffled: (shuffled) => set({ isShuffled: shuffled }),
  setStudyStarredOnly: (starredOnly) => set({ studyStarredOnly: starredOnly }),

  nextCard: () => {
    const { currentIndex, shuffledCardIds } = get();
    if (currentIndex < shuffledCardIds.length - 1) {
      set({ currentIndex: currentIndex + 1, isFlipped: false });
    }
  },

  prevCard: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isFlipped: false });
    }
  },

  toggleFlip: () => set((s) => ({ isFlipped: !s.isFlipped })),

  resetPosition: () =>
    set({
      currentIndex: 0,
      isFlipped: false,
      sessionStartTime: Date.now(),
    }),

  reset: () =>
    set({
      currentIndex: 0,
      shuffledCardIds: [],
      isFlipped: false,
      isShuffled: false,
      studyStarredOnly: false,
      sessionStartTime: Date.now(),
    }),
}));
