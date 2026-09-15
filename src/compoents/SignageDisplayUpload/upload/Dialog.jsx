'use client';
import React, { useState, useRef, useMemo, useEffect, memo } from 'react';
import {
    Box, Typography, Button, IconButton, Paper, Dialog,
    DialogContent, Stack, Avatar, Fade, CircularProgress, Divider,
    Tooltip,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    PhotoLibrary as GalleryIcon,
    Close as CloseIcon,
    Delete,
    Add,
    ArrowForward as ArrowIcon,
    Launch as LaunchIcon,
    DeleteOutline as DeleteOutlineIcon
} from '@mui/icons-material';
import imageCompression from 'browser-image-compression';
import { FixedSizeGrid as Grid } from 'react-window';
import useUploadApis from '@/components/upload/Apis';
import _ from 'lodash';
import { useSnackbar } from '@/context/Snackbar';

const CONFIG = {
    CONCURRENCY: 4,
    COMPRESSION: {
        maxSizeMB: 1,
        // maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.75,
    }
};

const THUMB_CONFIG = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.6,
};

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/ogg"
];

const PAGE_SIZE = 24;
const COLUMN_WIDTH = 210;
const ROW_HEIGHT = 194;
const GRID_HEIGHT = 600;
const BATCH_SIZE = 10;

const Cell = memo(({ columnIndex, rowIndex, style, data }) => {
    const { items, columnCount, onDelete, onToggleSelect, processing } = data;
    const index = rowIndex * columnCount + columnIndex;
    const file = items[index];
    if (!file) return null;

    const handlePreview = (file) => {
        window.open(file.preview, '_blank');
    };

    return (
        <Box style={style} px={1} py={1}>
            <Paper
                sx={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: '#F8F8F5',
                    border: file.selected
                        ? '2px solid #7b1fa2'
                        : '1px solid #EAEAEA',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    // '&:hover': {
                    //     boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                    //     transform: 'translateY(-4px)',
                    //     '& .drag-handle': { opacity: 1 }
                    // },
                    // '&:active': { cursor: 'grabbing' }
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: 180,
                        bgcolor: '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {file.type === "image" ? (
                        <img
                            src={file.preview}
                            loading="lazy"
                            alt=""
                            onError={(e) => {
                                console.error("Image load failed:", file.name);
                                e.target.src = "/no-image.jpg";
                            }}
                            style={{
                                width: '100%',
                                height: '80%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <video
                            src={file.preview}
                            controls
                            style={{
                                width: '100%',
                                height: 160,
                                objectFit: 'cover'
                            }}
                        />
                    )}

                    <Box sx={{ position: 'absolute', top: 5, left: 5, zIndex: 5 }}>
                        <Checkbox
                            checked={file.selected || false}
                            disabled={processing}
                            onChange={() => onToggleSelect(file.id)}
                            size="small"
                            sx={{
                                p: 0,
                                borderRadius: '6px',
                                '&.Mui-checked': {
                                    color: '#7b1fa2',
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Tooltip title={file.name || ""} arrow>
                            <Typography
                                variant="subtitle2"
                                noWrap
                                sx={{
                                    maxWidth: '50%',
                                    overflow: 'hidden',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    margin: "4px 0 0 2px",
                                    color: '#4A5568',
                                    fontWeight: 500,
                                    fontSize: '0.80rem',
                                    letterSpacing: '0.01em',
                                    cursor: 'pointer'
                                }}
                            >
                                {file.name.replace(".webp", "") || 'Untitled'}
                            </Typography>
                        </Tooltip>
                        <Box>
                            <Tooltip title="Preview">
                                <IconButton
                                    size="small"
                                    onClick={() => handlePreview(file)}
                                    sx={{ color: '#CBD5E0', '&:hover': { color: '#4A5568' } }}
                                >
                                    <LaunchIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Image">
                                <IconButton
                                    size="small"
                                    onClick={() => onDelete && onDelete(file.id)}
                                    sx={{ color: '#CBD5E0', '&:hover': { color: '#E53E3E' } }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
});

const BulkImageUpload = ({ open, onClose, config, ukeyData, headers, loginData }) => {
    const [files, setFiles] = useState([]);
    console.log("files >>>>", files)
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadNewImg, setUploadNewImg] = useState(0);
    const [page, setPage] = useState(1);
    const [gridWidth, setGridWidth] = useState(900);

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    const selectedCount = useMemo(() => files.filter(img => img.selected).length, [files]);
    const allSelected = files.length > 0 && selectedCount === files.length;
    const isIndeterminate = selectedCount > 0 && selectedCount < files.length;

    const { showSnackbar } = useSnackbar();
    const showMessage = (msg = "Operation successful!", type = "success") =>
        showSnackbar(msg, type);

    useEffect(() => {
        if (!containerRef.current) return;

        const resize = () =>
            setGridWidth(containerRef.current.clientWidth);

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const handleToggleSelect = (id) => {
        setFiles((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, selected: !item.selected }
                    : item
            )
        );
    };

    const handleToggleSelectAll = () => {
        setFiles((prev) =>
            prev.map((img) => ({
                ...img,
                selected: !allSelected
            }))
        );
    };

    const handleDeleteSelected = () => {
        const remaining = files.filter((img) => !img.selected);
        const deletedCount = files.length - remaining.length;

        setFiles(remaining);
        setUploadNewImg((prev) => Math.max(0, prev - deletedCount));
    };

    const onClickClose = (isUploaded = false) => {
        setUploadNewImg(0);
        setUploadProgress(0);
        setUploading(false);
        setFiles([]);
        onClose(Boolean(isUploaded))
    }

    const { addImages } = useUploadApis(headers, loginData);

    const compressImage = async (file) => {
        try {
            const blob = await imageCompression(file, {
                ...CONFIG.COMPRESSION,
                maxSizeMB: 1,
            });

            const safeName = file.name.replace(/#/g, "~");
            const baseName = safeName.replace(/\.[^/.]+$/, "");

            const compressedFile = new File(
                [blob],
                baseName + ".webp",
                { type: "image/webp" }
            );

            return {
                file: compressedFile,
                preview: URL.createObjectURL(compressedFile),
                name: compressedFile.name
            };

        } catch (err) {
            console.warn("Compression failed, fallback:", file.name);
            return null;
        }
    };

    const processBulkFiles = async (list) => {
        let done = 0;

        const results = [];
        let retryQueue = [];

        for (let i = 0; i < list.length; i += CONFIG.CONCURRENCY) {
            const chunk = list.slice(i, i + CONFIG.CONCURRENCY);

            const processed = await Promise.all(
                chunk.map(async (file, index) => {
                    const isImage = file.type.startsWith("image/");
                    const isVideo = file.type.startsWith("video/");

                    let result = null;

                    if (isImage) {
                        result = await compressImage(file);

                        if (!result) {
                            retryQueue.push(file);
                            return null;
                        }

                    } else if (isVideo) {
                        result = {
                            file,
                            preview: URL.createObjectURL(file),
                            name: file.name
                        };
                    }

                    done++;
                    setProcessProgress(Math.round((done / list.length) * 100));

                    return {
                        id: Date.now() + i + index,
                        name: result.name,
                        preview: result.preview,
                        file: result.file,
                        type: isImage ? "image" : "video",
                        imgstatus: 0,
                        selected: false
                    };
                })
            );

            const valid = processed.filter(Boolean);
            results.push(...valid);
            setFiles((prev) => [...prev, ...valid]);
        }

        if (retryQueue.length > 0) {
            const RETRY_CONCURRENCY = 2;
            const LIGHT_COMPRESSION = {
                ...CONFIG.COMPRESSION,
                maxSizeMB: 1.5,
                initialQuality: 0.6
            };

            for (let i = 0; i < retryQueue.length; i += RETRY_CONCURRENCY) {
                const chunk = retryQueue.slice(i, i + RETRY_CONCURRENCY);

                const retryProcessed = await Promise.all(
                    chunk.map(async (file, index) => {
                        try {
                            const blob = await imageCompression(file, LIGHT_COMPRESSION);

                            const safeName = file.name.replace(/#/g, "~");
                            const baseName = safeName.replace(/\.[^/.]+$/, "");

                            const compressedFile = new File(
                                [blob],
                                baseName + ".webp",
                                { type: "image/webp" }
                            );

                            return {
                                id: Date.now() + i + index + 9999,
                                name: compressedFile.name,
                                preview: URL.createObjectURL(compressedFile),
                                file: compressedFile,
                                type: "image",
                                imgstatus: 0,
                                selected: false
                            };

                        } catch (err) {
                            console.warn(`Skipped after retry: (${index + 1})`, file.name);
                            return null;
                        }
                    })
                );

                const validRetry = retryProcessed.filter(Boolean);

                if (validRetry.length > 0) {
                    results.push(...validRetry);
                    setFiles((prev) => [...prev, ...validRetry]);
                }

                await new Promise(res => setTimeout(res, 0));
            }
        }

        return results;
    };

    const handleFiles = async (input) => {
        const list = Array.from(input);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (!list.length) return;

        const invalidFiles = list.filter(file =>
            !ALLOWED_TYPES.includes(file.type)
        );

        if (invalidFiles.length > 0) {
            showMessage(
                `${invalidFiles.length} file(s) not supported.`,
                "error"
            );
            // setProcessing(false);
            // setProcessProgress(0);
            // setUploadNewImg(prev => prev);
            // setFiles(prev => prev);
            return;
        }
        setProcessing(true);
        const processedFiles = await processBulkFiles(list);

        setUploadNewImg(prev => prev + processedFiles.length);
        setProcessing(false);
        setProcessProgress(0);
    };

    const visibleFiles = useMemo(
        () => files.slice(0, page * PAGE_SIZE),
        [files, page]
    );

    const columnCount = Math.max(1, Math.floor(gridWidth / COLUMN_WIDTH));

    const rowCount = Math.ceil(visibleFiles.length / columnCount);

    const onItemsRendered = ({ visibleRowStopIndex }) => {
        if (visibleRowStopIndex >= rowCount - 2) {
            setPage((p) => p + 1);
        }
    };

    const handleTriggerUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const generateAndUploadThumbs = async (uploadedFiles) => {
        try {
            const thumbForm = new FormData();

            for (const item of uploadedFiles) {

                const thumbBlob = await imageCompression(
                    item.file,
                    THUMB_CONFIG
                );

                const thumbFile = new File(
                    [thumbBlob],
                    item.name,
                    { type: "image/webp" }
                );

                thumbForm.append(
                    "fileType",
                    thumbFile,
                    thumbFile.name
                );
            }

            thumbForm.append("uKey", ukeyData.ukey);
            thumbForm.append("folderName", config.pendingThumbImgPath);
            thumbForm.append("isSameName", true);

            fetch(process.env.NEXT_PUBLIC_API_URL + "/api/upload", {
                method: "POST",
                body: thumbForm
            });

        } catch (err) {
            console.error("Thumbnail upload failed:", err);
        }
    };

    const simulateUpload = async () => {
        if (!files.length) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const totalBatches = Math.ceil(files.length / BATCH_SIZE);
            let completedBatches = 0;

            for (let i = 0; i < totalBatches; i++) {
                const batch = files.slice(
                    i * BATCH_SIZE,
                    (i + 1) * BATCH_SIZE
                );

                const data = new FormData();
                batch.forEach((item) => {
                    data.append(
                        "fileType",
                        item.file,
                        item.name
                    );
                });
                data.append("uKey", ukeyData.ukey);
                data.append("folderName", config.pendingImgPath);
                data.append("isSameName", true);

                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    const api = process.env.NEXT_PUBLIC_API_URL + "/api/upload";
                    xhr.open("POST", api);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const batchPercent = event.loaded / event.total;
                            const overallPercent = Math.round(
                                ((completedBatches + batchPercent) / totalBatches) * 100
                            );
                            setUploadProgress(overallPercent);
                        }
                    };

                    xhr.onload = async () => {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success && Array.isArray(response.files)) {
                            const imgjson = response.files.map((file) => ({
                                ImageName: file.fileName,
                                Extension: file.extention,
                                UploadType: config.type
                            }));
                            const body = { ImageJson: JSON.stringify(imgjson) };
                            await addImages(body);
                            await generateAndUploadThumbs(batch);
                        }

                        completedBatches++;
                        resolve();
                    }

                    xhr.onerror = reject;
                    xhr.send(data);
                })
            }

            setUploadProgress(100);
            onClickClose(true);

        } catch (error) {
            onClickClose(false);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog
            open={open}
            // onClose={() => {
            //     if (!uploading) {
            //         onClickClose(false);
            //     }
            // }}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 6,
                    height: '85vh',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    bgcolor: 'rgba(123, 31, 162, 0.1)',
                    zIndex: 0
                }}
            />

            <DialogContent
                ref={containerRef}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
                }}
                sx={{ p: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}
            >
                {dragActive && (
                    <Box sx={{
                        position: 'absolute',
                        inset: 10,
                        zIndex: 100,
                        borderRadius: 6,
                        border: '3px dashed #7b1fa2',
                        bgcolor: 'rgba(123, 31, 162, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Typography variant="h4" fontWeight={800} color="#7b1fa2">Drop to Add More</Typography>
                    </Box>
                )}

                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#7b1fa2', width: 48, height: 48 }}>
                            <GalleryIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ color: '#2d3436', letterSpacing: -0.5 }}>
                                {config.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {files.length} TOTAL ITEMS • {selectedCount} SELECTED
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={() => onClickClose(false)} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }} disabled={uploading}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        px: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 10,
                        flexShrink: 0
                    }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={allSelected}
                                indeterminate={isIndeterminate}
                                disabled={processing}
                                onChange={handleToggleSelectAll}
                                sx={{
                                    color: 'text.disabled',
                                    '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                                        color: '#7127a7'
                                    },
                                }}
                            />
                        }
                        label={<Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'text.secondary', userSelect: 'none' }}>Select All</Typography>}
                    />
                    <Button
                        startIcon={<DeleteOutlineIcon />}
                        onClick={handleDeleteSelected}
                        disabled={selectedCount === 0 || processing}
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '12px',
                            px: 2,
                            py: 1,
                            color: selectedCount > 0 ? '#d32f2f' : 'text.disabled',
                            bgcolor: selectedCount > 0 ? 'rgb(254 226 226 / 0.5)' : 'transparent'
                        }}
                    >
                        Delete
                    </Button>
                </Box>
                <Box sx={{ flexGrow: 1, px: 4, position: 'relative' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => handleFiles(e.target.files)}
                    />

                    {files.length === 0 ? (
                        <Fade in={true}>
                            <Box
                                sx={{
                                    height: 'calc(100% - 30px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed',
                                    borderColor: 'rgba(0,0,0,0.1)',
                                    borderRadius: 8,
                                }}
                            >
                                <Box sx={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    bgcolor: 'white',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3
                                }}>
                                    <CloudUploadIcon sx={{ fontSize: 50, color: '#7b1fa2' }} />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>Drop your files here</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Support JPG, PNG and WebP
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleTriggerUpload}
                                    sx={{ borderRadius: 4, px: 4, color: '#7b1fa2', borderColor: '#7b1fa2' }}
                                >
                                    Browse Files
                                </Button>
                            </Box>
                        </Fade>
                    ) : (
                        <>
                            <Grid
                                height={GRID_HEIGHT}
                                width={gridWidth}
                                columnCount={columnCount}
                                columnWidth={COLUMN_WIDTH}
                                rowCount={rowCount}
                                rowHeight={ROW_HEIGHT}
                                style={{
                                    overflowX: 'hidden'
                                }}
                                onItemsRendered={onItemsRendered}
                                itemData={{
                                    items: visibleFiles,
                                    columnCount,
                                    onDelete: (id) => {
                                        setFiles((f) => {
                                            const fileToDelete = f.find(x => x.id === id);
                                            console.log(fileToDelete);
                                            if (fileToDelete?.preview) {
                                                URL.revokeObjectURL(fileToDelete.preview);
                                            }
                                            return f.filter((x) => x.id !== id)
                                        });
                                        setUploadNewImg(prev => Math.max(0, prev - 1));
                                    },
                                    onToggleSelect: handleToggleSelect,
                                    processing
                                }}
                            >
                                {Cell}
                            </Grid>
                        </>
                    )}
                </Box>
                <Fade in={files.length > 0}>
                    <Box sx={{
                        p: 3,
                        background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <Paper sx={{
                            p: 1.5,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            bgcolor: '#1a1a1a',
                            color: 'white',
                            pointerEvents: 'auto'
                        }}>
                            {uploading ? (
                                <Box sx={{ px: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <CircularProgress size={24} variant="determinate" value={uploadProgress} sx={{ color: '#7b1fa2' }} />
                                    <Typography variant="body2" fontWeight={700}>Processing {uploadProgress}%</Typography>
                                </Box>
                            ) : (
                                processing ?
                                    <>
                                        <Box sx={{ px: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <CircularProgress size={24} variant="determinate" value={processProgress} sx={{ color: '#7b1fa2' }} />
                                            <Typography variant="body2" fontWeight={700}>Processing {processProgress}%</Typography>
                                        </Box>
                                    </>
                                    : <>
                                        <Button
                                            variant="contained"
                                            onClick={handleTriggerUpload}
                                            startIcon={<Add />}
                                            sx={{ borderRadius: 8, bgcolor: '#333', px: 3, fontWeight: 700, '&:hover': { bgcolor: '#444' } }}
                                        >
                                            Add More
                                        </Button>
                                        {uploadNewImg !== 0 && (
                                            <>
                                                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                                                <Button
                                                    onClick={simulateUpload}
                                                    variant="contained"
                                                    endIcon={<ArrowIcon />}
                                                    sx={{
                                                        borderRadius: 8,
                                                        bgcolor: '#7b1fa2',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        px: 3
                                                    }}
                                                >
                                                    Upload {uploadNewImg} Images
                                                </Button>
                                            </>
                                        )}
                                    </>
                            )}
                        </Paper>
                    </Box>
                </Fade>
            </DialogContent>
        </Dialog>
    );
};

export default BulkImageUpload;