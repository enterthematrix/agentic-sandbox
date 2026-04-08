# Database Approach for Kanban MVP

## Core Philosophy
In alignment with the project's technical principle to **"ALWAYS simplify, NO unnecessary defensive programming,"** we are adopting a minimalist schema using SQLite natively. 

The frontend heavily relies on array-ordering metrics via `@dnd-kit`. Normalizing kanban columns and cards into relational tables (`Columns`, `Cards`) necessitates complex sequence-ordering logic (e.g., maintaining linked lists or fractional sorting indices in SQLite). 

To eliminate this complexity, the entire current state of a user's Kanban board will be serialized and stored as a Native JSON Document. 

## Proposed Schema

### 1. `users` Table
Handles our user accounts. While the MVP specifies hardcoded fake credentials, this table prepares the foundation for future scaling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier. |
| `username` | `TEXT` | `UNIQUE NOT NULL` | Login username ("user"). |
| `password` | `TEXT` | `NOT NULL` | The user's authentication credential. |

### 2. `boards` Table
Maintains exactly one board per user mapping directly to the frontend's `BoardData` structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier. |
| `user_id` | `INTEGER` | `UNIQUE NOT NULL` | Links exactly one board to one user (`FOREIGN KEY` to `users(id)`). |
| `data` | `TEXT` | `NOT NULL` | The serialized JSON payload representing `BoardData` (`{"columns": [...], "cards": {...}}`). |

## Interaction Strategy (Implementation in Part 6)
When a user logs in (or visits the dashboard):
1. The backend natively selects the `data` scalar from `boards` for the `user_id`.
2. Any `DragEndEvent`, addition, column rename, or removal triggers a full payload update to the REST API, taking the React-side `BoardData` and overwriting the JSON entry directly in the SQLite Database.

This keeps all business drag-and-drop complexity entirely offloaded to the frontend while giving the database atomic, persistent save states.
