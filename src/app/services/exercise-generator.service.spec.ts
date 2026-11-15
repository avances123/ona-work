import { TestBed } from '@angular/core/testing';
import { ExerciseGeneratorService } from './exercise-generator.service';
import { VocabWordEntry } from './storage.service';

describe('ExerciseGeneratorService vocab uniqueness', () => {
  let generator: ExerciseGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    generator = TestBed.inject(ExerciseGeneratorService);
  });

  const makeWord = (word: string): VocabWordEntry => ({
    word,
    displayWord: word,
    definition: `Definición de ${word}`,
    distractors: [`Falsa 1 de ${word}`, `Falsa 2 de ${word}`],
    streak: 0,
    addedAt: '2026-11-15T10:00:00.000Z',
  });

  it('should never repeat the same vocab word in a session when only vocab is enabled', () => {
    const pool = [makeWord('cinturón'), makeWord('mochila')];
    const session = generator.generateSession(5, ['vocab'], pool);

    expect(session.length).toBe(2);
    const words = session.map((e) => (e.type === 'vocab' ? e.word : ''));
    expect(new Set(words).size).toBe(2);
    expect(words.sort()).toEqual(['cinturón', 'mochila']);
  });

  it('should fill remaining slots with other enabled types once vocab words are exhausted', () => {
    const pool = [makeWord('cinturón')];
    const session = generator.generateSession(4, ['calc', 'vocab'], pool);

    expect(session.length).toBe(4);
    const vocabExercises = session.filter((e) => e.type === 'vocab');
    const calcExercises = session.filter((e) => e.type === 'calc');
    expect(vocabExercises.length).toBe(1);
    expect(calcExercises.length).toBe(3);
  });

  it('should exclude vocab when there are no usable words', () => {
    const session = generator.generateSession(4, ['calc', 'vocab'], []);
    expect(session.length).toBe(4);
    expect(session.every((e) => e.type === 'calc')).toBe(true);
  });
});
