module {
  public type TranslationResult = {
    translation : Text;
    exampleSentence : Text;
    usageTip : Text;
  };

  public type TranslateResult = {
    #ok : TranslationResult;
    #err : Text;
  };

  public type TranslatorState = {
    var openAIKey : ?Text;
    cache : { get : (Text) -> ?TranslationResult; add : (Text, TranslationResult) -> () };
  };
};
