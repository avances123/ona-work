import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService export/import', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should export current state with version, sessions, enabledTypes and exerciseCount', () => {
    service.saveExerciseCount(7);
    service.saveEnabledTypes(['calc', 'reading']);
    service.saveSession({
      id: 's-1',
      startedAt: '2026-11-15T10:00:00.000Z',
      completedAt: '2026-11-15T10:05:00.000Z',
      totalExercises: 1,
      totalFocusSeconds: 120,
      exercises: [],
    });

    const exported = service.exportData();
    expect(exported.version).toBe(1);
    expect(exported.exerciseCount).toBe(7);
    expect(exported.enabledTypes).toEqual(['calc', 'reading']);
    expect(exported.sessions.length).toBe(1);
    expect(exported.sessions[0].id).toBe('s-1');
  });

  it('should import valid backup data and update signals', () => {
    const result = service.importData({
      version: 1,
      exportedAt: '2026-11-15T12:00:00.000Z',
      exerciseCount: 15,
      enabledTypes: ['sudoku', 'crypto'],
      sessions: [
        {
          id: 'imported-1',
          startedAt: '2026-11-14T10:00:00.000Z',
          completedAt: '2026-11-14T10:10:00.000Z',
          totalExercises: 2,
          totalFocusSeconds: 180,
          exercises: [],
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(service.exerciseCount()).toBe(15);
    expect(service.enabledTypes()).toEqual(['sudoku', 'crypto']);
    expect(service.sessions().length).toBe(1);
    expect(service.sessions()[0].id).toBe('imported-1');
  });

  it('should reject invalid backup payloads', () => {
    expect(service.importData(null).ok).toBe(false);
    expect(service.importData({ foo: 'bar' }).ok).toBe(false);
    expect(service.importData({ sessions: 'not-an-array', enabledTypes: ['calc'], exerciseCount: 5 }).ok).toBe(false);
  });
});
