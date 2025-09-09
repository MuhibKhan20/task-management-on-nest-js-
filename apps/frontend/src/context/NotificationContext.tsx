import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TCard } from '../types/card.type';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type DeadlineNotification = {
  id: string;
  card: TCard;
  timeUntilDeadline: number; // in milliseconds
  priority: NotificationPriority;
  message: string;
  isShown: boolean;
};

type NotificationContextType = {
  notifications: DeadlineNotification[];
  dismissNotification: (id: string) => void;
  addNotification: (notification: DeadlineNotification) => void;
  checkDeadlines: (cards: TCard[]) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([]);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (notification: DeadlineNotification) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === notification.id);
      if (exists) {
        return prev.map(n => n.id === notification.id ? notification : n);
      }
      return [...prev, notification];
    });
  };

  const getTimeUntilDeadline = (deadline: Date | string): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate.getTime() - now.getTime();
  };

  const createNotificationMessage = (timeUntil: number, cardTitle: string): string => {
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `Task "${cardTitle}" is due in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours >= 1) {
      return `Task "${cardTitle}" is due in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `Task "${cardTitle}" is due in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `Task "${cardTitle}" is overdue!`;
    }
  };

  const getNotificationPriority = (timeUntil: number): NotificationPriority => {
    if (timeUntil <= 10 * 60 * 1000) { // 10 minutes or less
      return 'high';
    } else if (timeUntil <= 60 * 60 * 1000) { // 1 hour or less
      return 'medium';
    } else {
      return 'low';
    }
  };

  const shouldShowNotification = (timeUntil: number, cardId: string): boolean => {
    const notificationKey = `${cardId}-${Math.floor(timeUntil / (1000 * 60))}`;
    
    // Show notifications at specific thresholds: 1 day, 1 hour, 10 minutes
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneHourMs = 60 * 60 * 1000;
    const tenMinutesMs = 10 * 60 * 1000;

    const isWithinOneDay = timeUntil <= oneDayMs && timeUntil > oneDayMs - (5 * 60 * 1000); // 5-minute window
    const isWithinOneHour = timeUntil <= oneHourMs && timeUntil > oneHourMs - (2 * 60 * 1000); // 2-minute window
    const isWithinTenMinutes = timeUntil <= tenMinutesMs && timeUntil > 0;

    if ((isWithinOneDay || isWithinOneHour || isWithinTenMinutes) && !shownNotifications.has(notificationKey)) {
      setShownNotifications(prev => new Set([...prev, notificationKey]));
      return true;
    }

    return false;
  };

  const checkDeadlines = (cards: TCard[]) => {
    const now = new Date();
    const activeCards = cards.filter(card => 
      card.status !== 'DONE' && 
      card.deadline && 
      new Date(card.deadline) > now
    );

    const newNotifications: DeadlineNotification[] = [];

    activeCards.forEach(card => {
      if (!card.deadline) return;

      const timeUntil = getTimeUntilDeadline(card.deadline);
      
      if (shouldShowNotification(timeUntil, card.id)) {
        const notification: DeadlineNotification = {
          id: `${card.id}-${Date.now()}`,
          card,
          timeUntilDeadline: timeUntil,
          priority: getNotificationPriority(timeUntil),
          message: createNotificationMessage(timeUntil, card.title),
          isShown: false,
        };

        newNotifications.push(notification);
      }
    });

    newNotifications.forEach(notification => {
      addNotification(notification);
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      dismissNotification,
      addNotification,
      checkDeadlines,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};