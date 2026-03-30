import { Room } from '../types/Room';

export const mockRooms: Room[] = [
  {
    id: 1,
    name: 'Flower Room A',
    rows: 3,
    columns: 4,
    plantCount: 8,
  },
  {
    id: 2,
    name: 'Flower Room B',
    rows: 3,
    columns: 4,
    plantCount: 10,
  },
  {
    id: 3,
    name: 'Veg Room 1',
    rows: 4,
    columns: 4,
    plantCount: 6,
  },
  {
    id: 4,
    name: 'Mother Room',
    rows: 2,
    columns: 4,
    plantCount: 4,
  },
];

export function getRooms(): Promise<Room[]> {
  return Promise.resolve(mockRooms);
}
