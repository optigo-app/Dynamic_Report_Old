import { useState } from "react";
import {
  Box, Button, Card, CardMedia, Checkbox, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton, Modal,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const DeleteConfirm = ({ openDeleteDialog, setOpenDeleteDialog, deleteTarget = [], confirmDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await confirmDelete(); // must return Promise
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={openDeleteDialog}
      onClose={() => !loading && setOpenDeleteDialog(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Confirm Delete
      </DialogTitle>

      <DialogContent>
        <Typography fontSize={14} color="text.secondary">
          Are you sure you want to delete{" "}
          <b>{deleteTarget?.length}</b>{" "}
          image{deleteTarget?.length > 1 ? "s" : ""}.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setOpenDeleteDialog(false)}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="error"
          disabled={loading}
          onClick={handleDelete}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DeleteIcon />
            )
          }
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const getVerifyStatusUI = (status) => {
  switch (Number(status)) {
    case 1:
      return {
        label: "Verified",
        bg: "#f0fdf4",
        color: "#16a34a",
        bo: "1px solid #bbf7d0",
        icon: <CheckCircleOutlineIcon size='small' color='#16a34a' />
      };
    case 2:
      return {
        label: "Invalid",
        bg: "#fef2f2",
        color: "#dc2626",
        bo: "1px solid #fecaca",
        icon: <ErrorOutlineIcon size='small' color='#dc2626' />
      };
    default:
      return {
        label: "Pending",
        bg: "#fffbeb",
        color: "#d97706",
        bo: '1px solid #fef3c7',
        icon: <HourglassEmptyIcon size='small' color='#d97706' />
      };
  }
};

export const ImageCardView = ({ rows = [], selectedIds = [], onSelect, onDelete }) => {
  if (!rows.length) {
    return (
      <Box textAlign="center" py={10} color="text.secondary">
        No images uploaded yet
      </Box>
    );
  }

  return (
    <>
      {rows.map((file) => {
        const statusUI = getVerifyStatusUI(file.verifyStatus);

        return (
          <Card
            key={file.id}
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 1.2,
              position: "relative",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              height: "199px",
              "&:hover": {
                boxShadow: 2,
                transform: "translateY(-4px)",
              },
              border: selectedIds.includes(file.id) ? "2px solid #7b1fa2" : "1px solid #ddd",
            }}
          >
            <Checkbox
              size="small"
              checked={selectedIds.includes(file.id)}
              disabled={file.verifyStatus === 1}
              onChange={() => onSelect(file.id)}
              sx={{
                position: "absolute",
                top: 4,
                left: 4,
                '&.Mui-checked': { color: '#7b1fa2' },
              }}
            />

            {/* IMAGE */}
            <CardMedia
              component="img"
              image={file.thumbUrl} //file.uploadedUrl
              alt={file.originalName}
              sx={{
                width: "100%",
                height: 110,
                aspectRatio: '1/1',
                objectFit: 'cover',
                mb: 1,
                borderRadius: 1,
                cursor: "pointer",
              }}
              onClick={() =>
                window.open(file.uploadedUrl, "_blank")
              }
            />

            <Tooltip title={file.originalName} arrow>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  whiteSpace: "nowrap",
                  display: "block",
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file.originalName}
              </Typography>
            </Tooltip>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Chip
                label={statusUI.label}
                size="small"
                sx={{
                  bgcolor: statusUI.bg,
                  color: statusUI.color,
                  border: statusUI.bo,
                  fontWeight: 500,
                }}
              />

              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  disabled={file.verifyStatus === 1}
                  onClick={() => onDelete(file.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Card>
        );
      })}
    </>
  );
};

export const ImageTableView = ({ rows = [], selectedIds = [], onSelect, onSelectAll, onDelete, loding }) => {
  return (
    <TableContainer
      sx={{
        overflow: "auto",
        maxHeight: "calc(100vh - 300px)",
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              padding="checkbox"
              sx={{ bgcolor: "#f6f6ff" }}
            >
              <Checkbox
                size="small"
                checked={
                  rows.length > 0 &&
                  selectedIds.length === rows.length
                }
                indeterminate={
                  selectedIds.length > 0 &&
                  selectedIds.length < rows.length
                }
                onChange={(e) => onSelectAll(e.target.checked)}
                sx={{
                  color: '#cbd5e1',
                  '&.Mui-checked': { color: '#7b1fa2' },
                  '&.MuiCheckbox-indeterminate': { color: '#7b1fa2' }
                }}
              />
            </TableCell>
            <TableCell sx={{ color: '#6b7280', bgcolor: "#f6f6ff", fontWeight: 600 }}>SR#</TableCell>
            <TableCell sx={{ color: '#6b7280', bgcolor: "#f6f6ff", fontWeight: 600 }}>PREVIEW</TableCell>
            <TableCell sx={{ color: '#6b7280', bgcolor: "#f6f6ff", fontWeight: 600 }}>FILE NAME</TableCell>
            <TableCell sx={{ color: '#6b7280', bgcolor: "#f6f6ff", fontWeight: 600 }}>STATUS</TableCell>
            <TableCell align="center" sx={{ color: '#6b7280', bgcolor: "#f6f6ff", fontWeight: 600 }}>ACTION</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loding ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                align="center"
                sx={{
                  py: 6,
                  color: "text.secondary",
                  fontSize: 14,
                }}
              >
                No images uploded yet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((file, i) => (
              <TableRow key={i} hover sx={{ '&:hover': { bgcolor: '#fcfdff' } }}>
                <TableCell padding="checkbox">
                  {
                    file.verifyStatus !== 1 ? 
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(file.id)}
                        onChange={() => onSelect(file.id)}
                        disabled={file.verifyStatus === 1}
                        sx={{
                          color: '#cbd5e1',
                          '&.Mui-checked': { color: '#7b1fa2' },
                          '&.MuiCheckbox-indeterminate': { color: '#7b1fa2' }
                        }}
                      /> : " "
                  }
                </TableCell>
                <TableCell sx={{ width: "5%" }}>
                    {i+1}
                </TableCell>
                <TableCell>
                    <Box
                      component="img"
                      src={file?.thumbUrl}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(file?.uploadedUrl, "_blank")}
                    />
                </TableCell>
                <TableCell sx={{ width: "50%" }}>
                  {file.originalName}
                </TableCell>
                <TableCell>
                  {
                    (() => {
                      const s = getVerifyStatusUI(file.verifyStatus);
                      return (
                        <Chip
                          label={s.label}
                          icon={s.icon}
                          sx={{
                            bgcolor: s.bg,
                            color: s.color,
                            fontWeight: 500,
                            border: s.bo
                          }}
                        />
                      )
                    })()
                  }
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={"Delete Image"} arrow>
                    <IconButton
                      color="error"
                      disabled={file.verifyStatus === 1}
                      onClick={() => onDelete(file.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
};