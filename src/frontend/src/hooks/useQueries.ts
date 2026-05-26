import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, Visibility } from "../backend";
import { createActor } from "../backend";

export interface TranslationResult {
  translation: string;
  exampleSentence: string;
  usageTip: string;
}

export function useTranslateText() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async ({
      frenchText,
    }: { frenchText: string }): Promise<TranslationResult> => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).translateText(frenchText)) as {
        ok?: { translation: string; exampleSentence: string; usageTip: string };
        err?: string;
      };
      if (result.err !== undefined) throw new Error(result.err);
      if (!result.ok) throw new Error("Empty translation result");
      return {
        translation: result.ok.translation,
        exampleSentence: result.ok.exampleSentence,
        usageTip: result.ok.usageTip,
      };
    },
  });
}

export function useSetOpenAIKey() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async ({ key }: { key: string }): Promise<void> => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).setOpenAIKey(key)) as {
        ok?: null;
        err?: string;
      };
      if (result.err !== undefined) throw new Error(result.err);
    },
  });
}

export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSetProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      username,
      displayName,
    }: {
      username: string;
      displayName: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setProfile(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useCheckUsername(username: string) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["checkUsername", username.toLowerCase()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.checkUsernameAvailability(username);
    },
    enabled: !!actor && !isFetching && username.length >= 3,
  });
}

export function useGetMyDecks() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["myDecks", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      // getMyDecks is a shared call (seeds sample decks on first use) but
      // can be invoked as a regular async method from the frontend
      return actor.getMyDecks();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateDeck() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      category,
    }: {
      title: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createDeck(title, description, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useGetDeck(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["deck", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getDeck(deckId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCards(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["deckCards", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getCards(deckId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateDeck() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      deckId,
      title,
      description,
      category,
    }: {
      deckId: bigint;
      title: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateDeck(deckId, title, description, category);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useDeleteDeck() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ deckId }: { deckId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteDeck(deckId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useAddCard() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      deckId,
      front,
      back,
      pronunciation,
      partOfSpeech,
      exampleSentence,
      exampleTranslation,
    }: {
      deckId: bigint;
      front: string;
      back: string;
      pronunciation?: string | null;
      partOfSpeech?: string | null;
      exampleSentence?: string | null;
      exampleTranslation?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addCard(
        deckId,
        front,
        back,
        pronunciation ?? null,
        partOfSpeech ?? null,
        exampleSentence ?? null,
        exampleTranslation ?? null,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckCards", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["deck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useUpdateCard() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardId,
      front,
      back,
      pronunciation,
      partOfSpeech,
      exampleSentence,
      exampleTranslation,
    }: {
      deckId: bigint;
      cardId: bigint;
      front: string;
      back: string;
      pronunciation?: string | null;
      partOfSpeech?: string | null;
      exampleSentence?: string | null;
      exampleTranslation?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateCard(
        deckId,
        cardId,
        front,
        back,
        pronunciation ?? null,
        partOfSpeech ?? null,
        exampleSentence ?? null,
        exampleTranslation ?? null,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckCards", variables.deckId.toString()],
      });
    },
  });
}

export function useBulkAddCards() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      deckId,
      cards,
    }: {
      deckId: bigint;
      cards: Array<
        [
          string,
          string,
          string | null,
          string | null,
          string | null,
          string | null,
        ]
      >;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const cardPairs = cards.map(
        ([
          front,
          back,
          pronunciation,
          partOfSpeech,
          exampleSentence,
          exampleTranslation,
        ]) =>
          [
            front,
            back,
            pronunciation ?? null,
            partOfSpeech ?? null,
            exampleSentence ?? null,
            exampleTranslation ?? null,
          ] as [
            string,
            string,
            string | null,
            string | null,
            string | null,
            string | null,
          ],
      );
      return actor.bulkAddCards(deckId, cardPairs);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckCards", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["deck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useToggleStarCard() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardId,
    }: {
      deckId: bigint;
      cardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.toggleStarCard(deckId, cardId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckCards", variables.deckId.toString()],
      });
    },
  });
}

export function useUpdateCardImages() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardId,
      frontImage,
      backImage,
    }: {
      deckId: bigint;
      cardId: bigint;
      frontImage: ExternalBlob | null;
      backImage: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateCardImages(deckId, cardId, frontImage, backImage);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckCards", variables.deckId.toString()],
      });
    },
  });
}

export function useGetPublicDecks(
  search: string,
  category: string,
  sort: string,
  page: number,
  pageSize: number,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["publicDecks", search, category, sort, page, pageSize],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getPublicDecks(
        search || null,
        category || null,
        sort,
        BigInt(page),
        BigInt(pageSize),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserLikes() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["userLikes", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getUserLikes();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetPublicDeck(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["publicDeck", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getPublicDeck(deckId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeckExists(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["deckExists", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deckExists(deckId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsDeckOwner(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["isDeckOwner", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.isDeckOwner(deckId);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useLikeDeck() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ deckId }: { deckId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.likeDeck(deckId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["publicDeck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["publicDecks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["userLikes", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useUnlikeDeck() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ deckId }: { deckId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.unlikeDeck(deckId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["publicDeck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["publicDecks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["userLikes", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useDuplicateDeck() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ deckId }: { deckId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.duplicateDeck(deckId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["publicDeck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["publicDecks"],
      });
    },
  });
}

export function useSetDeckVisibility() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      deckId,
      visibility,
    }: {
      deckId: bigint;
      visibility: Visibility;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setDeckVisibility(deckId, visibility);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["publicDecks"],
      });
    },
  });
}

export function useShareDeckWith() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      username,
    }: {
      deckId: bigint;
      username: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.shareDeckWith(deckId, username);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sharedUsers", variables.deckId.toString()],
      });
    },
  });
}

export function useUnshareDeckWith() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      principal,
    }: {
      deckId: bigint;
      principal: Principal;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.unshareDeckWith(deckId, principal);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sharedUsers", variables.deckId.toString()],
      });
    },
  });
}

export function useGetSharedUsers(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["sharedUsers", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getSharedUsers(deckId);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetAccessRequests(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["accessRequests", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getAccessRequests(deckId);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useApproveAccess() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      requester,
    }: {
      deckId: bigint;
      requester: Principal;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.approveAccess(deckId, requester);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["accessRequests", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["sharedUsers", variables.deckId.toString()],
      });
    },
  });
}

export function useRejectAccess() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      requester,
    }: {
      deckId: bigint;
      requester: Principal;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.rejectAccess(deckId, requester);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["accessRequests", variables.deckId.toString()],
      });
    },
  });
}

export function useGetSharedDecks() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["sharedDecks", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getSharedDecks();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useRequestDeckAccess() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId }: { deckId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.requestDeckAccess(deckId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["accessRequests", variables.deckId.toString()],
      });
    },
  });
}

export function useSaveStudySession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardsStudied,
      correctCount,
      mode,
    }: {
      deckId: bigint;
      cardsStudied: bigint;
      correctCount: bigint;
      mode: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.saveStudySession(deckId, cardsStudied, correctCount, mode);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckSessions", variables.deckId.toString()],
      });
    },
  });
}

export function useGetDeckSessions(deckId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["deckSessions", deckId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getDeckSessions(deckId);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDeleteCard() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      deckId,
      cardId,
    }: {
      deckId: bigint;
      cardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteCard(deckId, cardId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deckCards", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["deck", variables.deckId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["myDecks", identity?.getPrincipal().toString()],
      });
    },
  });
}
