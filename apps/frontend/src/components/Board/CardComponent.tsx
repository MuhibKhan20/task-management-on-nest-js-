import { useState } from 'react';
import {
  Box,
  Button,
  CardContent,
  Theme,
  Typography,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TCard } from '../../types/card.type';
import CardModalCreate from './Modal/CardModalCreate';
import useQueryAllByItemId from '../../hooks/useQueryAllByItemId';
import CardModalUpdate from './Modal/CardModalUpdate';
import { RoleBasedAccess } from '../RoleBasedAccess';

type CardComponentProps = {
  workspaceId: string | undefined;
  listId: string | undefined;
};

const CardComponent = ({
  workspaceId,
  listId
}: CardComponentProps) => {
  const matches = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.up('sm')
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');

  const queryCards = useQueryAllByItemId<TCard[]>(
    'cards',
    `${import.meta.env.VITE_API_LISTS}`,
    listId
  );

  const toggleCreateModal = () => {
    setOpenCreateModal((prevVal) => !prevVal);
  };

  const toggleUpdateModal = (id: string) => {
    setSelectedCardId(id);
    setOpenUpdateModal((prevVal) => !prevVal);
  };

  return (
    <>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          p: '8px'
        }}
      >
        {queryCards.data?.map((card) => {
          const isOverdue = card.deadline && new Date(card.deadline) < new Date() && card.status !== 'DONE';
          return (
            <div key={card.id}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  backgroundColor: card.status === 'DONE' ? 'success.main' : isOverdue ? 'error.main' : 'primary.main',
                  '&:hover': {
                    backgroundColor: card.status === 'DONE' ? 'success.dark' : isOverdue ? 'error.dark' : 'primary.dark'
                  },
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '8px 12px'
                }}
                onClick={() => toggleUpdateModal(card.id)}
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ textDecoration: card.status === 'DONE' ? 'line-through' : 'none' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {card.status === 'DONE' ? '✓' : card.priority}
                  </Typography>
                </Box>
                {card.deadline && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: '0.7rem',
                      color: isOverdue ? 'white' : 'inherit'
                    }}
                  >
                    📅 {new Date(card.deadline).toLocaleDateString()} {new Date(card.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {isOverdue && ' (Overdue)'}
                  </Typography>
                )}
              </Button>
            </div>
          );
        })}
        <RoleBasedAccess allowedRoles={['ADMIN']}>
          <Button
            variant="outlined"
            size="small"
            sx={{
              width: '100%',
              justifyContent: matches ? 'start' : 'center',
              textTransform: 'none',
              fontSize: '0.9rem'
            }}
            onClick={toggleCreateModal}
          >
            <AddIcon />
            <Typography
              variant="subtitle1"
              sx={{ display: matches ? 'block' : 'none' }}
            >
              Add a card
            </Typography>
          </Button>
        </RoleBasedAccess>
      </CardContent>
      <CardModalCreate
        openModal={openCreateModal}
        toggleModal={toggleCreateModal}
        workspaceId={workspaceId}
        listId={listId}
      />
      <CardModalUpdate
        openModal={openUpdateModal}
        toggleModal={toggleUpdateModal}
        workspaceId={workspaceId}
        listId={listId}
        card={queryCards.data?.find(
          (card) => card.id === selectedCardId
        )}
      />
    </>
  );
};

export default CardComponent;
