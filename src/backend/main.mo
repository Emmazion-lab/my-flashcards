import Array "mo:core/Array";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Storage "mo:caffeineai-object-storage/Storage";
import Text "mo:core/Text";
import Time "mo:core/Time";



actor {
  include MixinObjectStorage();
  // Types

  type UserProfile = {
    username : Text;
    displayName : Text;
    seeded : Bool;
  };

  type Visibility = {
    #Private;
    #Public;
  };

  type Deck = {
    id : Nat;
    title : Text;
    description : Text;
    category : Text;
    visibility : Visibility;
    createdAt : Int;
    updatedAt : Int;
    cardCount : Nat;
  };

  type Card = {
    id : Nat;
    front : Text;
    back : Text;
    frontImage : ?Storage.ExternalBlob;
    backImage : ?Storage.ExternalBlob;
    starred : Bool;
    position : Nat;
    pronunciation : ?Text;
    partOfSpeech : ?Text;
    exampleSentence : ?Text;
    exampleTranslation : ?Text;
  };

  type PublicDeckInfo = {
    deckId : Nat;
    owner : Principal;
    ownerName : Text;
    title : Text;
    description : Text;
    category : Text;
    cardCount : Nat;
    likesCount : Nat;
    copyCount : Nat;
    createdAt : Int;
  };

  type GetPublicDecksResult = {
    decks : [PublicDeckInfo];
    total : Nat;
  };

  type AccessRequest = {
    id : Nat;
    requester : Principal;
    deckId : Nat;
    timestamp : Int;
  };

  type AccessRequestView = {
    id : Nat;
    requester : Principal;
    requesterName : Text;
    deckId : Nat;
    timestamp : Int;
  };

  type StudySession = {
    deckId : Nat;
    timestamp : Int;
    cardsStudied : Nat;
    correctCount : Nat;
    mode : Text;
  };

  // Constants

  let maxTitleLength : Nat = 200;
  let maxDescriptionLength : Nat = 500;

  let maxCardTextLength : Nat = 1000;
  let maxSessionsPerDeck : Nat = 100;
  let maxBulkCards : Nat = 100;
  let maxCardsPerDeck : Nat = 250;

  let validCategories : [Text] = [
    "Science",
    "Math",
    "History",
    "Geography",
    "Language",
    "Literature",
    "Art",
    "Music",
    "Computer Science",
    "Business",
    "Medicine",
    "Law",
    "Philosophy",
    "Other",
  ];

  let validModes : [Text] = ["flashcards", "learn", "test", "match", "write"];

  // State

  let userProfiles : Map.Map<Principal, UserProfile> = Map.empty();
  let usernameToUser : Map.Map<Text, Principal> = Map.empty();
  let seededUsers : Map.Map<Principal, Bool> = Map.empty();
  let userDecks : Map.Map<Principal, Map.Map<Nat, Deck>> = Map.empty();
  let userDeckCards : Map.Map<Principal, Map.Map<Nat, Map.Map<Nat, Card>>> = Map.empty();
  var nextDeckId : Nat = 0;
  var nextCardId : Nat = 0;
  let nextCardPosition : Map.Map<Nat, Nat> = Map.empty();
  let deckOwnerIndex : Map.Map<Nat, Principal> = Map.empty();
  let publicDeckIndex : Map.Map<Nat, Principal> = Map.empty();
  let deckLikes : Map.Map<Nat, Map.Map<Principal, Bool>> = Map.empty();
  let userLikedDecks : Map.Map<Principal, Map.Map<Nat, Bool>> = Map.empty();
  let deckCopyCount : Map.Map<Nat, Nat> = Map.empty();
  let deckShareList : Map.Map<Nat, Map.Map<Principal, Bool>> = Map.empty();
  let userSharedDecks : Map.Map<Principal, Map.Map<Nat, Bool>> = Map.empty();
  let accessRequests : Map.Map<Nat, AccessRequest> = Map.empty();
  var nextRequestId : Nat = 0;
  let userSessions : Map.Map<Principal, Map.Map<Nat, List.List<StudySession>>> = Map.empty();

  // Helpers

  func getMap<V>(store : Map.Map<Principal, Map.Map<Nat, V>>, user : Principal) : Map.Map<Nat, V> {
    switch (store.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, V>();
        store.add(user, m);
        m;
      };
    };
  };

  func getUserDecks(user : Principal) : Map.Map<Nat, Deck> {
    getMap(userDecks, user);
  };

  func getUserDeckCards(user : Principal) : Map.Map<Nat, Map.Map<Nat, Card>> {
    switch (userDeckCards.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Map.Map<Nat, Card>>();
        userDeckCards.add(user, m);
        m;
      };
    };
  };

  func getDeckCards(user : Principal, deckId : Nat) : Map.Map<Nat, Card> {
    let decksCards = getUserDeckCards(user);
    switch (decksCards.get(deckId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Card>();
        decksCards.add(deckId, m);
        m;
      };
    };
  };

  func getUserSessions(user : Principal, deckId : Nat) : List.List<StudySession> {
    switch (userSessions.get(user)) {
      case (?deckMap) {
        switch (deckMap.get(deckId)) {
          case (?sessions) { sessions };
          case (null) {
            let sessions = List.empty<StudySession>();
            deckMap.add(deckId, sessions);
            sessions;
          };
        };
      };
      case (null) {
        let deckMap = Map.empty<Nat, List.List<StudySession>>();
        userSessions.add(user, deckMap);
        let sessions = List.empty<StudySession>();
        deckMap.add(deckId, sessions);
        sessions;
      };
    };
  };

  func isValidUsername(username : Text) : Bool {
    let size = username.size();
    if (size < 3 or size > 20) { return false };
    for (c in username.chars()) {
      if (not ((c >= 'a' and c <= 'z') or (c >= 'A' and c <= 'Z') or (c >= '0' and c <= '9') or c == '_')) {
        return false;
      };
    };
    true;
  };

  func isValidCategory(category : Text) : Bool {
    for (c in validCategories.values()) {
      if (c == category) { return true };
    };
    false;
  };

  func isValidMode(mode : Text) : Bool {
    for (m in validModes.values()) {
      if (m == mode) { return true };
    };
    false;
  };

  func canAccessDeck(caller : Principal, deckId : Nat) : Bool {
    // Owns it (read-only check to avoid allocating empty maps)
    switch (userDecks.get(caller)) {
      case (?decks) { if (decks.get(deckId) != null) { return true } };
      case (null) {};
    };
    // Public
    if (publicDeckIndex.get(deckId) != null) { return true };
    // On share list
    isOnShareList(deckId, caller);
  };

  func requireDeckOwner(caller : Principal, deckId : Nat) : Deck {
    let decks = getUserDecks(caller);
    switch (decks.get(deckId)) {
      case (?deck) { deck };
      case (null) { Runtime.trap("Deck not found") };
    };
  };

  func getNextPosition(deckId : Nat) : Nat {
    let pos = switch (nextCardPosition.get(deckId)) {
      case (?p) { p };
      case (null) { 0 };
    };
    nextCardPosition.add(deckId, pos + 1);
    pos;
  };

  func updateDeckCardCount(caller : Principal, deckId : Nat, count : Nat) {
    let decks = getUserDecks(caller);
    switch (decks.get(deckId)) {
      case (?deck) {
        decks.add(deckId, { deck with cardCount = count; updatedAt = Time.now() });
      };
      case (null) {};
    };
  };

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func textContainsIgnoreCase(haystack : Text, needle : Text) : Bool {
    haystack.toLower().contains(#text(needle.toLower()));
  };

  func getLikesCount(deckId : Nat) : Nat {
    switch (deckLikes.get(deckId)) {
      case (?likes) { likes.size() };
      case (null) { 0 };
    };
  };

  func getCopyCount(deckId : Nat) : Nat {
    switch (deckCopyCount.get(deckId)) {
      case (?c) { c };
      case (null) { 0 };
    };
  };

  func buildPublicDeckInfo(deckId : Nat, owner : Principal, deck : Deck) : PublicDeckInfo {
    let ownerName = switch (userProfiles.get(owner)) {
      case (?p) { p.displayName };
      case (null) { "Unknown" };
    };
    {
      deckId;
      owner;
      ownerName;
      title = deck.title;
      description = deck.description;
      category = deck.category;
      cardCount = deck.cardCount;
      likesCount = getLikesCount(deckId);
      copyCount = getCopyCount(deckId);
      createdAt = deck.createdAt;
    };
  };

  func isOnShareList(deckId : Nat, user : Principal) : Bool {
    switch (deckShareList.get(deckId)) {
      case (?list) { list.get(user) != null };
      case (null) { false };
    };
  };

  func getShareList(deckId : Nat) : Map.Map<Principal, Bool> {
    switch (deckShareList.get(deckId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Bool>();
        deckShareList.add(deckId, m);
        m;
      };
    };
  };

  func findDeckOwner(deckId : Nat) : ?Principal {
    deckOwnerIndex.get(deckId);
  };

  func findPublicDeck(deckId : Nat) : ?(Principal, Deck) {
    switch (publicDeckIndex.get(deckId)) {
      case (?owner) {
        let decks = getUserDecks(owner);
        switch (decks.get(deckId)) {
          case (?deck) { ?(owner, deck) };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  // Internal deck duplication helper (shared by duplicateDeck and seedSampleDecks)
  func internalDuplicateDeck(dest : Principal, srcOwner : Principal, deckId : Nat, srcDeck : Deck) : Deck {
    let newDeckId = nextDeckId;
    nextDeckId += 1;
    let now = Time.now();
    let srcCards = getDeckCards(srcOwner, deckId);
    let newDeck : Deck = {
      id = newDeckId;
      title = srcDeck.title;
      description = srcDeck.description;
      category = srcDeck.category;
      visibility = #Private;
      createdAt = now;
      updatedAt = now;
      cardCount = srcCards.size();
    };
    getUserDecks(dest).add(newDeckId, newDeck);
    deckOwnerIndex.add(newDeckId, dest);
    let newCards = getDeckCards(dest, newDeckId);
    for ((_, card) in srcCards.entries()) {
      let newCardId = nextCardId;
      nextCardId += 1;
      newCards.add(
        newCardId,
        {
          id = newCardId;
          front = card.front;
          back = card.back;
          frontImage = card.frontImage;
          backImage = card.backImage;
          starred = false;
          position = card.position;
          pronunciation = card.pronunciation;
          partOfSpeech = card.partOfSpeech;
          exampleSentence = card.exampleSentence;
          exampleTranslation = card.exampleTranslation;
        },
      );
    };
    var maxPos : Nat = 0;
    for ((_, card) in newCards.entries()) {
      if (card.position >= maxPos) {
        maxPos := card.position + 1;
      };
    };
    nextCardPosition.add(newDeckId, maxPos);
    let current = getCopyCount(deckId);
    deckCopyCount.add(deckId, current + 1);
    newDeck;
  };

  // Sample deck seeding
  // The management canister principal (aaaaa-aa) is used as the owner of canonical seed decks.
  let seedPrincipal : Principal = Principal.fromText("aaaaa-aa");

  func addSeedCard(
    deckId : Nat,
    front : Text,
    back : Text,
    pronunciation : ?Text,
    partOfSpeech : ?Text,
    exampleSentence : ?Text,
    exampleTranslation : ?Text,
  ) {
    let cards = getDeckCards(seedPrincipal, deckId);
    let id = nextCardId;
    nextCardId += 1;
    let card : Card = {
      id;
      front;
      back;
      frontImage = null;
      backImage = null;
      starred = false;
      position = getNextPosition(deckId);
      pronunciation;
      partOfSpeech;
      exampleSentence;
      exampleTranslation;
    };
    cards.add(id, card);
    updateDeckCardCount(seedPrincipal, deckId, cards.size());
  };

  func createSeedDeck(title : Text, description : Text) : Nat {
    let id = nextDeckId;
    nextDeckId += 1;
    let now = Time.now();
    let deck : Deck = {
      id;
      title;
      description;
      category = "Language";
      visibility = #Public;
      createdAt = now;
      updatedAt = now;
      cardCount = 0;
    };
    getUserDecks(seedPrincipal).add(id, deck);
    deckOwnerIndex.add(id, seedPrincipal);
    publicDeckIndex.add(id, seedPrincipal);
    id;
  };

  func ensureSeedDecksExist() {
    let existing = getUserDecks(seedPrincipal);
    if (existing.size() >= 2) { return };

    // Deck 1: Beginner French Words
    let d1 = createSeedDeck(
      "Beginner French Words",
      "Essential French vocabulary for absolute beginners: numbers 1-10 and everyday nouns.",
    );
    addSeedCard(d1, "un", "one", ?"uhn", ?"number", null, null);
    addSeedCard(d1, "deux", "two", ?"duh", ?"number", null, null);
    addSeedCard(d1, "trois", "three", ?"twah", ?"number", null, null);
    addSeedCard(d1, "quatre", "four", ?"KAT-ruh", ?"number", null, null);
    addSeedCard(d1, "cinq", "five", ?"sank", ?"number", null, null);
    addSeedCard(d1, "six", "six", ?"sees", ?"number", null, null);
    addSeedCard(d1, "sept", "seven", ?"set", ?"number", null, null);
    addSeedCard(d1, "huit", "eight", ?"weet", ?"number", null, null);
    addSeedCard(d1, "neuf", "nine", ?"nuhf", ?"number", null, null);
    addSeedCard(d1, "dix", "ten", ?"dees", ?"number", null, null);
    addSeedCard(d1, "bonjour", "hello / good day", ?"bon-ZHOOR", ?"phrase", ?("Bonjour, comment ça va ?"), ?("Hello, how are you?"));
    addSeedCard(d1, "merci", "thank you", ?"mehr-SEE", ?"phrase", ?("Merci beaucoup !"), ?("Thank you very much!"));
    addSeedCard(d1, "oui", "yes", ?"wee", ?"adverb", null, null);
    addSeedCard(d1, "non", "no", ?"nohn", ?"adverb", null, null);
    addSeedCard(d1, "s'il vous plaît", "please", ?"seel-voo-PLAY", ?"phrase", ?("L'addition, s'il vous plaît."), ?("The bill, please."));

    // Deck 2: Essential French Phrases
    let d2 = createSeedDeck(
      "Essential French Phrases",
      "Everyday French phrases for greetings, polite requests, directions, and ordering food.",
    );
    addSeedCard(d2, "Bonsoir", "Good evening", ?"bon-SWAHR", ?"phrase", null, null);
    addSeedCard(d2, "Au revoir", "Goodbye", ?"oh ruh-VWAHR", ?"phrase", null, null);
    addSeedCard(d2, "Comment allez-vous ?", "How are you? (formal)", ?"koh-mahn tah-LAY-voo", ?"phrase", null, null);
    addSeedCard(d2, "Je vais bien, merci.", "I am fine, thank you.", ?"zhuh vay BYAHN, mehr-SEE", ?"phrase", null, null);
    addSeedCard(d2, "Excusez-moi", "Excuse me", ?"ex-koo-ZAY-mwah", ?"phrase", null, null);
    addSeedCard(d2, "Parlez-vous anglais ?", "Do you speak English?", ?"par-LAY-voo ahn-GLAY", ?"phrase", null, null);
    addSeedCard(d2, "Je ne comprends pas.", "I don't understand.", ?"zhuh nuh kom-PRAHN pah", ?"phrase", null, null);
    addSeedCard(d2, "Où sont les toilettes ?", "Where is the restroom?", ?"oo sohn lay twah-LET", ?"phrase", null, null);
    addSeedCard(d2, "Tournez à gauche.", "Turn left.", ?"toor-NAY ah GOHSH", ?"phrase", null, null);
    addSeedCard(d2, "Tournez à droite.", "Turn right.", ?"toor-NAY ah DRWAHT", ?"phrase", null, null);
    addSeedCard(d2, "Je voudrais un café.", "I would like a coffee.", ?"zhuh voo-DRAY uhn kah-FAY", ?"phrase", null, null);
    addSeedCard(d2, "L'addition, s'il vous plaît.", "The bill, please.", ?"lah-dee-SYOHN, seel-voo-PLAY", ?"phrase", null, null);
    addSeedCard(d2, "C'est combien ?", "How much is it?", ?"say kom-BYAHN", ?"phrase", null, null);
    addSeedCard(d2, "Je m'appelle...", "My name is...", ?"zhuh mah-PEL", ?"phrase", null, null);
    addSeedCard(d2, "Enchanté(e)", "Nice to meet you", ?"ahn-shahn-TAY", ?"phrase", null, null);
  };

  func seedSampleDecks(user : Principal) {
    ensureSeedDecksExist();
    seededUsers.add(user, true);
    switch (userProfiles.get(user)) {
      case (?p) { userProfiles.add(user, { p with seeded = true }) };
      case (null) {};
    };
    let seedDeckMap = getUserDecks(seedPrincipal);
    for ((deckId, deck) in seedDeckMap.entries()) {
      ignore internalDuplicateDeck(user, seedPrincipal, deckId, deck);
    };
  };

  // Endpoints

  public query ({ caller }) func getProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func setProfile(username : Text, displayName : Text) : async () {
    requireAuth(caller);
    if (not isValidUsername(username)) {
      Runtime.trap("Username must be 3-20 characters, alphanumeric or underscore");
    };
    if (displayName == "") {
      Runtime.trap("Display name cannot be empty");
    };
    if (displayName.size() > 50) {
      Runtime.trap("Display name must be 50 characters or fewer");
    };
    let lower = username.toLower();
    switch (usernameToUser.get(lower)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Username is already taken");
        };
      };
      case (null) {};
    };
    // Remove old username mapping if changing username
    switch (userProfiles.get(caller)) {
      case (?existing) {
        let oldLower = existing.username.toLower();
        if (oldLower != lower) {
          usernameToUser.remove(oldLower);
        };
      };
      case (null) {};
    };
    usernameToUser.add(lower, caller);
    let existingSeeded = switch (userProfiles.get(caller)) {
      case (?p) { p.seeded };
      case (null) { false };
    };
    userProfiles.add(caller, { username; displayName; seeded = existingSeeded });
  };

  public query func checkUsernameAvailability(username : Text) : async Bool {
    if (not isValidUsername(username)) { return false };
    let lower = username.toLower();
    switch (usernameToUser.get(lower)) {
      case (?_) { false };
      case (null) { true };
    };
  };

  // Deck CRUD

  public shared ({ caller }) func createDeck(title : Text, description : Text, category : Text) : async Deck {
    requireAuth(caller);
    if (title == "") {
      Runtime.trap("Title cannot be empty");
    };
    if (title.size() > maxTitleLength) {
      Runtime.trap("Title must be " # maxTitleLength.toText() # " characters or fewer");
    };
    if (description.size() > maxDescriptionLength) {
      Runtime.trap("Description must be " # maxDescriptionLength.toText() # " characters or fewer");
    };
    if (not isValidCategory(category)) {
      Runtime.trap("Invalid category");
    };
    let id = nextDeckId;
    nextDeckId += 1;
    let now = Time.now();
    let deck : Deck = {
      id;
      title;
      description;
      category;
      visibility = #Private;
      createdAt = now;
      updatedAt = now;
      cardCount = 0;
    };
    getUserDecks(caller).add(id, deck);
    deckOwnerIndex.add(id, caller);
    deck;
  };

  public shared ({ caller }) func updateDeck(deckId : Nat, title : Text, description : Text, category : Text) : async Deck {
    requireAuth(caller);
    if (title == "") {
      Runtime.trap("Title cannot be empty");
    };
    if (title.size() > maxTitleLength) {
      Runtime.trap("Title must be " # maxTitleLength.toText() # " characters or fewer");
    };
    if (description.size() > maxDescriptionLength) {
      Runtime.trap("Description must be " # maxDescriptionLength.toText() # " characters or fewer");
    };
    if (not isValidCategory(category)) {
      Runtime.trap("Invalid category");
    };
    let decks = getUserDecks(caller);
    let deck = requireDeckOwner(caller, deckId);
    let updated : Deck = {
      deck with title;
      description;
      category;
      updatedAt = Time.now();
    };
    decks.add(deckId, updated);
    updated;
  };

  public shared ({ caller }) func deleteDeck(deckId : Nat) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    getUserDecks(caller).remove(deckId);
    getUserDeckCards(caller).remove(deckId);
    deckOwnerIndex.remove(deckId);
    nextCardPosition.remove(deckId);
    publicDeckIndex.remove(deckId);
    // Clean up reverse indexes before removing forward maps
    switch (deckLikes.get(deckId)) {
      case (?likes) {
        for ((user, _) in likes.entries()) {
          switch (userLikedDecks.get(user)) {
            case (?m) { m.remove(deckId) };
            case (null) {};
          };
        };
      };
      case (null) {};
    };
    switch (deckShareList.get(deckId)) {
      case (?shareList) {
        for ((user, _) in shareList.entries()) {
          switch (userSharedDecks.get(user)) {
            case (?m) { m.remove(deckId) };
            case (null) {};
          };
        };
      };
      case (null) {};
    };
    deckLikes.remove(deckId);
    deckCopyCount.remove(deckId);
    deckShareList.remove(deckId);
    let toRemove = List.empty<Nat>();
    for ((reqId, req) in accessRequests.entries()) {
      if (req.deckId == deckId) { toRemove.add(reqId) };
    };
    for (reqId in toRemove.values()) {
      accessRequests.remove(reqId);
    };
    // Clean up session data for this deck across all users
    for ((user, deckMap) in userSessions.entries()) {
      deckMap.remove(deckId);
    };
  };

  public shared ({ caller }) func getMyDecks() : async [Deck] {
    requireAuth(caller);
    // Seed sample decks on first visit if user has no decks
    let isSeeded = seededUsers.get(caller) != null;
    if (not isSeeded) {
      let existing = getUserDecks(caller);
      if (existing.size() == 0) {
        seedSampleDecks(caller);
      } else {
        // User already has decks but wasn't tracked — mark as seeded
        seededUsers.add(caller, true);
      };
    };
    let decks = getUserDecks(caller);
    let result = List.empty<Deck>();
    for ((_, deck) in decks.entries()) {
      result.add(deck);
    };
    result.sortInPlace(func(a, b) { Int.compare(b.updatedAt, a.updatedAt) });
    result.toArray();
  };

  public query ({ caller }) func getDeck(deckId : Nat) : async Deck {
    // Check ownership first
    if (not caller.isAnonymous()) {
      let decks = getUserDecks(caller);
      switch (decks.get(deckId)) {
        case (?deck) { return deck };
        case (null) {};
      };
    };
    // Check if public
    switch (findPublicDeck(deckId)) {
      case (?(_, deck)) { return deck };
      case (null) {};
    };
    // Check if shared with caller
    if (not caller.isAnonymous() and isOnShareList(deckId, caller)) {
      switch (findDeckOwner(deckId)) {
        case (?owner) {
          switch (getUserDecks(owner).get(deckId)) {
            case (?deck) { return deck };
            case (null) {};
          };
        };
        case (null) {};
      };
    };
    Runtime.trap("Deck not found");
  };

  public query ({ caller }) func isDeckOwner(deckId : Nat) : async Bool {
    if (caller.isAnonymous()) { return false };
    getUserDecks(caller).get(deckId) != null;
  };

  // Card CRUD

  public shared ({ caller }) func addCard(
    deckId : Nat,
    front : Text,
    back : Text,
    pronunciation : ?Text,
    partOfSpeech : ?Text,
    exampleSentence : ?Text,
    exampleTranslation : ?Text,
  ) : async Card {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    if (front == "") {
      Runtime.trap("Front text cannot be empty");
    };
    if (front.size() > maxCardTextLength) {
      Runtime.trap("Front text must be " # maxCardTextLength.toText() # " characters or fewer");
    };
    if (back == "") {
      Runtime.trap("Back text cannot be empty");
    };
    if (back.size() > maxCardTextLength) {
      Runtime.trap("Back text must be " # maxCardTextLength.toText() # " characters or fewer");
    };
    let cards = getDeckCards(caller, deckId);
    if (cards.size() >= maxCardsPerDeck) {
      Runtime.trap("Deck has reached the maximum number of cards (max " # maxCardsPerDeck.toText() # ")");
    };
    let id = nextCardId;
    nextCardId += 1;
    let card : Card = {
      id;
      front;
      back;
      frontImage = null;
      backImage = null;
      starred = false;
      position = getNextPosition(deckId);
      pronunciation;
      partOfSpeech;
      exampleSentence;
      exampleTranslation;
    };
    cards.add(id, card);
    updateDeckCardCount(caller, deckId, cards.size());
    card;
  };

  public shared ({ caller }) func updateCard(
    deckId : Nat,
    cardId : Nat,
    front : Text,
    back : Text,
    pronunciation : ?Text,
    partOfSpeech : ?Text,
    exampleSentence : ?Text,
    exampleTranslation : ?Text,
  ) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    if (front == "") {
      Runtime.trap("Front text cannot be empty");
    };
    if (front.size() > maxCardTextLength) {
      Runtime.trap("Front text must be " # maxCardTextLength.toText() # " characters or fewer");
    };
    if (back == "") {
      Runtime.trap("Back text cannot be empty");
    };
    if (back.size() > maxCardTextLength) {
      Runtime.trap("Back text must be " # maxCardTextLength.toText() # " characters or fewer");
    };
    let cards = getDeckCards(caller, deckId);
    switch (cards.get(cardId)) {
      case (?card) {
        cards.add(cardId, { card with front; back; pronunciation; partOfSpeech; exampleSentence; exampleTranslation });
      };
      case (null) { Runtime.trap("Card not found") };
    };
  };

  public shared ({ caller }) func deleteCard(deckId : Nat, cardId : Nat) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    let cards = getDeckCards(caller, deckId);
    switch (cards.get(cardId)) {
      case (?_) {
        cards.remove(cardId);
        updateDeckCardCount(caller, deckId, cards.size());
      };
      case (null) { Runtime.trap("Card not found") };
    };
  };

  public query ({ caller }) func getCards(deckId : Nat) : async [Card] {
    var cardOwner : ?Principal = null;
    if (not caller.isAnonymous()) {
      let decks = getUserDecks(caller);
      if (decks.get(deckId) != null) {
        cardOwner := ?caller;
      };
    };
    switch (cardOwner) {
      case (null) {
        switch (publicDeckIndex.get(deckId)) {
          case (?owner) { cardOwner := ?owner };
          case (null) {
            if (not caller.isAnonymous() and isOnShareList(deckId, caller)) {
              cardOwner := findDeckOwner(deckId);
            };
          };
        };
      };
      case (_) {};
    };
    if (cardOwner == null) {
      Runtime.trap("Deck not found");
    };
    switch (cardOwner) {
      case (?owner) {
        let cards = getDeckCards(owner, deckId);
        let result = List.empty<Card>();
        for ((_, card) in cards.entries()) {
          result.add(card);
        };
        result.sortInPlace(func(a, b) { Int.compare(a.position, b.position) });
        result.toArray();
      };
      case (null) { Runtime.trap("Deck not found") };
    };
  };

  public shared ({ caller }) func toggleStarCard(deckId : Nat, cardId : Nat) : async Bool {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    let cards = getDeckCards(caller, deckId);
    switch (cards.get(cardId)) {
      case (?card) {
        let newStarred = not card.starred;
        cards.add(cardId, { card with starred = newStarred });
        newStarred;
      };
      case (null) { Runtime.trap("Card not found") };
    };
  };

  public shared ({ caller }) func bulkAddCards(
    deckId : Nat,
    cardPairs : [(Text, Text, ?Text, ?Text, ?Text, ?Text)],
  ) : async [Card] {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    if (cardPairs.size() > maxBulkCards) {
      Runtime.trap("Too many cards in one batch (max " # maxBulkCards.toText() # ")");
    };
    let cards = getDeckCards(caller, deckId);
    if (cards.size() + cardPairs.size() > maxCardsPerDeck) {
      Runtime.trap("Adding these cards would exceed the maximum per deck (max " # maxCardsPerDeck.toText() # ")");
    };
    let added = List.empty<Card>();
    for ((front, back, pronunciation, partOfSpeech, exampleSentence, exampleTranslation) in cardPairs.values()) {
      if (front != "" and back != "" and front.size() <= maxCardTextLength and back.size() <= maxCardTextLength) {
        let id = nextCardId;
        nextCardId += 1;
        let card : Card = {
          id;
          front;
          back;
          frontImage = null;
          backImage = null;
          starred = false;
          position = getNextPosition(deckId);
          pronunciation;
          partOfSpeech;
          exampleSentence;
          exampleTranslation;
        };
        cards.add(id, card);
        added.add(card);
      };
    };
    updateDeckCardCount(caller, deckId, cards.size());
    added.toArray();
  };

  public shared ({ caller }) func updateCardImages(deckId : Nat, cardId : Nat, frontImage : ?Storage.ExternalBlob, backImage : ?Storage.ExternalBlob) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    let cards = getDeckCards(caller, deckId);
    switch (cards.get(cardId)) {
      case (?card) {
        cards.add(cardId, { card with frontImage; backImage });
      };
      case (null) { Runtime.trap("Card not found") };
    };
  };

  // Public deck endpoints

  public shared ({ caller }) func setDeckVisibility(deckId : Nat, visibility : Visibility) : async () {
    requireAuth(caller);
    let decks = getUserDecks(caller);
    let deck = requireDeckOwner(caller, deckId);
    decks.add(deckId, { deck with visibility; updatedAt = Time.now() });
    switch (visibility) {
      case (#Public) { publicDeckIndex.add(deckId, caller) };
      case (_) { publicDeckIndex.remove(deckId) };
    };
  };

  public query func getPublicDecks(search : ?Text, category : ?Text, sort : Text, page : Nat, pageSize : Nat) : async GetPublicDecksResult {
    let matches = List.empty<PublicDeckInfo>();
    for ((deckId, owner) in publicDeckIndex.entries()) {
      let decks = getUserDecks(owner);
      switch (decks.get(deckId)) {
        case (?deck) {
          let matchesSearch = switch (search) {
            case (null) { true };
            case (?q) {
              if (q == "") { true } else {
                textContainsIgnoreCase(deck.title, q) or textContainsIgnoreCase(deck.description, q);
              };
            };
          };
          let matchesCategory = switch (category) {
            case (null) { true };
            case (?cat) {
              if (cat == "") { true } else { deck.category == cat };
            };
          };
          if (matchesSearch and matchesCategory) {
            matches.add(buildPublicDeckInfo(deckId, owner, deck));
          };
        };
        case (null) {};
      };
    };
    // Sort
    let sortFn : (PublicDeckInfo, PublicDeckInfo) -> { #less; #equal; #greater } = switch (sort) {
      case ("popular") {
        func(a, b) { Int.compare(b.likesCount, a.likesCount) };
      };
      case ("alphabetical") {
        func(a, b) { Text.compare(a.title.toLower(), b.title.toLower()) };
      };
      case (_) { func(a, b) { Int.compare(b.createdAt, a.createdAt) } };
    };
    matches.sortInPlace(sortFn);
    let total = matches.size();
    let allSorted = matches.toArray();
    // Paginate
    let start = page * pageSize;
    if (start >= total) {
      return { decks = []; total };
    };
    let count = Nat.min(pageSize, total - start);
    let paged = Array.tabulate(count, func(i) { allSorted[start + i] });
    { decks = paged; total };
  };

  public query func getPublicDeck(deckId : Nat) : async ?PublicDeckInfo {
    switch (findPublicDeck(deckId)) {
      case (?(owner, deck)) { ?buildPublicDeckInfo(deckId, owner, deck) };
      case (null) { null };
    };
  };

  public query func deckExists(deckId : Nat) : async Bool {
    deckOwnerIndex.get(deckId) != null;
  };

  public shared ({ caller }) func likeDeck(deckId : Nat) : async () {
    requireAuth(caller);
    if (not canAccessDeck(caller, deckId)) {
      Runtime.trap("Deck not found");
    };
    let likes = switch (deckLikes.get(deckId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Bool>();
        deckLikes.add(deckId, m);
        m;
      };
    };
    likes.add(caller, true);
    getMap(userLikedDecks, caller).add(deckId, true);
  };

  public shared ({ caller }) func unlikeDeck(deckId : Nat) : async () {
    requireAuth(caller);
    switch (deckLikes.get(deckId)) {
      case (?likes) { likes.remove(caller) };
      case (null) {};
    };
    switch (userLikedDecks.get(caller)) {
      case (?m) { m.remove(deckId) };
      case (null) {};
    };
  };

  public query ({ caller }) func getUserLikes() : async [Nat] {
    requireAuth(caller);
    switch (userLikedDecks.get(caller)) {
      case (?m) {
        let result = List.empty<Nat>();
        for ((deckId, _) in m.entries()) {
          result.add(deckId);
        };
        result.toArray();
      };
      case (null) { [] };
    };
  };

  // Sharing endpoints

  public query func findUserByName(username : Text) : async ?Principal {
    let lower = username.toLower();
    usernameToUser.get(lower);
  };

  public shared ({ caller }) func shareDeckWith(deckId : Nat, username : Text) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    if (username == "") {
      Runtime.trap("Username cannot be empty");
    };
    let lower = username.toLower();
    switch (usernameToUser.get(lower)) {
      case (?target) {
        if (target == caller) {
          Runtime.trap("Cannot share with yourself");
        };
        getShareList(deckId).add(target, true);
        getMap(userSharedDecks, target).add(deckId, true);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func unshareDeckWith(deckId : Nat, target : Principal) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    getShareList(deckId).remove(target);
    switch (userSharedDecks.get(target)) {
      case (?m) { m.remove(deckId) };
      case (null) {};
    };
  };

  public shared ({ caller }) func requestDeckAccess(deckId : Nat) : async () {
    requireAuth(caller);
    switch (findDeckOwner(deckId)) {
      case (?owner) {
        if (owner == caller) {
          Runtime.trap("Cannot request access to your own deck");
        };
        if (getUserDecks(owner).get(deckId) == null) {
          Runtime.trap("Deck not found");
        };
      };
      case (null) { Runtime.trap("Deck not found") };
    };
    if (isOnShareList(deckId, caller)) {
      Runtime.trap("Already have access");
    };
    for ((_, req) in accessRequests.entries()) {
      if (req.deckId == deckId and req.requester == caller) {
        Runtime.trap("Request already pending");
      };
    };
    let id = nextRequestId;
    nextRequestId += 1;
    accessRequests.add(
      id,
      {
        id;
        requester = caller;
        deckId;
        timestamp = Time.now();
      },
    );
  };

  public shared ({ caller }) func approveAccess(deckId : Nat, requester : Principal) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    var foundId : ?Nat = null;
    for ((reqId, req) in accessRequests.entries()) {
      if (req.deckId == deckId and req.requester == requester) {
        foundId := ?reqId;
      };
    };
    switch (foundId) {
      case (?id) {
        getShareList(deckId).add(requester, true);
        getMap(userSharedDecks, requester).add(deckId, true);
        accessRequests.remove(id);
      };
      case (null) { Runtime.trap("No pending request found") };
    };
  };

  public shared ({ caller }) func rejectAccess(deckId : Nat, requester : Principal) : async () {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    var foundId : ?Nat = null;
    for ((reqId, req) in accessRequests.entries()) {
      if (req.deckId == deckId and req.requester == requester) {
        foundId := ?reqId;
      };
    };
    switch (foundId) {
      case (?id) { accessRequests.remove(id) };
      case (null) { Runtime.trap("No pending request found") };
    };
  };

  public query ({ caller }) func getAccessRequests(deckId : Nat) : async [AccessRequestView] {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    let pending = List.empty<AccessRequestView>();
    for ((_, req) in accessRequests.entries()) {
      if (req.deckId == deckId) {
        let requesterName = switch (userProfiles.get(req.requester)) {
          case (?p) { p.displayName };
          case (null) { "Unknown" };
        };
        pending.add({
          id = req.id;
          requester = req.requester;
          requesterName;
          deckId = req.deckId;
          timestamp = req.timestamp;
        });
      };
    };
    pending.toArray();
  };

  public query ({ caller }) func getSharedDecks() : async [{
    deckId : Nat;
    ownerName : Text;
    title : Text;
    description : Text;
    category : Text;
    cardCount : Nat;
  }] {
    requireAuth(caller);
    let result = List.empty<{ deckId : Nat; ownerName : Text; title : Text; description : Text; category : Text; cardCount : Nat }>();
    switch (userSharedDecks.get(caller)) {
      case (?sharedMap) {
        for ((deckId, _) in sharedMap.entries()) {
          switch (findDeckOwner(deckId)) {
            case (?owner) {
              switch (getUserDecks(owner).get(deckId)) {
                case (?deck) {
                  let ownerName = switch (userProfiles.get(owner)) {
                    case (?p) { p.displayName };
                    case (null) { "Unknown" };
                  };
                  result.add({
                    deckId;
                    ownerName;
                    title = deck.title;
                    description = deck.description;
                    category = deck.category;
                    cardCount = deck.cardCount;
                  });
                };
                case (null) {};
              };
            };
            case (null) {};
          };
        };
      };
      case (null) {};
    };
    result.toArray();
  };

  public query ({ caller }) func getSharedUsers(deckId : Nat) : async [{
    principal : Principal;
    name : Text;
  }] {
    requireAuth(caller);
    ignore requireDeckOwner(caller, deckId);
    let result = List.empty<{ principal : Principal; name : Text }>();
    switch (deckShareList.get(deckId)) {
      case (?shareList) {
        for ((principal, _) in shareList.entries()) {
          let name = switch (userProfiles.get(principal)) {
            case (?p) { p.displayName };
            case (null) { "Unknown" };
          };
          result.add({ principal; name });
        };
      };
      case (null) {};
    };
    result.toArray();
  };

  public shared ({ caller }) func duplicateDeck(deckId : Nat) : async Deck {
    requireAuth(caller);
    // Allow duplicating public decks or decks shared with the caller
    let (srcOwner, srcDeck) = switch (findPublicDeck(deckId)) {
      case (?(owner, deck)) { (owner, deck) };
      case (null) {
        // Check if caller has shared access
        switch (findDeckOwner(deckId)) {
          case (?owner) {
            if (isOnShareList(deckId, caller)) {
              switch (getUserDecks(owner).get(deckId)) {
                case (?deck) { (owner, deck) };
                case (null) { Runtime.trap("Deck not found") };
              };
            } else {
              Runtime.trap("You do not have access to this deck");
            };
          };
          case (null) { Runtime.trap("Deck not found") };
        };
      };
    };
    internalDuplicateDeck(caller, srcOwner, deckId, srcDeck);
  };

  // Session statistics

  public shared ({ caller }) func saveStudySession(deckId : Nat, cardsStudied : Nat, correctCount : Nat, mode : Text) : async () {
    requireAuth(caller);
    if (not canAccessDeck(caller, deckId)) {
      Runtime.trap("Deck not found");
    };
    if (not isValidMode(mode)) {
      Runtime.trap("Invalid study mode");
    };
    let sessions = getUserSessions(caller, deckId);
    // Evict oldest sessions when at cap
    if (sessions.size() >= maxSessionsPerDeck) {
      let arr = sessions.toArray();
      let deckMap = switch (userSessions.get(caller)) {
        case (?m) { m };
        case (null) { Runtime.trap("Unexpected state") };
      };
      // Keep only the most recent (maxSessionsPerDeck - 1) to make room for the new one
      let start = arr.size() + 1 - maxSessionsPerDeck : Nat;
      let trimmed = List.empty<StudySession>();
      var i = start;
      while (i < arr.size()) {
        trimmed.add(arr[i]);
        i += 1;
      };
      trimmed.add({
        deckId;
        timestamp = Time.now();
        cardsStudied;
        correctCount;
        mode;
      });
      deckMap.add(deckId, trimmed);
    } else {
      sessions.add({
        deckId;
        timestamp = Time.now();
        cardsStudied;
        correctCount;
        mode;
      });
    };
  };

  public query ({ caller }) func getDeckSessions(deckId : Nat) : async [StudySession] {
    requireAuth(caller);
    let sessions = getUserSessions(caller, deckId);
    sessions.toArray();
  };
};
