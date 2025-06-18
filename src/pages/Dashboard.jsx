import React, { useEffect, useState } from 'react';
import { useUser } from '../contextApi/UserContext';
import {
  Box,
  Paper,
  Typography,
  Stack,
} from '@mui/material';

const Dashboard = () => {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      display="flex"
      justifyContent="center"
      
      width="100%"
      padding={4}
    >
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', width: '100%', maxWidth: 800 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            📊 Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            👤 User: <Typography component="span" fontWeight="medium">{user.username}</Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            🕒 Time: <Typography component="span" fontWeight="medium">{currentTime}</Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            🔄 Shift: <Typography component="span" fontWeight="medium">{user.shiftNo}</Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            📅 Shift Date: <Typography component="span" fontWeight="medium">{user.shiftDate}</Typography>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Dashboard;
