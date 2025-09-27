export type TCard = {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'DONE';
  deadline?: Date | string;
  assignedUserId?: string;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TUser = {
  id: string;
  username: string;
  email: string;
  role?: string;
};

export type TAssignedTask = TCard & {
  listTitle: string;
  boardTitle: string;
  workspaceTitle: string;
  assignedToUsername?: string;
};
