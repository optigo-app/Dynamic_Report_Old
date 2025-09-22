import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useDeviceStatus } from "../../DeviceStatusContext";
import { getSocketConfig } from "./config";

const MyComponent = () => {
  const { deviceStatus } = useDeviceStatus();
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false); // track config availability

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
    if (deviceStatus?.type) {
      handleBtnClick(deviceStatus.type);
    }
  }, [deviceStatus]);

  const handleBtnClick = (signal) => {
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


// import React, { useEffect, useRef } from "react";
// import io from "socket.io-client";
// import config from "./config";
// import { useDeviceStatus } from "../../DeviceStatusContext";

// const MyComponent = () => {
//   const { deviceStatus } = useDeviceStatus();
//   const socketRef = useRef(null); // persistent socket reference

//   // Emit signal when deviceStatus changes
//   useEffect(() => {
//     if (deviceStatus?.type) {
//       handleBtnClick(deviceStatus.type);
//     }
//   }, [deviceStatus]);

//   // Setup socket connection
//   useEffect(() => {
//     const { address, SoPath, di } = config;
//     const details = {
//       path: SoPath,
//       transports: ["websocket"],
//     };

//     try {
//       const socket = io.connect(address, details);
//       socketRef.current = socket; // save to ref

//       socket.on("connect", () => {
//         console.log("Socket connected");
//         socket.emit("joinRoom", di);
//       });

//       socket.on("disconnect", () => {
//         console.log("Socket disconnected");
//       });

//       socket.on("connect_error", (error) => {
//         console.error("Connection Error:", error);
//       });

//       socket.on("connectToRoom", (data) => {
//         console.log("Connected to room:", data);
//       });

//       socket.on("ReceiveSignal", (data) => {
//         try {
//           if (data && data.tvar) {
//             comboRebind(data.tvar, data.tparam);
//           }
//         } catch (error) {
//           console.error("Error handling ReceiveSignal:", error);
//         }
//       });
//     } catch (error) {
//       console.error("Socket connection error:", error);
//     }

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//     };
//   }, []);

//   // Emit signal to server
//   const handleBtnClick = (signal) => {
//     console.log("signalsignal", signal);
//     const socket = socketRef.current;
//     if (socket && socket.connected) {
//       const data = { roomno: config.di, tmode: "SendSignal", tvar: signal , deviceId: deviceStatus?.uniqueId};
//       socket.emit("SendSignal", data);
//     } else {
//       console.error("Socket is not connected.");
//     }
//   };

//   // Handle incoming signals
//   const comboRebind = (_tvar, _tparam) => {
//     try {
//       switch (_tvar.toLowerCase().trim()) {
//         case "reacttest":
//           alert("This is testing for socket");
//           break;
//         case "devicedisabled":
//           console.log('devicedisabled call');
//           // alert("This is testing for deviceDisabled");
//           break;
//         case "deviceenabled":
//           console.log('deviceenabled call');
//           // alert("This is testing for deviceenabled");
//           break;
//         case "forcelogout":
//           console.log('forcelogout call');
//           // alert("This is testing for forcelogout");
//           break;
//         case "accountdeleted":
//           console.log('accountdeleted call');
//           // alert("This is testing for accountdeleted");
//         case "customerbindchanged":
//           console.log('customerbindchanged call');
//           // alert("This is testing for customerbindchanged");
//           break;
//         case "metal":
//           alert("Metal change happened");
//           break;
//         default:
//           break;
//       }
//     } catch (error) {
//       console.error("Error in comboRebind:", error);
//     }
//   };

//   return (
//     <div>
//       {/* <button onClick={() => handleBtnClick("deviceDisabled")}>
//         Socket Event
//       </button> */}
//     </div>
//   );
// };

// export default MyComponent;













// import React, { useEffect } from "react";
// import io from "socket.io-client";
// import config from "./config";
// import { useDeviceStatus } from "../../DeviceStatusContext";

// const MyComponent = () => {
//   const { deviceStatus } = useDeviceStatus();
//   let socket;

//   useEffect(() => {
//     if (deviceStatus) {
//       handleBtnClick(deviceStatus);
//     }
//   }, [deviceStatus]);

//   useEffect(() => {
//     const { address, SoPath, di } = config;
//     const details = {
//       path: SoPath,
//       transports: ["websocket"],
//     };

//     try {
//       socket = io.connect(address, details);

//       socket.on("connect", () => {
//         console.log("Socket connected");
//         socket.emit("joinRoom", di);
//       });

//       socket.on("disconnect", () => {
//         console.log("Socket disconnected");
//       });

//       socket.on("connect_error", (error) => {
//         console.error("Connection Error:", error);
//       });

//       socket.on("connectToRoom", (data) => {
//         console.log("Connected to room:", data);
//       });

//       socket.on("ReceiveSignal", (data) => {
//         try {
//           if (data && data.tvar) {
//             comboRebind(data.tvar, data.tparam);
//           }
//         } catch (error) {
//           console.error("Error handling ReceiveSignal:", error);
//         }
//       });
//     } catch (error) {
//       console.error("Socket connection error:", error);
//     }

//     return () => {
//       if (socket) {
//         socket.disconnect();
//       }
//     };
//   }, []);

//   const handleBtnClick = (signal) => {
//     console.log("signalsignal", signal);
//     if (socket) {
//       const data = { roomno: config.di, tmode: "SendSignal", tvar: signal };
//       socket.emit("SendSignal", data);
//     } else {
//       console.error("Socket is not connected.");
//     }
//   };

//   const comboRebind = (_tvar, _tparam) => {
//     try {
//       switch (_tvar.toLowerCase().trim()) {
//         case "reacttest":
//           if (typeof stockNotification === "function") {
//             // stockNotification();
//           }
//           alert("This is testing for socket");
//           break;
//         case "devicedisabled":
//           if (typeof stockNotification === "function") {
//             // stockNotification();
//           }
//           alert("This is testing for deviceDisabled");
//           break;
//         case "deviceenabled":
//           if (typeof stockNotification === "function") {
//             // stockNotification();
//           }
//           alert("This is testing for deviceenabled");
//           break;

//         case "metal":
//           if (typeof _ComboListArray_Metal === "function") {
//             // _ComboListArray_Metal();
//           }
//           alert("Metal change happened");
//           break;
//         default:
//           break;
//       }
//     } catch (error) {
//       console.error("Error in comboRebind:", error);
//     }
//   };

//   return (
//     <div>
//       <button onClick={() => handleBtnClick('deviceDisabled')}>Socket Event</button>
//     </div>
//   );
// };

// export default MyComponent;
