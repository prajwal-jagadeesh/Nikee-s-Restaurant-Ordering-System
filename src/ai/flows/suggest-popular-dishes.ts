'use server';
/**
 * @fileOverview An AI agent that suggests popular dishes.
 *
 * - suggestPopularDishes - A function that suggests popular dishes.
 * - SuggestPopularDishesInput - The input type for the suggestPopularDishes function.
 * - SuggestPopularDishesOutput - The return type for the suggestPopularDishes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPopularDishesInputSchema = z.object({
  userInput: z.string().describe('The user input or query.'),
  pastTrends: z.string().describe('The past trends of dishes ordered.'),
  pastOrderHistory: z.string().describe('The past order history of the user.'),
});
export type SuggestPopularDishesInput = z.infer<typeof SuggestPopularDishesInputSchema>;

const SuggestPopularDishesOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested popular dishes.'),
});
export type SuggestPopularDishesOutput = z.infer<typeof SuggestPopularDishesOutputSchema>;

export async function suggestPopularDishes(input: SuggestPopularDishesInput): Promise<SuggestPopularDishesOutput> {
  return suggestPopularDishesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPopularDishesPrompt',
  input: {schema: SuggestPopularDishesInputSchema},
  output: {schema: SuggestPopularDishesOutputSchema},
  prompt: `You are a restaurant expert specializing in suggesting popular dishes or combinations based on current trends or past order history.

You will use this information to suggest popular dishes based on user input, past trends, and past order history.

User Input: {{{userInput}}}
Past Trends: {{{pastTrends}}}
Past Order History: {{{pastOrderHistory}}}

Suggest popular dishes:
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestPopularDishesFlow = ai.defineFlow(
  {
    name: 'suggestPopularDishesFlow',
    inputSchema: SuggestPopularDishesInputSchema,
    outputSchema: SuggestPopularDishesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

