/**
 * For a query by text on a card that draws its postcard small beside its words: the drawing is
 * inert, read and reached by nobody, so the query passes over it as a person would and finds the
 * words once.
 */
export const PAST_THE_DRAWING = { ignore: 'script, style, [inert], [inert] *' };
