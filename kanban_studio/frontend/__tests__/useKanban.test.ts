import { renderHook, act } from '@testing-library/react';
import { useKanban } from '../src/hooks/useKanban';

describe('useKanban hook', () => {
  it('should initialize with default columns and cards', () => {
    const { result } = renderHook(() => useKanban());
    expect(result.current.columns.length).toBe(5);
    expect(result.current.cards.length).toBe(3);
  });

  it('should add a new card', () => {
    const { result } = renderHook(() => useKanban());
    act(() => {
      result.current.addCard('col-1', 'New Task', 'Task Details');
    });
    expect(result.current.cards.length).toBe(4);
    expect(result.current.cards[3].title).toBe('New Task');
    expect(result.current.cards[3].details).toBe('Task Details');
    expect(result.current.cards[3].columnId).toBe('col-1');
  });

  it('should delete a card', () => {
    const { result } = renderHook(() => useKanban());
    const cardToDelete = result.current.cards[0].id;
    act(() => {
      result.current.deleteCard(cardToDelete);
    });
    expect(result.current.cards.length).toBe(2);
    expect(result.current.cards.find(c => c.id === cardToDelete)).toBeUndefined();
  });

  it('should rename a column', () => {
    const { result } = renderHook(() => useKanban());
    const colToRename = result.current.columns[0].id;
    act(() => {
      result.current.renameColumn(colToRename, 'New Backlog');
    });
    expect(result.current.columns[0].title).toBe('New Backlog');
  });
});
