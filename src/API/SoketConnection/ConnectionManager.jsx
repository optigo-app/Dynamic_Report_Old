import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useDeviceStatus } from "../../DeviceStatusContext";
import { getSocketConfig } from "./config";

const MyComponent = () => {
  const { deviceStatus, setDeviceStatus } = useDeviceStatus();
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const config = getSocketConfig();
      if (config.address && config.SoPath && config.di) {
        setSocketReady(true);
        clearInterval(interval);
      }
    }, 500); // check every 500ms

    return () => clearInterval(interval);
  }, []);

  console.log('socketReady: ', socketReady);
  useEffect(() => {
    if (!socketReady) return;
    const config = getSocketConfig();
    const { address, SoPath, di } = config;
    const socket = io.connect(address, {
      path: SoPath,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("joinRoom", di);
    });

    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("connect_error", (error) => console.error("Connection Error:", error));
    socket.on("connectToRoom", (data) => console.log("Connected to room:", data));

    socket.on("ReceiveSignal", (data) => {
      try {
        if (data?.tvar) comboRebind(data.tvar, data.tparam);
      } catch (err) {
        console.error("Error handling ReceiveSignal:", err);
      }
    });

    return () => socket.disconnect();
  }, [socketReady]);

  useEffect(() => {
    console.log('deviceStatus: ', deviceStatus);
    if (deviceStatus?.type) {
      handleBtnClick(deviceStatus.type);
    }
  }, [deviceStatus]);

  const handleBtnClick = (signal) => {
    console.log('signal: ', signal);
    const socket = socketRef.current;
    if (socket?.connected) {
      const config = getSocketConfig();
      socket.emit("SendSignal", {
        roomno: config.di,
        tmode: "SendSignal",
        tvar: signal,
        deviceId: deviceStatus?.uniqueId,
      });
    } else {
      console.error("Socket not connected.");
    }
  };

  const comboRebind = (_tvar, _tparam) => {
    const signal = _tvar?.toLowerCase()?.trim();
    console.log('signal: ', signal);
    if (signal === "contentchanged") {
      console.log('send signle....');
      setDeviceStatus({
        type: "REFRESH_SLIDER",
        timestamp: Date.now(),
      });
      return;
    }

    switch (_tvar.toLowerCase().trim()) {
      case "reacttest":
        alert("This is testing for socket");
        break;
      case "devicedisabled":
        console.log("devicedisabled call");
        break;
      case "deviceenabled":
        console.log("deviceenabled call");
        break;
      case "forcelogout":
        console.log("forcelogout call");
        break;
      case "accountdeleted":
        console.log("accountdeleted call");
        break;
      case "customerbindchanged":
        console.log("customerbindchanged call");
        break;
      case "metal":
        alert("Metal change happened");
        break;
      default:
        break;
    }
  };

  return <div></div>;
};

export default MyComponent;

