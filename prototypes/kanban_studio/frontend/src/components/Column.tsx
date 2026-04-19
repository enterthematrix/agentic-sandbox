import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Column as ColumnType, Card as CardType, Id } from '../types/kanban';
import { Card } from './Card';
import styles from './KanbanBoard.module.css';

interface Props {
  column: ColumnType;
  cards: CardType[];
  onRenameColumn: (id: Id, title: string) => void;
  onAddCard: (colId: Id, title: string, details: string) => void;
  onDeleteCard: (id: Id) => void;
}

export function Column({ column, cards, onRenameColumn, onAddCard, onDeleteCard }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const handleRenameSubmit = () => {
    setIsEditing(false);
    onRenameColumn(column.id, editTitle);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCard(column.id, newTitle, newDetails);
    setNewTitle('');
    setNewDetails('');
    setIsAdding(false);
  };

  return (
    <div className={styles.column} ref={setNodeRef}>
      <div className={styles.columnHeader}>
        {isEditing ? (
          <input
            autoFocus
            className={styles.columnEditInput}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
          />
        ) : (
          <h2 className={styles.columnTitle} onClick={() => setIsEditing(true)} title="Click to rename">
            {column.title}
          </h2>
        )}
      </div>

      <div className={styles.cardList}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>

      {isAdding ? (
        <form className={styles.addForm} onSubmit={handleAddSubmit}>
          <input
            autoFocus
            placeholder="Card Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className={styles.addInput}
          />
          <textarea
            placeholder="Details (optional)"
            value={newDetails}
            onChange={e => setNewDetails(e.target.value)}
            className={styles.addTextarea}
            rows={2}
          />
          <div className={styles.addActions}>
            <button type="submit" className={styles.btnPrimary}>Add</button>
            <button type="button" className={styles.btnCancel} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className={styles.addCardButton} onClick={() => setIsAdding(true)}>
          + Add a card
        </button>
      )}
    </div>
  );
}
