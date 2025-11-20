export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[][];
export type Action = { row: number; col: number }; 