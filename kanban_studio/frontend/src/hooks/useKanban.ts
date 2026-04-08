import { useState } from 'react';
import { Card, Column, Id } from '../types/kanban';

const defaultColumns: Column[] = [
  { id: 'col-1', title: 'Backlog' },
  { id: 'col-2', title: 'To Do' },
  { id: 'col-3', title: 'In Progress' },
  { id: 'col-4', title: 'Review' },
  { id: 'col-5', title: 'Done' },
];

const defaultCards: Card[] = [
  { id: 'card-1', columnId: 'col-1', title: 'Research competitors', details: 'Look at what others are doing in the space.' },
  { id: 'card-2', columnId: 'col-2', title: 'Design system', details: 'Establish color palette and typography.' },
  { id: 'card-3', columnId: 'col-3', title: 'Drag and Drop', details: 'Integrate @dnd-kit.' },
];

export function useKanban() {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [cards, setCards] = useState<Card[]>(defaultCards);

  const addCard = (columnId: Id, title: string, details: string) => {
    const newCard: Card = {
      id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      columnId,
      title,
      details,
    };
    setCards([...cards, newCard]);
  };

  const deleteCard = (id: Id) => {
    setCards(cards.filter(card => card.id !== id));
  };

  const renameColumn = (id: Id, newTitle: string) => {
    if (!newTitle.trim()) return;
    setColumns(columns.map(col => col.id === id ? { ...col, title: newTitle } : col));
  };

  return {
    columns,
    cards,
    setColumns,
    setCards,
    addCard,
    deleteCard,
    renameColumn,
  };
}
