import React, { useEffect } from "react";
import "./CustomModal.css"; // We'll add CSS below

const CustomModal = ({ open, onClose, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div
        className="custom-modal-content slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default CustomModal;


{/* <CustomModal open={open} onClose={handleClose}>
    </CustomModal> */}

