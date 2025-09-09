import React from 'react';
import { Box } from '@mui/material';
import { useNotifications } from '../../context/NotificationContext';
import DeadlineNotificationPopup from './DeadlineNotificationPopup';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1400,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none', // Allow clicks to pass through the container
        '& > *': {
          pointerEvents: 'auto', // But allow clicks on the notifications themselves
        },
      }}
    >
      {notifications.map((notification) => (
        <DeadlineNotificationPopup
          key={notification.id}
          notification={notification}
        />
      ))}
    </Box>
  );
};

export default NotificationContainer;