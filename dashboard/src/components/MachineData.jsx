import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import ROSLIB from "roslib";
import { Line } from "react-chartjs-2";
import beepSound from "../assets/mixkit-siren-tone-1649.mp3";

const MachineData = () => {
  const [connected, setConnected] = useState(false);
  const [backgroundDanger, setBackgroundDanger] = useState(false);
  const [ros, setRos] = useState(null);
  const [gasMessages, setGasMessages] = useState("");
  const [tempMessages, setTempMessages] = useState("");
  const [gasValue, setGasValue] = useState("");
  const [temperatureData, setTemperatureData] = useState({
    labels: [],
    datasets: [
      {
        label: "Temperature",
        data: [],
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
    ],
  });
  const [gasChartData, setGasChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Gas Content",
        data: [],
        fill: false,
        borderColor: "rgba(255, 99, 132, 0.6)",
        tension: 0.1,
      },
    ],
  });
  const beepAudio = new Audio(beepSound);
  let beepInterval;

  useEffect(() => {
    const initConnection = () => {
      const rosInstance = new ROSLIB.Ros({
        url: "ws://localhost:9090",
      });

      rosInstance.on("connection", () => {
        console.log("Connection established!");
        setConnected(true);
        setRos(rosInstance);
        subscribeToGasTopic(rosInstance);
        subscribeToTempTopic(rosInstance);
      });

      rosInstance.on("close", () => {
        console.log("Connection is closed!");
        setConnected(false);

        // Try to reconnect every 3 seconds
        setTimeout(() => {
          try {
            rosInstance.connect("ws://localhost:9090");
          } catch (error) {
            console.log("Connection problem");
          }
        }, 1555000);
      });
    };

    const subscribeToGasTopic = (rosInstance) => {
      if (rosInstance) {
        try {
          const gasListener = new ROSLIB.Topic({
            ros: rosInstance,
            name: "/gas",
            messageType: "std_msgs/Float32",
          });

          gasListener.subscribe((message) => {
            console.log("Received message from /gas topic:", message);
            setGasMessages(message.data);

            // Update gas chart data
            setGasChartData((prevData) => {
              const newLabels = [
                ...prevData.labels,
                new Date().toLocaleTimeString(),
              ];
              const newData = [...prevData.datasets[0].data, message.data];
              return {
                labels: newLabels,
                datasets: [
                  {
                    label: "Gas Content",
                    data: newData,
                    fill: false,
                    borderColor: "rgba(255, 99, 132, 0.6)",
                    tension: 0.1,
                  },
                ],
              };
            });
          });

          console.log("Subscription to /gas topic successful.");
        } catch (error) {
          console.error("Error during subscription to /gas topic:", error);
        }
      } else {
        console.error("ROS connection not initialized.");
      }
    };

    const subscribeToTempTopic = (rosInstance) => {
      if (rosInstance) {
        try {
          const tempListener = new ROSLIB.Topic({
            ros: rosInstance,
            name: "/temp",
            messageType: "std_msgs/Float32",
          });

          tempListener.subscribe((message) => {
            console.log("Received message from /temp topic:", message);
            setTempMessages(message.data);

            // Check if temperature is more than 90 and set background color
          });

          console.log("Subscription to /temp topic successful.");
        } catch (error) {
          console.error("Error during subscription to /temp topic:", error);
        }
      } else {
        console.error("ROS connection not initialized.");
      }
    };

    initConnection();

    return () => {
      if (ros) {
        ros.close();
      }
      stopBeepSound();
    };
  }, []);

  useEffect(() => {
    if (tempMessages > 90) {
      startBeepSound();
      setBackgroundDanger(true);
    } else {
      stopBeepSound();
      setBackgroundDanger(false);
    }

    return () => {
      if (beepInterval) {
        stopBeepSound();
      }
    };
  }, [tempMessages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTemperatureData((prevData) => {
        const newLabels = [...prevData.labels, new Date().toLocaleTimeString()];
        const newData = [...prevData.datasets[0].data, tempMessages];
        return {
          labels: newLabels,
          datasets: [
            {
              label: "Temperature",
              data: newData,
              fill: false,
              borderColor: "rgba(75,192,192,1)",
              tension: 0.1,
            },
          ],
        };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [tempMessages]);

  const startBeepSound = () => {
    beepAudio.loop = true;
    beepAudio.play();
    beepInterval = setInterval(() => {
      if (tempMessages <= 90) {
        stopBeepSound();
      }
    }, 1000);
  };

  const stopBeepSound = () => {
    beepAudio.loop = false;
    beepAudio.pause();
    beepAudio.currentTime = 0;
    clearInterval(beepInterval);
  };
  const temperatureOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 200,
        ticks: {
          stepSize: 10,
        },
        title: {
          display: true,
          text: "Temperature (°C)",
        },
      },
    },
    plugins: {
      fillAbove: {
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: "start", // Start filling above the specified value
        boundary: 90, // Specify the boundary value (90 in this case)
      },
    },
  };
  return (
    <>
      <Box display={"flex"} flexDirection={"column"} height={"100%"}>
        <Typography
          fontSize={"60px"}
          color="green"
          marginX={"20px"}
          fontWeight={600}
        >
          Gas Turbines
        </Typography>
        <Box display={"flex"} gap={"30px"}>
          <Box
            borderRadius={"8px"}
            padding={"20px"}
            sx={{
              backgroundColor: tempMessages > 70 ? "#FFC0CB" : "#D9F4FF",
            }}
          >
            <Typography fontSize={"18px"} color="black" fontWeight={600}>
              {tempMessages} °C
            </Typography>
          </Box>
          <Box
            borderRadius={"8px"}
            padding={"20px"}
            sx={{
              backgroundColor: "#D9F4FF",
            }}
          >
            <Typography fontSize={"18px"} color="black" fontWeight={600}>
              Ammonia
            </Typography>
          </Box>
          <Box
            borderRadius={"8px"}
            padding={"20px"}
            sx={{
              backgroundColor: gasMessages > 70 ? "#FFC0CB" : "#D9F4FF",
            }}
          >
            <Typography fontSize={"18px"} color="black" fontWeight={600}>
              Gas content - {gasMessages}
            </Typography>
          </Box>
          <Box
            borderRadius={"8px"}
            padding={"20px"}
            sx={{
              backgroundColor: "#D9F4FF",
            }}
          >
            <Typography fontSize={"18px"} color="black" fontWeight={600}>
              {((gasMessages + tempMessages) / 130) * 100}% - Machine Health
              (curretly)
            </Typography>
          </Box>
        </Box>
        <Box>
          <Line data={temperatureData} options={temperatureOptions} />
        </Box>
        <Box>
          <Line data={gasChartData} />
        </Box>
      </Box>
    </>
  );
};

export default MachineData;
