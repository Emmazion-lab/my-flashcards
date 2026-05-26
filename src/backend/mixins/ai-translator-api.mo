import AiTranslatorLib "../lib/ai-translator";
import HttpOutcall "mo:caffeineai-http-outcalls/outcall";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

mixin (
  adminPrincipalState : { var value : ?Principal },
  openAIKeyState : { var value : ?Text },
  translationCache : Map.Map<Text, AiTranslatorLib.TranslationResult>,
) {
  public query func transform(input : HttpOutcall.TransformationInput) : async HttpOutcall.TransformationOutput {
    HttpOutcall.transform(input);
  };

  public shared ({ caller }) func setOpenAIKey(key : Text) : async () {
    switch (adminPrincipalState.value) {
      case (null) {
        // First caller claims the admin role
        adminPrincipalState.value := ?caller;
      };
      case (?admin) {
        if (caller != admin) {
          Runtime.trap("Unauthorized: admin only");
        };
      };
    };
    openAIKeyState.value := ?key;
  };

  public shared func translateText(frenchText : Text) : async {
    #ok : { translation : Text; exampleSentence : Text; usageTip : Text };
    #err : Text;
  } {
    if (frenchText == "") {
      return #err "Input text cannot be empty";
    };
    await AiTranslatorLib.translate(
      frenchText,
      translationCache,
      openAIKeyState.value,
      transform,
    );
  };
};
