
// StockModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const StockModal = ({ open, onClose, title, data }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.weight.toFixed(3)}</TableCell>
                <TableCell>{row.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default StockModal;
