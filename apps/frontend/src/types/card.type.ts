export type TCard = {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'DONE';
  deadline?: Date | string;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
};
