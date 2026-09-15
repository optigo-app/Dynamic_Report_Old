"use client";
import { useState, useEffect } from "react";
import {
    Box, Dialog, DialogActions, DialogContent, DialogTitle, List,
    ListItem, ListItemText, Menu, MenuItem, Tooltip, Typography, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import _ from "lodash";
import { Button, IconButton, TextField } from "@mui/material";
import { FileApis } from "./services";

export function Dialogbox({ open, onClose, mode = "add", initialData = null, ukey, onSave }) {
    const [newSetData, setNewSetData] = useState({ name: "", orientation: "" });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectNewFiles, setSelectedNewFiles] = useState([]);
    const [fileErrors, setFileErrors] = useState("");
    const [errors, setErrors] = useState({ name: "", files: "" });

    useEffect(() => {
        if (!open) return;

        if (mode === "update" && initialData) {
            setNewSetData({ name: initialData.setName || "", orientation: initialData.orientation || "" });
            setSelectedFiles(initialData.files || []);
            setSelectedNewFiles([]);
        } else {
            setNewSetData({ name: "", orientation: "" });
            setSelectedFiles([]);
            setSelectedNewFiles([]);
        }
        setFileErrors("");
        setErrors({ name: "", orientation: "", files: "" });
    }, [open]);

    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files);
        if (!files || files.length === 0) return;

        setFileErrors("");

        let fileValidation = files.filter(file => {
            return file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
        });

        if (!_.isEmpty(fileValidation)) {
            setFileErrors(`GIF files are not allowed!`);
            return true;
        }

        if (errors.files) setErrors((prev) => ({ ...prev, files: "" }));

        try {
            const data = new FormData();
            for (let i = 0; i < files.length; i++) {
                data.append("fileType", files[i]);
            }

            data.append("uKey", ukey);
            data.append("folderName", "TV_APPS");
            data.append("uniqueNo", Date.now());

            const fileService = new FileApis();
            const result = await fileService.Upload(data);
            if (result.success) {
                let newFileArray = [...selectedFiles, ...result.files];
                const uploadedFiles = newFileArray.map((file, index) => ({
                    FileName: file.fileName || file.FileName,
                    Url: file.url || file.Url,
                    Type: file.fileType || file.Type,
                    DisplayOrder: index + 1,
                    Duration: file?.Duration || 10
                }));
                setSelectedNewFiles(uploadedFiles);
                setSelectedFiles(uploadedFiles);
            } else {
                setFileErrors(result.message || "File upload failed.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setFileErrors("File upload failed.");
        }
    };

    const handleDeleteFile = async (file, index) => {
        if (!file) return;
        const fileService = new FileApis();
        await fileService.Remove(`${process.env.NEXT_PUBLIC_HTTP_URL + ukey + "/TV_APPS/" + file.FileName}`);
        const updated = [...selectedFiles];
        updated.splice(index, 1);
        setSelectedFiles(updated);
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { name: "", orientation: "", files: "" };

        if (!newSetData.name.trim()) {
            newErrors.name = "Set name is required!";
            valid = false;
        }

        if (!newSetData.orientation.trim()) {
            newErrors.orientation = "Orientation is required!";
            valid = false;
        }

        if (selectedFiles.length === 0) {
            newErrors.files = "Please upload at least one file!";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSave = () => {
        if (!validateForm()) return;
        const payload = {
            id: initialData?.id,
            ...newSetData,
            files: selectedFiles,
        };

        if (typeof onSave === "function") {
            onSave(payload, mode);
        }

        handleClose([]);
    };

    const handleClose = async (newFile) => {
        if (!_.isEmpty(newFile)) {
            await Promise.all(
                newFile.map(async (file) => {
                    let fileService1 = new FileApis();
                    await fileService1.Remove(`${process.env.NEXT_PUBLIC_HTTP_URL + ukey + "/TV_APPS/" + file.FileName}`);
                })
            );
        }

        setNewSetData({ name: "", orientation: "" });
        setSelectedFiles([]);
        setSelectedNewFiles([]);
        setFileErrors("");
        setErrors({ name: "", orientation: "", files: "" });
        onClose();
    };

    const renderPreview = (file) => {
        const isServerFile = `${process.env.NEXT_PUBLIC_HTTP_URL + ukey + "/TV_APPS/" + file.FileName}`;
        const fileType = isServerFile ? file.Type : file.type;

        if (fileType?.startsWith("image/") || fileType === "image/gif") {
            return (
                <img
                    src={isServerFile}
                    alt="preview"
                    style={{ maxWidth: 200, maxHeight: 200 }}
                />
            );
        } else if (fileType?.startsWith("video/")) {
            return (
                <video
                    autoPlay
                    controls
                    src={isServerFile}
                    style={{ maxWidth: 200, maxHeight: 200 }}
                />
            );
        } else {
            return "No preview available";
        }
    };

    return (
        <Dialog open={open} onClose={() => handleClose(selectNewFiles)} fullWidth maxWidth="sm">
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold",
                }}
            >
                {mode === "update" ? "Update TV Set" : "Add New TV Set"}

                <IconButton
                    size="small"
                    onClick={() => handleClose(selectNewFiles)}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Set Name"
                    fullWidth
                    variant="outlined"
                    value={newSetData.name}
                    onChange={(event) => {
                        setNewSetData({ ...newSetData, name: event.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{ mb: 2 }}
                />
                <TextField
                    select
                    label="Orientation"
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    value={newSetData.orientation || ""}
                    onChange={(e) => {
                        setNewSetData({ ...newSetData, orientation: e.target.value });
                        if (errors.orientation) setErrors((prev) => ({ ...prev, orientation: "" }));
                    }}
                    error={!!errors.orientation}
                    helperText={errors.orientation}
                    sx={{ mb: 2 }}
                >
                    <MenuItem value="Landscape (16:9)">Landscape (16:9)</MenuItem>
                    <MenuItem value="Portrait (9:16)">Portrait (9:16)</MenuItem>
                </TextField>
                {newSetData.orientation && (
                    <Typography
                        variant="caption"
                        sx={{ ml: 0.5, mb: 2, color: "text.secondary", display: "block" }}
                    >
                        {{
                            "Landscape (16:9)": "1920x1080 (Landscape)",
                            "Portrait (9:16)": "1080x1920 (Portrait)",
                        }[newSetData.orientation]}
                    </Typography>
                )}

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "medium" }}>
                    Upload Files
                </Typography>

                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 1, textTransform: "none" }}
                >
                    Choose Files
                    <input
                        type="file"
                        multiple
                        hidden
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                    />
                </Button>

                {(errors.files || fileErrors) && (
                    <Box sx={{ color: "error.main", mb: 2 }}>
                        <Typography variant="body2">
                            {errors.files || fileErrors}
                        </Typography>
                    </Box>
                )}

                {selectedFiles.length > 0 && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            backgroundColor: "#fafafa",
                            maxHeight: 200,
                            overflowY: "auto",
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                            Selected Files:
                        </Typography>
                        <List dense>
                            {selectedFiles.map((file, index) => {
                                const isServerFile = `${process.env.NEXT_PUBLIC_HTTP_URL + ukey + "/TV_APPS/" + file.FileName}`;
                                const fileName = isServerFile ? file.FileName : file.name;
                                const fileSize = isServerFile
                                    ? `${file.Type}`
                                    : `${(file.size / 1024).toFixed(2)} KB`;

                                return (
                                    <ListItem
                                        key={index}
                                        disableGutters
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleDeleteFile(file, index)}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Tooltip title={renderPreview(file)} placement="top" arrow>
                                                    <Box sx={{ cursor: "pointer", color: "primary.main" }}>{fileName}</Box>
                                                </Tooltip>
                                            }
                                            secondary={fileSize}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
                <Button
                    onClick={() => handleClose(selectNewFiles)}
                    variant="outlined"
                    sx={{
                        borderColor: "#e0e0e0",
                        color: "#616161",
                        "&:hover": {
                            borderColor: "#bdbdbd",
                            backgroundColor: "#f5f5f5",
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    sx={{
                        backgroundColor: "#3b82f6",
                        "&:hover": {
                            backgroundColor: "#2563eb",
                        }
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function DialogBoxDuration({ open, onClose, initialData = null, onSaveDuration }) {
    const [newSetData, setNewSetData] = useState({ Duration: "" });
    const [errors, setErrors] = useState({ Duration: "" });

    useEffect(() => {
        if (!open) return;
        setNewSetData({ Duration: initialData?.Duration || "" });
        setErrors({ Duration: "" });
    }, [open]);

    const validateForm = () => {
        let valid = true;
        const newErrors = { Duration: "" };

        if (!newSetData.Duration || isNaN(Number(newSetData.Duration))) {
            newErrors.Duration = "Duration is required!";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handelSubmit = async () => {
        if (!validateForm()) return;
        const payload = {
            Id: initialData?.Id,
            ...newSetData,
        };
        onSaveDuration(payload)
        setNewSetData({ Duration: "" });
        setErrors({ Duration: "" });
        onClose();
    }
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold",
                }}
            >
                Update File Duration
                <IconButton
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Duration (Seconds)"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={newSetData.Duration}
                    onChange={(event) => {
                        setNewSetData({ ...newSetData, Duration: event.target.value });
                        if (errors.Duration) setErrors((prev) => ({ ...prev, Duration: "" }));
                    }}
                    error={!!errors.Duration}
                    helperText={errors.Duration}
                    sx={{ mb: 2 }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderColor: "#e0e0e0",
                        color: "#616161",
                        "&:hover": {
                            borderColor: "#bdbdbd",
                            backgroundColor: "#f5f5f5",
                        },
                        px: 3,
                        py: 1,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handelSubmit}
                    variant="contained"
                    color="primary"
                    sx={{
                        backgroundColor: "#3b82f6",
                        "&:hover": {
                            backgroundColor: "#2563eb",
                        },
                        px: 3,
                        py: 1,
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function PreviewFile({ open, onClose, fileToPreview, uKey }) {
    const [mediaLoading, setMediaLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setMediaLoading(true);
        }
    }, [open, fileToPreview]);

    const renderPreview = () => {
        if (!fileToPreview || !fileToPreview.FileName) {
            return (
                <Typography color="text.secondary">
                    No preview available for this file type or missing URL.
                </Typography>
            );
        }

        if (fileToPreview.Type?.startsWith("image/")) {
            return (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "200px",
                        position: "relative",
                    }}
                >
                    {mediaLoading && <CircularProgress sx={{ position: "absolute" }} />}
                    <img
                        src={`${process.env.NEXT_PUBLIC_HTTP_URL + uKey + "/TV_APPS/" + fileToPreview.FileName}`}
                        alt={fileToPreview.FileName}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "60vh",
                            objectFit: "contain",
                            borderRadius: "8px",
                            display: mediaLoading ? "none" : "block",
                        }}
                        onLoad={() => setMediaLoading(false)}
                        onError={() => {
                            setMediaLoading(false);
                            // alert("Failed to load image.");
                        }}
                    />
                </Box>
            );
        } else if (fileToPreview.Type?.startsWith("video/")) {
            return (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "200px",
                        position: "relative",
                    }}
                >
                    {mediaLoading && <CircularProgress sx={{ position: "absolute" }} />}
                    <video
                        autoPlay
                        controls
                        src={`${process.env.NEXT_PUBLIC_HTTP_URL + uKey + "/TV_APPS/" + fileToPreview.FileName}`}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "60vh",
                            borderRadius: "8px",
                            display: mediaLoading ? "none" : "block",
                        }}
                        onLoadedData={() => setMediaLoading(false)}
                        onError={() => {
                            setMediaLoading(false);
                            // alert("Failed to load video.");
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                </Box>
            );
        } else {
            return (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "200px",
                        gap: 2,
                    }}
                >
                    <FolderOpenIcon sx={{ fontSize: 60, color: "text.secondary" }} />
                    <Typography color="text.secondary">
                        No direct preview for this file type ({fileToPreview.Type}).
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {fileToPreview.fileName}
                    </Typography>
                </Box>
            );
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold",
                }}
            >
                {fileToPreview?.FileName
                    ? `Preview: ${fileToPreview.FileName}`
                    : "File Preview"}
                <IconButton
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "300px",
                }}
            >
                {renderPreview()}
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: "flex-end" }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                    sx={{
                        backgroundColor: "#3b82f6",
                        "&:hover": {
                            backgroundColor: "#2563eb",
                        },
                        px: 3,
                        py: 1,
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function IsDefaultMenu({ params }) {
    const { defaultMenuAnchorEl, isDefaultMenuOpen, handleDefaultClose, handleDefaultChange, value = true } = params;
    return (
        <Menu
            anchorEl={defaultMenuAnchorEl}
            open={isDefaultMenuOpen}
            onClose={handleDefaultClose}
            disableAutoFocusItem
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <Box sx={{ p: 0.5 }}>
                <MenuItem
                    sx={{
                        borderRadius: 2,
                        ...(value && {
                            color: "primary.main",
                            fontWeight: "bold",
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(25, 118, 210, 0.15)",
                            },
                        }),
                    }}
                    onClick={() => handleDefaultChange(true)}
                >
                    Yes
                </MenuItem>
                <MenuItem
                    sx={{
                        borderRadius: 2,
                        ...(!value && {
                            color: "primary.main",
                            fontWeight: "bold",
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(25, 118, 210, 0.15)",
                            },
                        }),
                    }}
                    onClick={() => handleDefaultChange(false)}
                >
                    No
                </MenuItem>
            </Box>
        </Menu>
    )
}

export function IsActiveMenu({ params }) {

    const { isActiveMenuAnchorEl, isIsActiveMenuOpen, handleIsActiveClose, handelIsActiveChange, value = true } = params;
    return (
        <Menu
            anchorEl={isActiveMenuAnchorEl}
            open={isIsActiveMenuOpen}
            onClose={handleIsActiveClose}
            disableAutoFocusItem
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <Box sx={{ p: 0.5 }}>
                <MenuItem
                    sx={{
                        borderRadius: 2,
                        ...(value && {
                            color: "primary.main",
                            fontWeight: "bold",
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(25, 118, 210, 0.15)",
                            },
                        }),
                    }}
                    onClick={() => handelIsActiveChange(true)}
                >
                    Active
                </MenuItem>
                <MenuItem
                    sx={{
                        borderRadius: 2,
                        ...(!value && {
                            color: "primary.main",
                            fontWeight: "bold",
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(25, 118, 210, 0.15)",
                            },
                        }),
                    }}
                    onClick={() => handelIsActiveChange(false)}
                >
                    Inactive
                </MenuItem>
            </Box>
        </Menu>
    )
}

export function DialogboxLocation({ open, onClose, mode = "add", initialData = null, onSave }) {
    const [newSetData, setNewSetData] = useState({ name: '' });
    const [errors, setErrors] = useState({ name: '' });

    useEffect(() => {
        if (mode === 'update' && initialData) {
            setNewSetData({
                name: initialData.title || '',
            });
        } else {
            setNewSetData({ name: '' });
        }
        setErrors({ name: '' });
    }, [open, mode, initialData]);

    const handleSave = () => {
        let hasError = false;
        const newErrors = { name: '' };

        if (!newSetData.name.trim()) {
            newErrors.name = 'Title is required';
            hasError = true;
        }

        setErrors(newErrors);

        if (!hasError) {
            onSave(newSetData, mode);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold",
                }}
            >
                {mode === "update" ? "Update Signage Location" : "Add New Signage Location"}
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Title"
                    fullWidth
                    variant="outlined"
                    value={newSetData.name}
                    onChange={(event) => {
                        setNewSetData({ ...newSetData, name: event.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{ mb: 3 }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderColor: "#e0e0e0",
                        color: "#616161",
                        "&:hover": {
                            borderColor: "#bdbdbd",
                            backgroundColor: "#f5f5f5",
                        },
                        px: 3,
                        py: 1,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    sx={{
                        backgroundColor: "#3b82f6",
                        "&:hover": {
                            backgroundColor: "#2563eb",
                        },
                        px: 3,
                        py: 1,
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}