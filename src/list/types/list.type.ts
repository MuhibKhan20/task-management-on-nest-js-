import { TCard } from 'src/card/types/card.type';

export type TList = {
  id: string;
  title: string;
  boardId: string;
  cards?: TCard[];
  createdAt: Date;
  updatedAt: Date;
};
