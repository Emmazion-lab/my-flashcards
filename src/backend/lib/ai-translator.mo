import HttpOutcall "mo:caffeineai-http-outcalls/outcall";
import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  public type TranslationResult = {
    translation : Text;
    exampleSentence : Text;
    usageTip : Text;
  };

  // Simple JSON value extractor for a flat string field.
  // Finds  "key" : "value"  and returns the value (no nested objects).
  func extractJsonField(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\"";
    let afterKey = switch (splitOnce(json, needle)) {
      case (null) { return null };
      case (?(_, rest)) { rest };
    };
    // Skip whitespace and colon
    let afterColon = switch (splitOnce(afterKey, ":")) {
      case (null) { return null };
      case (?(_, rest)) { rest };
    };
    let trimmed = afterColon.trimStart(#predicate(func c = c == ' ' or c == '\n' or c == '\r' or c == '\t'));
    // Must start with a quote
    if (trimmed.size() < 2) { return null };
    let chars = trimmed.chars();
    var first : ?Char = null;
    for (c in chars) {
      if (first == null) { first := ?c };
    };
    switch (first) {
      case (?'\u{22}') {};
      case (_) { return null };
    };
    // Find the value between the first pair of quotes after the colon
    let afterOpen = switch (splitOnce(trimmed, "\"")) {
      case (null) { return null };
      case (?(_, rest)) { rest };
    };
    // Take until the next unescaped quote
    switch (splitOnce(afterOpen, "\"")) {
      case (null) { null };
      case (?(value, _)) { ?value };
    };
  };

  // Splits text on the first occurrence of `sep`, returns (before, after).
  func splitOnce(s : Text, sep : Text) : ?(Text, Text) {
    let sepSize = sep.size();
    if (sepSize == 0 or s.size() < sepSize) { return null };
    let sepChars = sep.toArray();
    let sChars = s.toArray();
    let sSize = sChars.size();
    let limit = sSize - sepSize : Nat;
    var i = 0;
    label search while (i <= limit) {
      var match = true;
      var j = 0;
      while (j < sepSize) {
        if (sChars[i + j] != sepChars[j]) { match := false };
        j += 1;
      };
      if (match) {
        let before = Text.fromIter(sChars.sliceToArray(0, i).values());
        let after = Text.fromIter(sChars.sliceToArray(i + sepSize, sSize).values());
        return ?(before, after);
      };
      i += 1;
    };
    null;
  };

  // Parse the OpenAI response and extract the JSON content from the first choice.
  func extractContent(responseBody : Text) : ?Text {
    // Look for "content" field inside choices[0].message
    extractJsonField(responseBody, "content");
  };

  // Parse translation JSON: {"translation":"...","exampleSentence":"...","usageTip":"..."}
  public func parseTranslation(json : Text) : ?TranslationResult {
    let translation = switch (extractJsonField(json, "translation")) {
      case (null) { return null };
      case (?v) { v };
    };
    let exampleSentence = switch (extractJsonField(json, "exampleSentence")) {
      case (null) { return null };
      case (?v) { v };
    };
    let usageTip = switch (extractJsonField(json, "usageTip")) {
      case (null) { return null };
      case (?v) { v };
    };
    ?{ translation; exampleSentence; usageTip };
  };

  public func buildPrompt(frenchText : Text) : Text {
    "You are a French language expert. Translate the following French word or phrase to English. " #
    "Respond with ONLY valid JSON using exactly these keys: translation, exampleSentence, usageTip. " #
    "translation: the English translation. " #
    "exampleSentence: a natural French sentence using the word or phrase. " #
    "usageTip: a brief note on formality, regional usage, or common mistakes. " #
    "French input: \"" # frenchText # "\"";
  };

  public func buildRequestBody(prompt : Text, apiKey : Text) : Text {
    ignore apiKey; // apiKey goes in the header, not body
    "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"" #
    escapeJson(prompt) #
    "\"}],\"temperature\":0.3,\"max_tokens\":300}";
  };

  // Minimal JSON string escaping for prompt content
  func escapeJson(text : Text) : Text {
    var result = text;
    result := result.replace(#text "\\\\", "\\\\\\\\");
    result := result.replace(#text "\"", "\\\"");
    result := result.replace(#text "\n", "\\n");
    result := result.replace(#text "\t", "\\t");
    result
  };

  public func callOpenAI(
    frenchText : Text,
    apiKey : Text,
    transform : HttpOutcall.Transform,
  ) : async ?TranslationResult {
    let prompt = buildPrompt(frenchText);
    let body = buildRequestBody(prompt, apiKey);
    let headers : [HttpOutcall.Header] = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # apiKey },
    ];
    try {
      let responseBody = await HttpOutcall.httpPostRequest(
        "https://api.openai.com/v1/chat/completions",
        headers,
        body,
        transform,
      );
      switch (extractContent(responseBody)) {
        case (null) { null };
        case (?content) { parseTranslation(content) };
      };
    } catch (_) {
      null;
    };
  };

  public func translate(
    frenchText : Text,
    cache : Map.Map<Text, TranslationResult>,
    apiKey : ?Text,
    transform : HttpOutcall.Transform,
  ) : async { #ok : TranslationResult; #err : Text } {
    // Cache hit
    switch (cache.get(frenchText)) {
      case (?cached) { return #ok cached };
      case (null) {};
    };
    // Require API key
    let key = switch (apiKey) {
      case (null) { return #err "OpenAI API key not configured" };
      case (?k) { k };
    };
    // Call OpenAI
    switch (await callOpenAI(frenchText, key, transform)) {
      case (null) { #err "Translation service unavailable" };
      case (?result) {
        cache.add(frenchText, result);
        #ok result;
      };
    };
  };
};
