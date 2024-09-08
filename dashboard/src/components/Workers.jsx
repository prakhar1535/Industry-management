import { Box, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import ROSLIB from "roslib";
import face from "../assets/ezgif-1-e46f89a04b.png";

const Workers = () => {
  const [connected, setConnected] = useState(false);
  const [ros, setRos] = useState(null);
  const [data, setData] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState("Not Active");
  const [activeTime, setActiveTime] = useState(0);
  const [notActiveTime, setNotActiveTime] = useState(0);

  useEffect(() => {
    const initConnection = () => {
      const rosInstance = new ROSLIB.Ros({
        url: "ws://localhost:9090",
      });

      rosInstance.on("connection", () => {
        console.log("Connection established!");
        setConnected(true);
        setRos(rosInstance);
        subscribeToDataTopic(rosInstance);
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
        }, 155554545);
      });
    };

    const subscribeToDataTopic = (rosInstance) => {
      if (rosInstance) {
        try {
          const dataListener = new ROSLIB.Topic({
            ros: rosInstance,
            name: "/data",
            messageType: "std_msgs/Int32",
          });

          dataListener.subscribe((message) => {
            console.log("Received message from /data topic:", message);
            setData(message.data);

            // Check the received value and update status accordingly
            if (message.data === 1) {
              // If 1, start the active countdown
              setCountdown(message.data);
              setStatus("Active");
            } else {
              setTimeout(() => {
                setCountdown(message.data);
                setStatus("Not Active");
              }, 2000);
            }
          });

          console.log("Subscription to /data topic successful.");
        } catch (error) {
          console.error("Error during subscription to /data topic:", error);
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
    };
  }, []);

  useEffect(() => {
    // Update the countdown timer for both "Active" and "Not Active"
    if (countdown > 0) {
      const intervalId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      // Cleanup interval on component unmount
      return () => {
        clearInterval(intervalId);

        // Update the total time based on the status
        if (status === "Active") {
          setActiveTime((prevActiveTime) => prevActiveTime + countdown);
        } else {
          setNotActiveTime(
            (prevNotActiveTime) => prevNotActiveTime + countdown
          );
        }
      };
    }
  }, [countdown, status]);

  return (
    // <div>
    //   <p>Status: {status}</p>
    //   <p>Countdown: {countdown} seconds</p>
    //   <p>Total Active Time: {activeTime} seconds</p>
    // </div>
    <Box
      display={"flex"}
      flexDirection="column"
      padding={"20px"}
      borderRadius={"8px"}
      width={"fit-content"}
      sx={{
        backgroundColor: "#D9F4FF",
      }}
    >
      <img
        src={face}
        width={"300px"}
        height={"300px"}
        alt="yes"
        style={{
          borderRadius: "8px",
        }}
      />
      <Box display={"flex"} flexDirection={"column"}>
        <Typography fontSize={"25px"} fontWeight={600}>
          Status
        </Typography>
        <Typography fontSize={"18px"} fontWeight={500}>
          {status}
        </Typography>
      </Box>
      <Box display={"flex"} flexDirection={"column"}>
        <Typography fontSize={"25px"} fontWeight={600}>
          Active Time
        </Typography>
        <Typography fontSize={"18px"} fontWeight={500}>
          {activeTime} mins
        </Typography>
      </Box>
    </Box>
  );
};

export default Workers;
