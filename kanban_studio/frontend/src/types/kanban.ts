export type Id = string | number;

export interface Card {
  id: Id;
  columnId: Id;
  title: string;
  details: string;
}

export interface Column {
  id: Id;
  title: string;
}
