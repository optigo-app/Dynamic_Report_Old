"use client";
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { IconButton } from "@mui/material";

const DraggableFileTable = ({ initialFiles = [], handleDeleteClick, handelPreview, handelDisplayOrder, handelDuration }) => {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        if (Array.isArray(initialFiles)) {
            setFiles(initialFiles);
        } else {
            console.error("initialFiles must be an array. Received:", initialFiles);
            setFiles([]);
        }
    }, [initialFiles]);

    const handleDragEnd = (result) => {
        if (!result?.destination || !result?.source) {
            console.warn("Invalid drag result:", result);
            return;
        }

        try {
            const updatedFiles = Array.from(files);
            const [moved] = updatedFiles.splice(result.source.index, 1);
            updatedFiles.splice(result.destination.index, 0, moved);
            setFiles(updatedFiles);

            // Generate the DisplayOrder JSON
            const displayOrderData = updatedFiles.map((file, index) => ({
                Id: file.Id,
                DisplayOrder: index + 1
            }));

            // Pass the display order to the handler
            handelDisplayOrder(displayOrderData);

        } catch (err) {
            console.error("Drag operation failed:", err);
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <TableContainer component={Paper}>
                <Table size="small" aria-label="draggable file table">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ width: '5%' }} />
                            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>No</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>File Name</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', width: '10%' }}>File Duration (Sec)</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>View</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>Edit</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>Delete</TableCell>
                        </TableRow>
                    </TableHead>

                    <Droppable droppableId="file-table">
                        {(provided) => (
                            <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                {files.length > 0 ? (
                                    files.map((file, index) => {
                                        const fileId = file?.id ?? `file-${index}`;
                                        const fileName = file?.FileName || 'UnKonwn';
                                        const duration = file?.Duration || 0;
                                        const filetype = file?.Type;
                                        return (
                                            <Draggable
                                                key={fileId}
                                                draggableId={String(fileId)}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <TableRow
                                                        hover
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <TableCell align="left" sx={{ width: '5%' }}>
                                                            <MoreVertIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                                        </TableCell>
                                                        <TableCell sx={{ width: '10%' }}>{index + 1}</TableCell>
                                                        <TableCell sx={{ width: '20%' }}>{fileName}</TableCell>
                                                        <TableCell align="right" sx={{ width: '10%' }}>{duration}</TableCell>
                                                        <TableCell align="center" sx={{ width: '10%' }}>
                                                            <IconButton
                                                                size="small"
                                                                sx={{ color: 'action.active', '&:hover': { color: 'primary.main' } }}
                                                                onClick={() => handelPreview(file)}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>

                                                        </TableCell>
                                                        <TableCell align="center" sx={{ width: '10%' }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handelDuration?.(file)} disabled={["video/mp4"].includes(filetype)}
                                                            >
                                                                <SaveAsIcon fontSize="small" sx={{ color: ["video/mp4"].includes(filetype) ? 'text.secondary' : 'primary.main' }} />
                                                            </IconButton>
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ width: '10%' }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteClick?.({ ...file, recodeType: "filedata" })}
                                                            >
                                                                <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Draggable>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                                            No files associated with this set.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {provided.placeholder}
                            </TableBody>
                        )}
                    </Droppable>
                </Table>
            </TableContainer>
        </DragDropContext>
    );
};

DraggableFileTable.propTypes = {
    initialFiles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        FileName: PropTypes.string,
        Url: PropTypes.string
    })),
    handleDeleteClick: PropTypes.func,
    handelPreview: PropTypes.func,
    handelDisplayOrder: PropTypes.func,
    handelDuration: PropTypes.func
};

export default DraggableFileTable;