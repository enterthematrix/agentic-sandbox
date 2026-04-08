import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '../types/kanban';
import styles from './KanbanBoard.module.css';

interface Props {
  card: CardType;
  onDelete: (id: string | number) => void;
}

export function Card({ card, onDelete }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.card}
      {...attributes}
      {...listeners}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{card.title}</h3>
        <button 
          className={styles.deleteButton} 
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          aria-label="Delete Card"
        >
          &times;
        </button>
      </div>
      {card.details && <p className={styles.cardDetails}>{card.details}</p>}
    </div>
  );
}
