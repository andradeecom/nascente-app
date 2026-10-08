// @ts-nocheck — This test file is run by Jest, not the app's tsc/Deno. The
// Jest globals (`describe`, `it`, `expect`) are intentionally not in the app's
// tsconfig scope, so we suppress IDE/typechecker noise here the same way Edge
// Functions suppress Deno-specific type noise.

import {
  GEMINI_ENDPOINT,
  GEMINI_INPUT_COST_PER_TOKEN,
  GEMINI_MODEL,
  GEMINI_OUTPUT_COST_PER_TOKEN,
  buildInteractionsRequest,
  calculateGeminiCost,
  extractTextFromInteraction,
  extractUsageFromInteraction,
} from '../gemini-interactions.ts';

describe('gemini-interactions helpers', () => {
  describe('buildInteractionsRequest', () => {
    it('builds a text-generation request with snake_case fields only', () => {
      const body = buildInteractionsRequest({
        model: GEMINI_MODEL,
        systemInstruction: 'You are a helpful assistant.',
        input: 'Explain John 3:16.',
        generationConfig: {
          max_output_tokens: 500,
          temperature: 0.7,
          thinking_level: 'low',
        },
      });

      expect(body).toEqual({
        model: GEMINI_MODEL,
        system_instruction: 'You are a helpful assistant.',
        input: 'Explain John 3:16.',
        store: false,
        generation_config: {
          max_output_tokens: 500,
          temperature: 0.7,
          thinking_level: 'low',
        },
      });

      // The Interactions REST endpoint rejects camelCase keys with 400.
      const json = JSON.stringify(body);
      const camelCaseMatches = json.match(/"[a-zA-Z]+[A-Z][a-zA-Z]+"/g);
      expect(camelCaseMatches).toBeNull();
    });

    it('builds a structured-output request with response_format', () => {
      const body = buildInteractionsRequest({
        systemInstruction: 'Return JSON.',
        input: 'plan',
        responseFormat: [
          {
            type: 'text',
            mime_type: 'application/json',
            schema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
              },
              required: ['title'],
            },
          },
        ],
        generationConfig: {
          max_output_tokens: 2400,
          temperature: 0.8,
          thinking_level: 'low',
        },
      });

      expect(body.response_format).toEqual([
        {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
            },
            required: ['title'],
          },
        },
      ]);
      expect(body).not.toHaveProperty('responseFormat');
    });

    it('uses the Interactions API endpoint', () => {
      expect(GEMINI_ENDPOINT).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    });
  });

  describe('extractTextFromInteraction', () => {
    it('extracts text from the last model_output step', () => {
      const interaction = {
        steps: [
          { type: 'user_input', content: [{ type: 'text', text: 'Hello' }] },
          { type: 'model_output', content: [{ type: 'text', text: 'First ' }] },
          { type: 'model_output', content: [{ type: 'text', text: 'Second' }] },
        ],
      };

      expect(extractTextFromInteraction(interaction)).toBe('Second');
    });

    it('joins multiple consecutive text parts in the final model_output step', () => {
      const interaction = {
        steps: [
          {
            type: 'model_output',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world.' },
            ],
          },
        ],
      };

      expect(extractTextFromInteraction(interaction)).toBe('Hello world.');
    });

    it('returns null when there is no model_output step', () => {
      const interaction = {
        steps: [{ type: 'user_input', content: [{ type: 'text', text: 'Hello' }] }],
      };

      expect(extractTextFromInteraction(interaction)).toBeNull();
    });

    it('returns null when the model_output step has no text parts', () => {
      const interaction = {
        steps: [{ type: 'model_output', content: [{ type: 'image', mime_type: 'image/png' }] }],
      };

      expect(extractTextFromInteraction(interaction)).toBeNull();
    });
  });

  describe('extractUsageFromInteraction', () => {
    it('reads input and output token counts', () => {
      const interaction = {
        usage: {
          total_tokens: 1234,
          total_input_tokens: 1000,
          total_output_tokens: 234,
        },
      };

      expect(extractUsageFromInteraction(interaction)).toEqual({
        inputTokens: 1000,
        outputTokens: 234,
      });
    });

    it('returns nulls when usage is missing', () => {
      expect(extractUsageFromInteraction({})).toEqual({
        inputTokens: null,
        outputTokens: null,
      });
    });
  });

  describe('calculateGeminiCost', () => {
    it('uses the 3.8 Flash token prices', () => {
      const inputTokens = 1_000_000;
      const outputTokens = 1_000_000;

      const cost = calculateGeminiCost(inputTokens, outputTokens);

      expect(cost).toBe(0.75 + 3.75);
    });

    it('matches the exported per-token constants', () => {
      const cost = calculateGeminiCost(600, 250);
      const expected = 600 * GEMINI_INPUT_COST_PER_TOKEN + 250 * GEMINI_OUTPUT_COST_PER_TOKEN;

      expect(cost).toBe(expected);
    });

    it('treats null tokens as zero', () => {
      expect(calculateGeminiCost(null, null)).toBe(0);
    });
  });
});
