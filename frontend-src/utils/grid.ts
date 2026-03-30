import { Slot } from '../types/Slot';

export function generateGrid(rows: number, columns: number): Slot[] {
  const slots: Slot[] = [];
  let index = 0;

  for (let row = 1; row <= rows; row++) {
    for (let column = 1; column <= columns; column++) {
      slots.push({
        index,
        row,
        column,
        status: 'empty',
      });
      index++;
    }
  }

  return slots;
}
