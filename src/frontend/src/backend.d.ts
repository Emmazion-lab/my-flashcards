import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface GetPublicDecksResult {
    total: bigint;
    decks: Array<PublicDeckInfo>;
}
export interface Card {
    id: bigint;
    front: string;
    exampleSentence?: string;
    starred: boolean;
    back: string;
    pronunciation?: string;
    exampleTranslation?: string;
    backImage?: ExternalBlob;
    position: bigint;
    frontImage?: ExternalBlob;
    partOfSpeech?: string;
}
export interface AccessRequestView {
    id: bigint;
    requester: Principal;
    deckId: bigint;
    timestamp: bigint;
    requesterName: string;
}
export interface PublicDeckInfo {
    title: string;
    ownerName: string;
    owner: Principal;
    createdAt: bigint;
    description: string;
    deckId: bigint;
    cardCount: bigint;
    category: string;
    likesCount: bigint;
    copyCount: bigint;
}
export interface StudySession {
    mode: string;
    deckId: bigint;
    cardsStudied: bigint;
    timestamp: bigint;
    correctCount: bigint;
}
export interface Deck {
    id: bigint;
    title: string;
    createdAt: bigint;
    description: string;
    updatedAt: bigint;
    cardCount: bigint;
    category: string;
    visibility: Visibility;
}
export interface UserProfile {
    username: string;
    displayName: string;
    seeded: boolean;
}
export enum Visibility {
    Private = "Private",
    Public = "Public"
}
export interface backendInterface {
    addCard(deckId: bigint, front: string, back: string, pronunciation: string | null, partOfSpeech: string | null, exampleSentence: string | null, exampleTranslation: string | null): Promise<Card>;
    approveAccess(deckId: bigint, requester: Principal): Promise<void>;
    bulkAddCards(deckId: bigint, cardPairs: Array<[string, string, string | null, string | null, string | null, string | null]>): Promise<Array<Card>>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    createDeck(title: string, description: string, category: string): Promise<Deck>;
    deckExists(deckId: bigint): Promise<boolean>;
    deleteCard(deckId: bigint, cardId: bigint): Promise<void>;
    deleteDeck(deckId: bigint): Promise<void>;
    duplicateDeck(deckId: bigint): Promise<Deck>;
    findUserByName(username: string): Promise<Principal | null>;
    getAccessRequests(deckId: bigint): Promise<Array<AccessRequestView>>;
    getCards(deckId: bigint): Promise<Array<Card>>;
    getDeck(deckId: bigint): Promise<Deck>;
    getDeckSessions(deckId: bigint): Promise<Array<StudySession>>;
    getMyDecks(): Promise<Array<Deck>>;
    getProfile(): Promise<UserProfile | null>;
    getPublicDeck(deckId: bigint): Promise<PublicDeckInfo | null>;
    getPublicDecks(search: string | null, category: string | null, sort: string, page: bigint, pageSize: bigint): Promise<GetPublicDecksResult>;
    getSharedDecks(): Promise<Array<{
        title: string;
        ownerName: string;
        description: string;
        deckId: bigint;
        cardCount: bigint;
        category: string;
    }>>;
    getSharedUsers(deckId: bigint): Promise<Array<{
        principal: Principal;
        name: string;
    }>>;
    getUserLikes(): Promise<Array<bigint>>;
    isDeckOwner(deckId: bigint): Promise<boolean>;
    likeDeck(deckId: bigint): Promise<void>;
    rejectAccess(deckId: bigint, requester: Principal): Promise<void>;
    requestDeckAccess(deckId: bigint): Promise<void>;
    saveStudySession(deckId: bigint, cardsStudied: bigint, correctCount: bigint, mode: string): Promise<void>;
    setDeckVisibility(deckId: bigint, visibility: Visibility): Promise<void>;
    setProfile(username: string, displayName: string): Promise<void>;
    shareDeckWith(deckId: bigint, username: string): Promise<void>;
    toggleStarCard(deckId: bigint, cardId: bigint): Promise<boolean>;
    unlikeDeck(deckId: bigint): Promise<void>;
    unshareDeckWith(deckId: bigint, target: Principal): Promise<void>;
    updateCard(deckId: bigint, cardId: bigint, front: string, back: string, pronunciation: string | null, partOfSpeech: string | null, exampleSentence: string | null, exampleTranslation: string | null): Promise<void>;
    updateCardImages(deckId: bigint, cardId: bigint, frontImage: ExternalBlob | null, backImage: ExternalBlob | null): Promise<void>;
    updateDeck(deckId: bigint, title: string, description: string, category: string): Promise<Deck>;
}
