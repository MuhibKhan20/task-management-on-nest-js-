import { useState, useEffect } from 'react';
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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../../context/AuthContextProvider';

const AssignedTasksViewer = () => {
  const { user, accessToken } = useAuth();

  const { data: assignedTasks, isPending, error } = useQuery<TAssignedTask[]>({
    queryKey: ['assigned-tasks', user?.userId],
    queryFn: async () => {
      if (!user?.userId) {
        throw new Error('No user ID available');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/assigned-tasks/${user.userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assigned tasks');
      }
      return response.json();
    },
    enabled: !!user?.userId && !!accessToken, // Only run if user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh longer
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 1, // Fast fail - only retry once
    retryDelay: 500, // Quick retry
    refetchOnWindowFocus: true, // Refresh when user comes back
    refetchOnMount: false, // Don't refetch if data is fresh
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

  // Show login message if no user
  if (!accessToken || !user) {
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

  // Show admin welcome message
  if (user.role === 'ADMIN') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <AdminPanelSettingsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" color="primary.main">
          Welcome, Administrator!
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          As an admin, you can manage the system but don't have personal task assignments.
          Use the board view to oversee all projects and tasks.
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