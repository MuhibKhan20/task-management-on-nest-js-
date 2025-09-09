import { useQuery } from '@tanstack/react-query';

export type BoardStatistics = {
  boardId: string;
  boardTitle: string;
  boardColor: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  listsCount: number;
};

const fetchBoardStatistics = async (boardId: string): Promise<BoardStatistics> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL}/boards/${boardId}/statistics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch board statistics');
  }

  return response.json();
};

export const useBoardStatistics = (boardId: string) => {
  return useQuery({
    queryKey: ['board-statistics', boardId],
    queryFn: () => fetchBoardStatistics(boardId),
    enabled: !!boardId,
  });
};