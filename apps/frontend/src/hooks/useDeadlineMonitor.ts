import { useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { TCard } from '../types/card.type';

const NOTIFICATION_CHECK_INTERVAL = 60000; // Check every minute

export const useDeadlineMonitor = () => {
  const { checkDeadlines } = useNotifications();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllUserCards = useCallback(async (): Promise<TCard[]> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return [];
      }

      // First, get all workspaces for the user
      const workspacesResponse = await fetch(`${import.meta.env.VITE_API_URL}/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!workspacesResponse.ok) {
        console.warn('Failed to fetch workspaces for deadline monitoring');
        return [];
      }

      const workspaces = await workspacesResponse.json();
      const allCards: TCard[] = [];

      // For each workspace, get all boards
      for (const workspace of workspaces) {
        try {
          const boardsResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/workspaces/${workspace.id}/boards`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!boardsResponse.ok) continue;

          const boards = await boardsResponse.json();

          // For each board, get all lists and their cards
          for (const board of boards) {
            try {
              const listsResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/boards/${board.id}/lists`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!listsResponse.ok) continue;

              const lists = await listsResponse.json();

              // For each list, get all cards
              for (const list of lists) {
                try {
                  const cardsResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/lists/${list.id}/cards`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  );

                  if (!cardsResponse.ok) continue;

                  const cards = await cardsResponse.json();
                  allCards.push(...cards);
                } catch (error) {
                  console.warn('Failed to fetch cards for list:', list.id, error);
                }
              }
            } catch (error) {
              console.warn('Failed to fetch lists for board:', board.id, error);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch boards for workspace:', workspace.id, error);
        }
      }

      return allCards;
    } catch (error) {
      console.error('Failed to fetch user cards for deadline monitoring:', error);
      return [];
    }
  }, []);

  const performDeadlineCheck = useCallback(async () => {
    try {
      const cards = await fetchAllUserCards();
      
      // Filter cards that have deadlines and are not completed
      const cardsWithDeadlines = cards.filter(card => 
        card.deadline && 
        card.status !== 'DONE'
      );

      if (cardsWithDeadlines.length > 0) {
        checkDeadlines(cardsWithDeadlines);
      }
    } catch (error) {
      console.error('Error during deadline check:', error);
    }
  }, [fetchAllUserCards, checkDeadlines]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    // Perform initial check
    performDeadlineCheck();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(performDeadlineCheck, NOTIFICATION_CHECK_INTERVAL);
  }, [performDeadlineCheck]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start monitoring when the hook is used
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      startMonitoring();
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    performDeadlineCheck,
  };
};