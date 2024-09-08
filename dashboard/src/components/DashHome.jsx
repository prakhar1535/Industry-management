import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import ROSLIB from 'roslib';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashHome = () => {
  const theme = useTheme();
  const [connected, setConnected] = useState(false);
  const [ros, setRos] = useState(null);
  const [gasMessages, setGasMessages] = useState(0);
  const [tempMessages, setTempMessages] = useState(0);

  useEffect(() => {
    const initConnection = () => {
      const rosInstance = new ROSLIB.Ros({ url: 'ws://localhost:9090' });

      rosInstance.on('connection', () => {
        console.log('Connection established!');
        setConnected(true);
        setRos(rosInstance);
        subscribeToTopics(rosInstance);
      });

      rosInstance.on('close', () => {
        console.log('Connection is closed!');
        setConnected(false);
        setTimeout(() => {
          try {
            rosInstance.connect('ws://localhost:9090');
          } catch (error) {
            console.log('Connection problem');
          }
        }, 50000);
      });
    };

    const subscribeToTopics = (rosInstance) => {
      const gasListener = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/gas',
        messageType: 'std_msgs/Float32',
      });

      const tempListener = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/temp',
        messageType: 'std_msgs/Float32',
      });

      gasListener.subscribe((message) => {
        setGasMessages(message.data);
      });

      tempListener.subscribe((message) => {
        setTempMessages(message.data);
      });
    };

    initConnection();

    return () => {
      if (ros) {
        ros.close();
      }
    };
  }, []);

  const barChartData = {
    labels: ['Morning', 'Afternoon', 'Evening'],
    datasets: [
      {
        label: 'Workforce',
        data: [5, 12, 8],
        backgroundColor: [
          theme.palette.primary.light,
          theme.palette.secondary.light,
          theme.palette.success.light,
        ],
      },
    ],
  };

  const pieChartData = {
    labels: ['Active', 'Rest', 'Not Working'],
    datasets: [
      {
        data: [9, 3, 5],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.error.main,
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Workforce Distribution',
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Workers',
        },
      },
    },
  };

  const StatCard = ({ title, value, color }) => (
    <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ color, fontWeight: 'bold' }}>
        {value}
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ flexGrow: 1, px: 1,py:0, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        Company Dashboard
      </Typography>

      <Grid container  spacing={4} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3} sx={{height:'6rem'}}>
          <StatCard title="Workers" value="1,000" color={theme.palette.primary.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{height:'6rem'}}>
          <StatCard title="Machines" value="1,000" color={theme.palette.secondary.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{height:'6rem'}}>
          <StatCard
            title="Machine Health"
            value={`${Math.round(100 - tempMessages)}% avg. health`}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{height:'6rem'}}>
          <StatCard title="Worker Status" value="20% workforce" color={theme.palette.info.main} />
        </Grid>
      </Grid>

      <Grid container sx={{marginTop:'2rem'}} spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Workforce vs Time of the Day
            </Typography>
            <Box sx={{ height: 250 }}>
              <Bar data={barChartData} options={barChartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Worker Status
            </Typography>
            <Box sx={{ height: 250 }}>
              <Pie data={pieChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          System Status
        </Typography>
        <Typography variant="body1" color={connected ? 'success.main' : 'error.main'} fontWeight="bold">
          {connected ? 'Connected' : 'Disconnected'}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>Gas Level: {gasMessages.toFixed(2)}</Typography>
        <Typography variant="body1">Temperature: {tempMessages.toFixed(2)}°C</Typography>
      </Paper>
    </Box>
  );
};

export default DashHome;