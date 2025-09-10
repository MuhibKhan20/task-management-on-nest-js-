import { useParams } from 'react-router-dom';
import useQueryByItemId from '../hooks/useQueryByItemId';
import { Box, CircularProgress, Container } from '@mui/material';
import { TBoard } from '../types/board.type';
import BoardTitleForm from '../components/Board/BordTitleForm';
import ListComponent from '../components/Board/ListComponent';

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();

  const queryBoard = useQueryByItemId<TBoard>(
    'board',
    `${import.meta.env.VITE_API_BOARDS}`,
    boardId
  );

  if (queryBoard.isPending) {
    return (
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
    );
  }

  if (queryBoard.isError) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom>
            Board not found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The board you're looking for doesn't exist or you don't have access to it.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <BoardTitleForm board={queryBoard.data} />
      <ListComponent
        workspaceId={queryBoard.data?.workspaceId}
        boardId={queryBoard.data?.id}
      />
    </Container>
  );
};

export default BoardPage;
