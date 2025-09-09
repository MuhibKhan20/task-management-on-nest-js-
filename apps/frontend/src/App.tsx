import Box from '@mui/material/Box';
import Routes from './Routes/Routes';
import { ToastContainer } from 'react-toastify';
import NotificationContainer from './components/Notifications/NotificationContainer';
import { useDeadlineMonitor } from './hooks/useDeadlineMonitor';

import 'react-toastify/dist/ReactToastify.css';

function App() {
    useDeadlineMonitor();

  return (
    <>
      <Box display={'flex'} flexDirection={'column'} height={'100vh'}>
        <Routes />
      </Box>
      <NotificationContainer />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
