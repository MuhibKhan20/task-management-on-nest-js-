import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Skeleton,
  IconButton,
} from '@mui/material';
import { grey, green, lightBlue, red, orange } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useBoardStatistics } from '../../../hooks/useBoardStatistics';
import { TBoard } from '../../../types/board.type';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

type BoardCardProps = {
  board: TBoard;
  onClick: () => void;
};

const BoardCard = ({ board, onClick }: BoardCardProps) => {
  const { data: stats, isLoading, isError } = useBoardStatistics(board.id);

  const getBoardColor = () => {
    switch (board.color) {
      case 'RED':
        return red.A200;
      case 'GREEN':
        return green.A200;
      case 'BLUE':
        return lightBlue.A200;
      default:
        return grey[300];
    }
  };

  const getCompletionChartData = () => {
    if (!stats) return null;
    
    return {
      datasets: [
        {
          data: [stats.completedTasks, stats.pendingTasks],
          backgroundColor: [
            green[500],
            orange[500],
          ],
          borderWidth: 0,
          cutout: '70%',
        },
      ],
    };
  };

  const getPriorityChartData = () => {
    if (!stats) return null;
    
    return {
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          data: [stats.priorityBreakdown.high, stats.priorityBreakdown.medium, stats.priorityBreakdown.low],
          backgroundColor: [red[400], orange[400], green[400]],
          borderRadius: 4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.label + ': ' + context.raw;
          }
        }
      }
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <Card
        sx={{
          minWidth: '280px',
          height: '320px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mt: 2 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card
        onClick={onClick}
        sx={{
          minWidth: '280px',
          height: '320px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          background: alpha(getBoardColor(), 0.1),
          border: `2px solid ${alpha(getBoardColor(), 0.2)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: `2px solid ${alpha(getBoardColor(), 0.4)}`,
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom>
            {board.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unable to load board statistics
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card
        onClick={onClick}
        sx={{
          minWidth: '280px',
          height: '320px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          background: alpha(getBoardColor(), 0.1),
          border: `2px solid ${alpha(getBoardColor(), 0.2)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: `2px solid ${alpha(getBoardColor(), 0.4)}`,
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom>
            {board.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading board data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const completionChartData = getCompletionChartData();
  const priorityChartData = getPriorityChartData();

  return (
    <Card
      onClick={onClick}
      sx={{
        minWidth: '280px',
        height: '320px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        background: alpha(getBoardColor(), 0.05),
        border: `2px solid ${alpha(getBoardColor(), 0.2)}`,
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: `2px solid ${alpha(getBoardColor(), 0.4)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
            {board.title}
          </Typography>
          <AssignmentIcon sx={{ color: getBoardColor(), ml: 1 }} />
        </Box>

        {/* Progress Overview */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ position: 'relative', width: 80, height: 80, mr: 2 }}>
            {completionChartData && (
              <Doughnut data={completionChartData} options={chartOptions} />
            )}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                {stats.completionPercentage}%
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Task Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={stats.completionPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(getBoardColor(), 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getBoardColor(),
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {stats.completedTasks} of {stats.totalTasks} completed
            </Typography>
          </Box>
        </Box>

        {/* Statistics Grid */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ color: green[500], fontSize: 20, mb: 0.5 }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                {stats.completedTasks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Done
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <PendingIcon sx={{ color: orange[500], fontSize: 20, mb: 0.5 }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                {stats.pendingTasks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ color: red[500], fontSize: 20, mb: 0.5 }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                {stats.overdueTasks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overdue
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Priority Breakdown Chart */}
        {priorityChartData && stats.totalTasks > 0 && (
          <Box sx={{ flexGrow: 1, minHeight: 60 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
              Priority Breakdown (Pending Tasks)
            </Typography>
            <Box sx={{ height: 50 }}>
              <Bar data={priorityChartData} options={barChartOptions} />
            </Box>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {stats.listsCount} lists
          </Typography>
          {stats.overdueTasks > 0 && (
            <Chip
              label={`${stats.overdueTasks} overdue`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default BoardCard;