export const CATEGORIES = [
  "Language",
  "Travel",
  "Food & Dining",
  "Culture",
  "Business",
  "School",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const MAX_CARD_TEXT_LENGTH = 1000;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_TITLE_LENGTH = 200;
export const MAX_USERNAME_LENGTH = 20;
export const MAX_DISPLAY_NAME_LENGTH = 50;
