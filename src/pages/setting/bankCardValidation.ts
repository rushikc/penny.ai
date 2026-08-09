export type CardValidationResult =
  | {ok: true}
  | {ok: false; error: 'Enter exactly 4 digits' | 'Card already added'};

export const validateCreditCardDigits = (
  newCardDigits: string,
  existingCards: string[],
): CardValidationResult => {
  if (!newCardDigits || !/^\d{4}$/.test(newCardDigits)) {
    return {ok: false, error: 'Enter exactly 4 digits'};
  }
  if (existingCards.includes(newCardDigits)) {
    return {ok: false, error: 'Card already added'};
  }
  return {ok: true};
};
