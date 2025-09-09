import GitHubIcon from '@mui/icons-material/GitHub';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

const Footer = () => {
  return (
    <Box
      display={'flex'}
      justifyContent={'center'}
      alignItems={'center'}
      gap={1}
      py={'0.5rem'}
    >
      <Typography
        variant="body2"
        variantMapping={{ body2: 'p' }}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        Copyright © Adevi
      </Typography>
     
    </Box>
  );
};

export default Footer;
