import { Injectable } from '@angular/core';

export interface VocabAiResult {
  correct: string;
  distractors: string[];
}

@Injectable({
  providedIn: 'root',
})
export class VocabAiService {
  private readonly endpoint = 'https://text.pollinations.ai/';

  async fetchDefinitions(word: string): Promise<VocabAiResult | null> {
    const prompt =
      `Para la palabra española "${word}", devuelve SOLO un JSON válido sin markdown con este formato: ` +
      `{"correct":"definición infantil corta y sencilla para una niña de 6 años sin repetir la palabra",` +
      `"distractors":["definición corta falsa 1 de la misma categoría gramatical (ej. otro sustantivo, verbo o adjetivo)",` +
      `"definición corta falsa 2 de la misma categoría gramatical"]}`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) return null;

      const rawText = (await response.text()).trim();
      if (!rawText || rawText.includes('Free limit reached')) {
        return null;
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as Partial<VocabAiResult>;
      const correct = typeof parsed.correct === 'string' ? parsed.correct.trim() : '';
      const distractors = Array.isArray(parsed.distractors)
        ? parsed.distractors
            .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
            .map((d) => d.trim())
            .filter((d) => d !== correct)
        : [];

      if (!correct || distractors.length < 2) {
        return null;
      }

      return {
        correct,
        distractors: distractors.slice(0, 2),
      };
    } catch {
      return null;
    }
  }
}
