import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Tooltip,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { grey, green, lightBlue, red } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import BoardModal from '../Modal/BoardModal';
import useQueryAllByItemId from '../../../hooks/useQueryAllByItemId';
import { TBoard } from '../../../types/board.type';
import { RoleBasedAccess } from '../../RoleBasedAccess';
import BoardCard from './BoardCard';

type BoardsViewerProps = {
  selectedWorkspaceId: string | undefined;
};

const BoardsViewer = ({ selectedWorkspaceId }: BoardsViewerProps) => {
  const [openModal, setOpenModal] = useState(false);

  const { data: boards, isPending } = useQueryAllByItemId<TBoard[]>(
    'boards',
    `${import.meta.env.VITE_API_WORKSPACES}`,
    selectedWorkspaceId
  );

  const toggleModal = () => {
    setOpenModal((prevVal) => !prevVal);
  };

  return (
    <>
      <Box>
        <Typography variant="h6" sx={{ opacity: '0.8' }}>
          Boards
        </Typography>
        {isPending ? (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              marginTop: '1rem'
            }}
          >
            {boards !== undefined &&
              boards?.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onClick={() => window.location.href = `/boards/${board.id}`}
                />
              ))}
            <RoleBasedAccess allowedRoles={['ADMIN']}>
              <Tooltip title="Add new board">
                <Box
                  onClick={toggleModal}
                  sx={{
                    minWidth: '280px',
                    height: '320px',
                    borderRadius: '12px',
                    border: `2px dashed ${grey[400]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    backgroundColor: grey[50],
                    '&:hover': {
                      backgroundColor: grey[100],
                      border: `2px dashed ${grey[600]}`,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: 48, color: grey[600], mb: 1 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Add New Board
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Create a new task board
                  </Typography>
                </Box>
              </Tooltip>
            </RoleBasedAccess>
          </Box>
        )}
      </Box>
      <BoardModal
        openModal={openModal}
        toggleModal={toggleModal}
        selectedWorkspaceId={selectedWorkspaceId}
      />
    </>
  );
};

export default BoardsViewer;
