import React, { useEffect } from "react";
import "./NotificationToast.scss";

const NotificationToast = ({
  message,
  bgColor = "#323232",
  fontColor = "#fff",
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const animationStyle = {
    animation: `slideDown 0.4s ease-out forwards, slideUp 0.4s ease-in ${duration - 400}ms forwards`,
  };

  return (
    <div
      className="notification-toast"
      style={{
        backgroundColor: bgColor,
        color: fontColor,
        width: '20%',
        ...animationStyle,
      }}
    >
      {message}
    </div>
  );
};

export default NotificationToast;
