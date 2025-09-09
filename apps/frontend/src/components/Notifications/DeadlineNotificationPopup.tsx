import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNotifications, DeadlineNotification } from '../../context/NotificationContext';

type NotificationPopupProps = {
  notification: DeadlineNotification;
};

const DeadlineNotificationPopup: React.FC<NotificationPopupProps> = ({ notification }) => {
  const { dismissNotification } = useNotifications();

  useEffect(() => {
    // Auto-dismiss low priority notifications after 8 seconds
    // Medium priority after 12 seconds
    // High priority notifications stay until manually dismissed
    let timeoutId: NodeJS.Timeout | null = null;

    if (notification.priority === 'low') {
      timeoutId = setTimeout(() => {
        dismissNotification(notification.id);
      }, 8000);
    } else if (notification.priority === 'medium') {
      timeoutId = setTimeout(() => {
        dismissNotification(notification.id);
      }, 12000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [notification.id, notification.priority, dismissNotification]);

  const getSeverity = () => {
    switch (notification.priority) {
      case 'high':
        return 'error' as const;
      case 'medium':
        return 'warning' as const;
      case 'low':
        return 'info' as const;
      default:
        return 'info' as const;
    }
  };

  const getIcon = () => {
    switch (notification.priority) {
      case 'high':
        return <ErrorIcon />;
      case 'medium':
        return <WarningIcon />;
      case 'low':
        return <ScheduleIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.card.priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleClose = () => {
    dismissNotification(notification.id);
  };

  const handleCardClick = () => {
    // Navigate to the card - you might want to implement this based on your routing
    // For now, we'll just dismiss the notification
    dismissNotification(notification.id);
    // TODO: Add navigation to the specific board/card
    console.log('Navigate to card:', notification.card.id);
  };

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        position: 'fixed',
        top: 80, // Adjust based on your header height
        zIndex: 1400,
      }}
    >
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          minWidth: 350,
          maxWidth: 500,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (theme) => 
              theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'rgba(255, 255, 255, 0.04)',
          },
        }}
        onClick={handleCardClick}
      >
        <AlertTitle sx={{ fontWeight: 600, mb: 1 }}>
          Task Deadline Reminder
        </AlertTitle>
        
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {notification.message}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={`Priority: ${notification.card.priority}`}
              size="small"
              color={getPriorityColor() as any}
              variant="outlined"
            />
            
            <Typography variant="caption" color="text.secondary">
              Click to view task
            </Typography>
          </Box>
          
          {notification.card.description && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 300,
              }}
            >
              {notification.card.description}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default DeadlineNotificationPopup;