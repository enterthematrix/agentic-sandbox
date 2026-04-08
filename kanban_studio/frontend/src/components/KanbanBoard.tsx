'use client';

import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { Card as CardType } from '../types/kanban';
import { Column } from './Column';
import { Card } from './Card';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  onLogout?: () => void;
}

export default function KanbanBoard({ onLogout }: KanbanBoardProps) {
  const { columns, cards, setCards, addCard, deleteCard, renameColumn } = useKanban();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Card') {
      setActiveCard(event.active.data.current.card);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Card';
    const isOverTask = over.data.current?.type === 'Card';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setCards(cards => {
        const activeIndex = cards.findIndex(t => t.id === activeId);
        const overIndex = cards.findIndex(t => t.id === overId);

        if (cards[activeIndex].columnId !== cards[overIndex].columnId) {
          const newCards = [...cards];
          newCards[activeIndex].columnId = cards[overIndex].columnId;
          return arrayMove(newCards, activeIndex, overIndex);
        }

        return arrayMove(cards, activeIndex, overIndex);
      });
    }

    if (isActiveTask && isOverColumn) {
      setCards(cards => {
        const activeIndex = cards.findIndex(t => t.id === activeId);
        const newCards = [...cards];
        newCards[activeIndex].columnId = overId;
        return arrayMove(newCards, activeIndex, newCards.length - 1);
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-7xl flex justify-between items-end mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-medium text-slate-900 tracking-tight">
            Kanban Studio
          </h1>
          <p className="text-lg text-slate-500 font-body">
            One board. Five columns. Zero clutter.
          </p>
        </div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Log Out
          </button>
        )}
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className={styles.board}>
          {columns.map(col => (
            <Column
              key={col.id}
              column={col}
              cards={cards.filter(c => c.columnId === col.id)}
              onRenameColumn={renameColumn}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? (
            <Card card={activeCard} onDelete={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
