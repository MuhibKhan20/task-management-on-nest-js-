import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
  Autocomplete
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { LoadingButton } from '@mui/lab';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useMutationCardCreate from '../../../hooks/useMutationCardCreate';
import { useQuery } from '@tanstack/react-query';
import { TUser } from '../../../types/card.type';

const priorityEnum = ['LOW', 'MEDIUM', 'HIGH'];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['TODO', 'DONE']).default('TODO'),
  deadline: z.string().optional(),
  assignedUserId: z.string().optional()
});

type formType = z.infer<typeof formSchema>;

type CardModalCreateProps = {
  openModal: boolean;
  toggleModal: () => void;
  workspaceId: string | undefined;
  listId: string | undefined;
};

const CardModalCreate = ({
  openModal,
  toggleModal,
  workspaceId,
  listId
}: CardModalCreateProps) => {
  // Fetch assignable users (users with 'USER' role)
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<TUser[]>({
    queryKey: ['assignable-users'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/assignable`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: openModal // Only fetch when modal is open
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<formType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'LOW',
      status: 'TODO',
      deadline: '',
      assignedUserId: ''
    }
  });

  const cardMutation = useMutationCardCreate({
    toggleModal,
    reset,
    workspaceId,
    listId
  });

  const onSubmit = (data: formType) => {
    cardMutation.mutate(data);
  };

  return (
    <Modal
      open={openModal}
      onClose={() => {
        reset({
          title: '',
          description: '',
          priority: 'LOW',
          status: 'TODO',
          deadline: '',
          assignedUserId: ''
        });
        toggleModal();
      }}
      aria-labelledby="keep-mounted-modal-title"
      aria-describedby="keep-mounted-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4
        }}
      >
        <Box sx={{ width: '30ch', marginX: 'auto' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            Create Card
          </Typography>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack
            direction={'column'}
            spacing={1}
            alignItems={'center'}
          >
            <FormControl
              sx={{ m: 1, width: '30ch' }}
              variant="outlined"
            >
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    id="outlined-basic"
                    label="Title"
                    variant="outlined"
                    {...field}
                  />
                )}
              />
              <FormHelperText
                id="title-error-text"
                error={errors.title?.message !== '' ? true : false}
              >
                {errors.title?.message}
              </FormHelperText>
            </FormControl>

            <FormControl
              sx={{ m: 1, width: '30ch' }}
              variant="outlined"
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    id="outlined-textarea"
                    label="Description"
                    variant="outlined"
                    multiline
                    rows={4}
                    {...field}
                  />
                )}
              />
              <FormHelperText
                id="description-error-text"
                error={
                  errors.description?.message !== '' ? true : false
                }
              >
                {errors.description?.message}
              </FormHelperText>
            </FormControl>

            <FormControl
              sx={{ m: 1, width: '30ch' }}
              variant="outlined"
            >
              <InputLabel id="select-label">Priority</InputLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="select-label"
                    id="select-helper"
                    label="Priority"
                    {...field}
                  >
                    {priorityEnum.map((priority, index) => {
                      return (
                        <MenuItem
                          key={priority + index}
                          value={priority}
                        >
                          {priority}
                        </MenuItem>
                      );
                    })}
                  </Select>
                )}
              />
              <FormHelperText
                id="priority-error-text"
                error={errors.priority?.message !== '' ? true : false}
              >
                {errors.priority?.message}
              </FormHelperText>
            </FormControl>

            <FormControl
              sx={{ m: 1, width: '30ch' }}
              variant="outlined"
            >
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <TextField
                    id="deadline-input"
                    label="Deadline"
                    variant="outlined"
                    type="datetime-local"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    {...field}
                  />
                )}
              />
              <FormHelperText
                id="deadline-error-text"
                error={errors.deadline?.message !== '' ? true : false}
              >
                {errors.deadline?.message}
              </FormHelperText>
            </FormControl>

            <FormControl
              sx={{ m: 1, width: '30ch' }}
              variant="outlined"
            >
              <Controller
                name="assignedUserId"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    options={users}
                    getOptionLabel={(option) =>
                      typeof option === 'string' ? option : `${option.username} (${option.email})`
                    }
                    value={users.find(user => user.id === value) || null}
                    onChange={(_, selectedUser) => {
                      onChange(selectedUser?.id || '');
                    }}
                    renderOption={(props, option, { inputValue }) => (
                      <Box
                        component="li"
                        {...props}
                        key={option.id}
                        sx={{
                          backgroundColor: '#f1f8e9 !important', // Light green background
                          border: '2px solid #4caf50', // Dark green border
                          borderRadius: '12px',
                          margin: '6px 12px',
                          padding: '12px 16px !important',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: '#e8f5e8 !important', // Slightly darker green on hover
                            borderColor: '#388e3c', // Darker green border on hover
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                          },
                          '&[aria-selected="true"]': {
                            backgroundColor: '#c8e6c9 !important', // Medium green when selected
                            borderColor: '#2e7d32', // Dark green border when selected
                            borderWidth: '3px',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: '#4caf50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '16px'
                            }}
                          >
                            {option.username.charAt(0).toUpperCase()}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{
                              
                            }}>
                              {option.username}
                            </Typography>
                            <Typography variant="body2" sx={{
                            
                            }}>
                               {option.email}
                            </Typography>
                          </Box>
                          <Box >
                            
                          </Box>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="🔍 Search & Assign User"
                        variant="outlined"
                        placeholder="Type to search by name or email..."
                        helperText="💡 Start typing to find users instantly - click to assign"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f1f8e9', // Light green background
                            fontSize: '16px',
                            '& fieldset': {
                              borderColor: '#4caf50', // Dark green border
                              borderWidth: '2px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#388e3c', // Darker green on hover
                              borderWidth: '3px',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2e7d32', // Darkest green when focused
                              borderWidth: '3px',
                              boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)',
                            },
                            '& input': {
                              fontSize: '16px',
                              fontWeight: 500,
                              color: '#2e7d32',
                              '&::placeholder': {
                                color: '#81c784',
                                opacity: 1,
                                fontStyle: 'italic',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#4caf50', // Green label
                            fontWeight: 700,
                            fontSize: '16px',
                            '&.Mui-focused': {
                              color: '#2e7d32', // Dark green when focused
                              fontWeight: 800,
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#4caf50', // Green helper text
                            fontWeight: 600,
                            fontSize: '13px',
                            marginTop: '8px',
                          },
                        }}
                      />
                    )}
                    loading={usersLoading}
                    clearOnEscape
                    openOnFocus
                    autoHighlight
                    selectOnFocus
                    filterOptions={(options, { inputValue }) => {
                      const searchTerm = inputValue.toLowerCase().trim();
                      if (!searchTerm) return options;

                      const filtered = options.filter((option) =>
                        option.username.toLowerCase().includes(searchTerm) ||
                        option.email.toLowerCase().includes(searchTerm)
                      );

                      // Sort by relevance - exact matches first, then partial matches
                      return filtered.sort((a, b) => {
                        const aUsernameExact = a.username.toLowerCase().startsWith(searchTerm);
                        const bUsernameExact = b.username.toLowerCase().startsWith(searchTerm);
                        const aEmailExact = a.email.toLowerCase().startsWith(searchTerm);
                        const bEmailExact = b.email.toLowerCase().startsWith(searchTerm);

                        if (aUsernameExact && !bUsernameExact) return -1;
                        if (!aUsernameExact && bUsernameExact) return 1;
                        if (aEmailExact && !bEmailExact) return -1;
                        if (!aEmailExact && bEmailExact) return 1;

                        return a.username.localeCompare(b.username);
                      });
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="🔍 No users found - try a different search term"
                    loadingText="🔄 Loading users..."
                    clearText="✖️ Clear selection"
                    openText="🔽 Open user list"
                    closeText="🔼 Close user list"
                    size="medium"
                    fullWidth
                    disableCloseOnSelect={false}
                    blurOnSelect
                    sx={{
                      '& .MuiAutocomplete-paper': {
                        backgroundColor: '#f1f8e9', // Light green dropdown background
                        border: '3px solid #4caf50', // Dark green dropdown border
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                        maxHeight: '300px',
                      },
                      '& .MuiAutocomplete-listbox': {
                        backgroundColor: '#f1f8e9', // Light green background for options list
                        padding: '8px 0',
                      },
                      '& .MuiAutocomplete-noOptions': {
                        color: '#4caf50', // Green text for "No options"
                        fontWeight: 600,
                        fontSize: '16px',
                        textAlign: 'center',
                        padding: '20px',
                      },
                      '& .MuiAutocomplete-loading': {
                        color: '#4caf50', // Green text for loading state
                        fontWeight: 600,
                        fontSize: '16px',
                        textAlign: 'center',
                        padding: '20px',
                      },
                      '& .MuiAutocomplete-clearIndicator': {
                        color: '#4caf50',
                        '&:hover': {
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          color: '#2e7d32',
                        },
                      },
                      '& .MuiAutocomplete-popupIndicator': {
                        color: '#4caf50',
                        '&:hover': {
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          color: '#2e7d32',
                        },
                      },
                    }}
                  />
                )}
              />
              <FormHelperText
                id="assigned-user-error-text"
                error={errors.assignedUserId?.message !== '' ? true : false}
              >
                {errors.assignedUserId?.message ||
                 (usersError && 'Failed to load users') ||
                 (users.length === 0 && !usersLoading && 'No users available for assignment')}
              </FormHelperText>
            </FormControl>

            <Stack
              direction={'row'}
              flex={1}
              gap={2}
              justifyContent={'space-between'}
              sx={{ m: 1, width: '30ch' }}
            >
              <Button
                type="button"
                size="small"
                variant="contained"
                sx={{ width: '6rem' }}
                onClick={() => {
                  reset({
                    title: '',
                    description: '',
                    priority: 'LOW',
                    status: 'TODO',
                    deadline: '',
                    assignedUserId: ''
                  });
                  toggleModal();
                }}
              >
                <span>Cancel</span>
              </Button>
              <LoadingButton
                type="submit"
                size="small"
                endIcon={<SendIcon />}
                loading={cardMutation.isPending}
                loadingPosition="end"
                variant="contained"
                sx={{ width: '6rem' }}
              >
                <span>Create</span>
              </LoadingButton>
            </Stack>
            {cardMutation.error && (
              <FormHelperText error={cardMutation.isError}>
                {cardMutation.error.message}
              </FormHelperText>
            )}
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};

export default CardModalCreate;
