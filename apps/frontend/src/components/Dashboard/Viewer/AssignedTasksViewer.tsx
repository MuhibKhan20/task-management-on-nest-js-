import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { TAssignedTask } from '../../../types/card.type';
import { format } from 'date-fns';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const AssignedTasksViewer = () => {
  // Get current user's ID from localStorage
  const getCurrentUserId = () => {
    try {
      // Check multiple possible token keys
      const possibleKeys = ['accessToken', 'access_token', 'token', 'authToken'];
      let token = null;
      let tokenKey = null;

      for (const key of possibleKeys) {
        const storedToken = localStorage.getItem(key);
        if (storedToken) {
          token = storedToken;
          tokenKey = key;
          break;
        }
      }

      console.log('All localStorage keys:', Object.keys(localStorage));
      console.log(`Token found under key "${tokenKey}":`, token ? 'YES' : 'NO');

      if (!token) {
        console.warn('No access token found in localStorage with any of these keys:', possibleKeys);
        return null;
      }

      // Parse JWT token
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format - expected 3 parts, got:', parts.length);
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT payload:', payload);

      const userId = payload.sub || payload.userId || payload.id;

      if (!userId) {
        console.warn('No user ID found in JWT token payload:', payload);
        return null;
      }

      console.log('Current user ID from JWT:', userId);
      return userId;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  const { data: assignedTasks, isPending, error } = useQuery<TAssignedTask[]>({
    queryKey: ['assigned-tasks', currentUserId],
    queryFn: async () => {
      if (!currentUserId) {
        throw new Error('No user ID available - please log in');
      }
      const response = await fetch(`/api/users/assigned-tasks/${currentUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assigned tasks');
      }
      return response.json();
    },
    enabled: !!currentUserId, // Only run query if we have a user ID
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: 1000,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'primary';
      case 'DONE': return 'success';
      default: return 'default';
    }
  };

  const isOverdue = (deadline: string | Date | undefined) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // Show login message if no user ID
  if (!currentUserId) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <AssignmentIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
        <Typography variant="h6" color="warning.main">
          Please log in to view your assigned tasks
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          You need to be logged in to see tasks assigned specifically to you.
        </Typography>
      </Box>
    );
  }

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading assigned tasks...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error.message.includes('log in')
          ? 'Please log in to view your assigned tasks'
          : 'Failed to load assigned tasks. Please try again later.'}
      </Alert>
    );
  }

  if (!assignedTasks || assignedTasks.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No tasks assigned to you yet
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          When tasks are assigned to you, they will appear here with their deadlines.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={3}>
        <AssignmentIcon color="primary" />
        <Typography variant="h5">
          My Assigned Tasks ({assignedTasks.length})
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {assignedTasks.map((task) => (
          <Card
            key={task.id}
            elevation={2}
            sx={{
              border: isOverdue(task.deadline) ? '1px solid' : 'none',
              borderColor: isOverdue(task.deadline) ? 'error.main' : 'transparent',
              '&:hover': {
                elevation: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {task.title}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                    variant="filled"
                  />
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {task.description}
              </Typography>

              {task.deadline && (
                <Stack direction="row" alignItems="center" gap={1} mb={2}>
                  <CalendarTodayIcon
                    fontSize="small"
                    color={isOverdue(task.deadline) ? 'error' : 'action'}
                  />
                  <Typography
                    variant="body2"
                    color={isOverdue(task.deadline) ? 'error.main' : 'text.secondary'}
                    sx={{ fontWeight: isOverdue(task.deadline) ? 600 : 400 }}
                  >
                    Due: {format(new Date(task.deadline), 'MMM dd, yyyy hh:mm a')}
                    {isOverdue(task.deadline) && ' (Overdue)'}
                  </Typography>
                </Stack>
              )}

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="caption" color="text.secondary">
                    Workspace: {task.workspaceTitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Board: {task.boardTitle} › {task.listTitle}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default AssignedTasksViewer;