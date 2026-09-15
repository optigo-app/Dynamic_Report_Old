'use client';
import React, { useState, useRef, useMemo, useEffect, memo } from 'react';
import {
    Box, Typography, Button, IconButton, Paper, Dialog,
    DialogContent, Stack, Avatar, Fade, CircularProgress, Divider,
    Tooltip,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    PhotoLibrary as GalleryIcon,
    Close as CloseIcon,
    Delete,
    Add,
    ArrowForward as ArrowIcon,
    DragIndicator
} from '@mui/icons-material';
import imageCompression from 'browser-image-compression';
import { FixedSizeGrid as Grid } from 'react-window';
import useUploadApis from '@/components/upload/Apis';
import _ from 'lodash';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const CONFIG = {
    CONCURRENCY: 4,
    COMPRESSION: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.75,
    }
};

const THUMB_CONFIG = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 300,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.6,
};

const PAGE_SIZE = 24;
const COLUMN_WIDTH = 210;
const ROW_HEIGHT = 194;
const GRID_HEIGHT = 600;

const Cell = memo(({ columnIndex, rowIndex, style, data }) => {
    const {
        items, columnCount, onDelete, onDragStart,
        onDragEnter, onDragEnd, onSetDefault, moduledata } = data;

    const index = rowIndex * columnCount + columnIndex;
    const file = items[index];
    if (!file) return null;
    
    const isDraggable = file.serverImg === true;

    const handlePreview = (file, moduledata) => {
        if (file.serverImg) {
            let newimg = process.env.NEXT_PUBLIC_HTTP_URL + `/${moduledata.uKey}/${moduledata.imagePath}/` + file.name + `?` + file.ImgVer
            window.open(newimg, '_blank');
        } else {
            window.open(file.preview, '_blank');
        }
    };

    return (
        <Box style={style} px={1} py={1}>
            <Paper
                draggable={isDraggable}
                onDragStart={(e) => isDraggable ? onDragStart(e, index) : e.preventDefault()}
                onDragEnter={(e) => isDraggable && onDragEnter(e, index)}
                onDragEnd={() => isDraggable && onDragEnd()}
                onDragOver={(e) => e.preventDefault()}
                sx={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: '#F8F8F5',
                    border: isDraggable ? '1px solid #EAEAEA' : '1px dashed #CBD5E0',
                    cursor: isDraggable ? 'grab' : 'default',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                        transform: isDraggable ? 'translateY(-4px)' : 'none',
                        // transform: 'translateY(-4px)',
                        // '& .drag-handle': { opacity: 1 }
                    },
                    '&:active': { cursor: isDraggable ? 'grabbing' : 'default' }
                }}
            >
                {isDraggable && (
                    <Box sx={{ position: 'absolute', top: 8, left: 8, color: 'white', opacity: 0.7, textShadow: '0 0 5px rgba(0,0,0,0.5)' }}>
                        <DragIndicator fontSize="small" />
                    </Box>
                )}

                {!file.serverImg && (
                    <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                bgcolor: '#7b1fa2',
                                color: 'white',
                                px: 1,
                                borderRadius: 1,
                                fontWeight: 'bold',
                                fontSize: '0.65rem'
                            }}
                        >
                            NEW
                        </Typography>
                    </Box>
                )}

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
                    <img
                        src={file.preview}
                        loading="lazy"
                        alt=""
                        style={{
                            width: '100%',
                            height: '80%',
                            objectFit: 'cover',
                        }}
                    />
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
                            {file?.serverImg &&
                                <Tooltip title={file.isDefault ? "Default Image" : "Set as Default"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onSetDefault && onSetDefault(file.id)}
                                        sx={{
                                            color: file.isDefault ? '#10B981' : '#CBD5E0',
                                            '&:hover': { color: '#4A5568' }
                                        }}
                                    >
                                        {file.isDefault ? <CheckCircleIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            }

                            <Tooltip title="Preview">
                                <IconButton
                                    size="small"
                                    onClick={() => handlePreview(file, moduledata)}
                                    sx={{ color: '#CBD5E0', '&:hover': { color: '#4A5568' } }}
                                >
                                    <LaunchIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            {/* {!file.isDefault && ( */}
                                <Tooltip title="Delete Image">
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete && onDelete(file.id)}
                                        sx={{ color: '#CBD5E0', '&:hover': { color: '#E53E3E' } }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            {/* )} */}
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
});

const ModernImageUpload = ({ open, onClose, headers, loginData, module, urlvalue, colorValue, type, isValid, loadingCheck, serverFilesData, onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [renameImages, setRenameImages] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadNewImg, setUploadNewImg] = useState(0);
    const [page, setPage] = useState(1);
    const [gridWidth, setGridWidth] = useState(900);

    const containerRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const fileInputRef = useRef(null);

    const {
        unlinkFiles, renameFiles, addJobImages,
        deleteJobImages, addDesignImages, deleteDesignImages
    } = useUploadApis(headers, loginData);

    useEffect(() => {
        if (!containerRef.current) return;

        const resize = () =>
            setGridWidth(containerRef.current.clientWidth);

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        setFiles(serverFilesData || []);
    }, [serverFilesData]);

    useEffect(() => {
        if (!_.isEmpty(renameImages)) {
            let data = {
                uKey: module.uKey,
                filePath: module.imagePath,
                renameArray: renameImages,
            }
            renameFiles(data);
            setRenameImages([]);
        }

    }, [renameImages])

    const handleFiles = async (input) => {
        const list = Array.from(input);
        if (!list.length) return;

        setProcessing(true);
        let done = 0;

        for (let i = 0; i < list.length; i += CONFIG.CONCURRENCY) {
            const chunk = list.slice(i, i + CONFIG.CONCURRENCY);

            const result = await Promise.all(
                chunk.map(async (file, index) => {
                    const blob = await imageCompression(file, CONFIG.COMPRESSION);

                    const imageIndex = files.length + done + 1;
                    const finalFileName =
                        colorValue
                            ? `${module?.filePrefix(urlvalue)}~${imageIndex}~${colorValue}.webp`
                            : `${module?.filePrefix(urlvalue)}~${imageIndex}.webp`
                    const webpFile = new File(
                        [blob],
                        finalFileName,
                        { type: "image/webp" }
                    );

                    done++;
                    setProcessProgress(Math.round((done / list.length) * 100));

                    return {
                        id: Date.now() + i + index,
                        name: finalFileName,
                        preview: URL.createObjectURL(webpFile),
                        file: webpFile,
                        [module.validateKey]: urlvalue,
                        imgstatus: 0,
                        serverImg: false
                    };
                })
            );

            setFiles((prev) => [...prev, ...result]);
        }

        // setUploadNewImg(uploadNewImg + list.length);
        setUploadNewImg(prev => prev + list.length);
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

    const onDragStart = (_, index) => (dragItem.current = index);
    const onDragEnter = (_, index) => (dragOverItem.current = index);

    const onDragEnd = () => {
        if (
            dragItem.current === null ||
            dragOverItem.current === null
        ) return;

        const list = [...files];

        const fromIndex = dragItem.current;
        const toIndex = dragOverItem.current;

        if (!list[fromIndex].serverImg || !list[toIndex].serverImg) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const temp = list[fromIndex];
        list[fromIndex] = list[toIndex];
        list[toIndex] = temp;

        const renameArray = [];

        const updated = list.map((item, index) => {
            if (!item.serverImg) return item;

            const newFileName =
                colorValue
                    ? `${module?.filePrefix(urlvalue)}~${index + 1}~${colorValue}.webp`
                    : `${module?.filePrefix(urlvalue)}~${index + 1}.webp`;

            if (item.name !== newFileName) {
                renameArray.push({
                    oldImageName: item.name,
                    newImageName: newFileName
                });
            }

            return {
                ...item,
                name: newFileName,
                isDefault: index === 0 ? 1 : 0,
                file: item.file
                    ? new File([item.file], newFileName, { type: "image/webp" })
                    : item.file
            };
        });

        setFiles(updated);
        setRenameImages(renameArray);

        dragItem.current = null;
        dragOverItem.current = null;
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
                if (item.serverImg) continue;

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

            thumbForm.append("uKey", module.ukey);
            thumbForm.append("folderName", module.thumbImagePath);
            thumbForm.append("isSameName", true);

            fetch(process.env.NEXT_PUBLIC_API_URL + "/api/upload", {
                method: "POST",
                body: thumbForm
            });

        } catch (err) {
            console.error("Thumbnail upload failed:", err);
        }
    };

    const simulateUpload = () => {
        const localFiles = files.filter(f => !f.serverImg);
        if (localFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            files.forEach((item) => {
                if (!item.imgstatus) {
                    data.append(
                        "fileType",
                        item.file,
                        item.name
                    );
                }
            });
            data.append("uKey", module.uKey);
            data.append("folderName", module.imagePath);
            data.append("isSameName", true);

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const api = process.env.NEXT_PUBLIC_API_URL + "/api/upload";
                xhr.open("POST", api);
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };
                xhr.onload = async () => {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success && Array.isArray(response.files)) {
                        const imgjson = response.files.map((file) => {
                            return {
                                ImageName: file.fileName,
                                Extension: file.extention,
                                [module.validateKey]: urlvalue,
                                ColorName: colorValue
                            };
                        })

                        const body = { ImageJson: JSON.stringify(imgjson) };
                        let resp = null;
                        switch (type) {
                            case 'job':
                                resp = await addJobImages(body);
                                break;
                            case 'design':
                                resp = await addDesignImages(body);
                                break;
                            default:
                                console.error("Unknown type:", module.type);
                                break;
                        }

                        generateAndUploadThumbs(files);
                        if (resp?.success) {
                            onUploadSuccess();
                        }
                    }
                    setUploadProgress(100);

                    setTimeout(() => {
                        setUploadNewImg(0);
                        setUploadProgress(0);
                        setUploading(false);
                    }, 500);

                    resolve(xhr.response);
                }

                xhr.onerror = () => {
                    onClose();
                    setUploadProgress(0);
                    setUploading(false);
                    reject();
                };

                xhr.send(data);
            });
        } catch (error) {
            console.error("Upload error:", error);
        }
    };

    const handleSetDefault = (id) => {
        const index = files.findIndex(f => f.id === id);
        if (index === -1 || index === 0 || !files[index].serverImg || !files[0].serverImg) return;

        dragItem.current = index;
        dragOverItem.current = 0;

        onDragEnd();
    };

    const handleDelete = async (id) => {

        const fileToDelete = files.find(file => file.id === id);
        if (!fileToDelete) return;

        if (!fileToDelete.serverImg) {
            URL.revokeObjectURL(fileToDelete.preview);
            setFiles(prev => prev.filter(f => f.id !== id));
            setUploadNewImg(prev => Math.max(0, prev - 1));
            return;
        }

        let resp = null;

        switch (type) {
            case 'job':
                resp = await deleteJobImages({ [module.validateKey]: urlvalue, ColorName: colorValue });
                break;
            case 'design':
                resp = await deleteDesignImages({ [module.validateKey]: urlvalue, ColorName: colorValue });
                break;
            default:
                console.error("Unknown type:", module.type);
                break;
        }

        if (!resp?.success) return;

        await unlinkFiles([fileToDelete.preview]);

        const updatedList = files.filter((file) => file.id !== id);
        const renameArray = [];
        const reSequenced = updatedList.map((item, index) => {
            if (!item.serverImg) return item;

            const oldName = item.name;
            const newName =
                colorValue
                    ? `${urlvalue}~${index + 1}~${colorValue}.webp`
                    : `${urlvalue}~${index + 1}.webp`;

            if (oldName !== newName && item.imgstatus === 1) {
                renameArray.push({
                    oldImageName: oldName,
                    newImageName: newName
                });
            }

            return {
                ...item,
                isDefault: index === 0 ?  1 : 0,
                name: newName,
                file: item.file
                    ? new File([item.file], newName, { type: "image/webp" })
                    : item.file
            };
        });
        setRenameImages(renameArray);
        setFiles(reSequenced);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
            <Box sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: '50%',
                bgcolor: 'rgba(123, 31, 162, 0.1)',
                zIndex: 0
            }} />

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
                {(!loadingCheck && !isValid) && (
                    <Fade in>
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 3000,
                                backdropFilter: "blur(10px)",
                                backgroundColor: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Typography variant="h6" fontWeight={800} color='error'>
                                Invalid {type} number!
                            </Typography>
                        </Box>
                    </Fade>
                )}

                {loadingCheck && (
                    <Fade in>
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 3000,
                                backgroundColor: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    p: 4,
                                    borderRadius: 5,
                                    textAlign: "center",
                                    minWidth: 280,
                                }}
                            >
                                <CircularProgress
                                    size={60}
                                    sx={{ color: "#7b1fa2", mb: 2 }}
                                />
                            </Box>
                        </Box>
                    </Fade>
                )}

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

                {(!loadingCheck && isValid) && <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#7b1fa2', width: 48, height: 48 }}>
                            <GalleryIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ color: '#2d3436', letterSpacing: -0.5 }}>
                                {module.title + ": " + urlvalue} {colorValue ? "( " + colorValue + " )" : ""}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {files.length} TOTAL ITEMS
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }} disabled={uploading}>
                        <CloseIcon />
                    </IconButton>
                </Box>}
                {!loadingCheck && <Box sx={{ flexGrow: 1, px: 4, position: 'relative' }}>
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
                                    // overflowX: 'hidden'
                                }}
                                onItemsRendered={onItemsRendered}
                                itemData={{
                                    items: visibleFiles,
                                    columnCount,
                                    // onDelete: (id) => setFiles((f) => f.filter((x) => x.id !== id)),
                                    onDelete: (id) => handleDelete(id),
                                    onDragStart,
                                    onDragEnter,
                                    onDragEnd,
                                    onSetDefault: handleSetDefault,
                                    moduledata: module
                                }}
                            >
                                {Cell}
                            </Grid>
                        </>
                    )}
                </Box>}
                {!loadingCheck && <>
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
                </>}
            </DialogContent>
        </Dialog>
    );
};

export default ModernImageUpload;