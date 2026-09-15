import React, { useEffect, useMemo, useState } from "react";
import {
    Box, Paper, Table, TableCell, TableContainer,
    TableHead, TableRow, Typography, CircularProgress,
    TableSortLabel, TableBody, Tooltip, Chip,
    Button, IconButton, Snackbar, Alert, Collapse
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { format } from 'date-fns';
import { Columns } from "./signage/Columns";
import { DeleteDialogBox } from "./signage/DeleteDialogBox";
import { CustomeToolbar } from "./signage/CustomToolbar";
import CustomePagenation from "./signage/CustomePagenation";
import DraggableFileTable from "./signage/DraggableFileTable";
import { Dialogbox, IsDefaultMenu, IsActiveMenu, DialogBoxDuration, PreviewFile } from "./signage/Common";
import { FileApis } from "./signage/services";
import { CallNewAPI } from "../../API/GetWorkerData/GetWorkerData";
const SP = 20;

const getVersion = () => {
    const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams") || "{}");
    return AllData?.cuver || "v4";
};

const callSignageApi = async (mode, desc, payload = {}) => {
    const body = {
        con: JSON.stringify({ id: "", mode }),
        f: desc,
        p: JSON.stringify(payload),
    };
    try {
        const response = await CallNewAPI(body, SP, getVersion());
        return { success: true, data: response, message: response?.Message };
    } catch (error) {
        console.error(`${desc} error:`, error);
        return { success: false, message: error?.response?.data?.Message || error.message || "API call failed" };
    }
};

export default function SignageDisplayUpload() {
    const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
    const showSnackbar = (msg, type = "success") => setSnackbar({ open: true, message: msg, type });
    const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

    const [initialData, setInitialData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDefaultFilter, setIsDefaultFilter] = useState('all');
    const [isActiveFilter, setIsActiveFilter] = useState('all');
    const [orientationFilter, setOrientationFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [getUkey, setGetUkey] = useState('');
    const [expandedRowId, setExpandedRowId] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [durationDialogOpen, setDurationDialogOpen] = useState(false);

    const [defaultMenuAnchorEl, setDefaultMenuAnchorEl] = useState(null);
    const isDefaultMenuOpen = Boolean(defaultMenuAnchorEl);

    const [isActiveMenuAnchorEl, setIsActiveMenuAnchorEl] = useState(null);
    const isIsActiveMenuOpen = Boolean(isActiveMenuAnchorEl);

    const columns = Columns();

    const showMessage = (msg = "Operation successful!", type = "success") =>
        showSnackbar(msg, type);

    const fetchList = async () => {
        const result = await callSignageApi("list", "Tv Content (list)", {});
        if (!result.success) {
            return { success: false, message: result.message };
        }
        const list = result.data?.Data?.rd || [];
        const data = list.map((item) => ({
            id: item.TvSetId,
            setName: item.SetName,
            orientation: item.Orientation,
            isDefault: item.IsDefault,
            isActive: item.IsActive,
            entryDate: item.EntryDate ? format(new Date(item.EntryDate), "dd MMM yyyy") : "",
            files: item.Files ? JSON.parse(item.Files) : []
        }));
        return { success: true, data };
    };

    const fetchInitialData = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await fetchList();
            if (response.success) {
                setInitialData(response.data);
            } else {
                showMessage(response.message, "error");
            }
        } catch (error) {
            console.error("fetch data error ---", error);
            showMessage("Internal Server error", "error");
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    const setUkey = async () => {
        const result = await callSignageApi("fetch_key", "Tv Content (Fetch Ukey)", {});
        if (result.success) {
            setGetUkey(result.data?.Data?.rd?.[0]?.ukey || "");
        }
    };

    useEffect(() => {
        fetchInitialData(true);
        setUkey();
    }, []);

    const saveDisplayData = async (body) => callSignageApi("create", "Tv Content (create)", body);
    const updateDisplayData = async (body) => callSignageApi("update", "Tv Content (update)", body);
    const deleteDisplayData = async (body) => callSignageApi("delete", "Tv Content (delete)", body);
    const setDefaultRow = async (body) => callSignageApi("setisdefault", "Tv Content (update is default)", body);
    const setActiveInActiveRow = async (body) => callSignageApi("setisactive", "Tv Content (update is active)", body);
    const setDisplayOrder = async (body) => callSignageApi("setdisplayorder", "Tv Content (Set display order)", body);
    const setFileDuration = async (body) => callSignageApi("update_file_duration", "Tv Content File ( Duration Update)", body);

    const deleteFileData = async (row) => {
        const result = await callSignageApi("file_delete", "Tv Content (file delete)", { FileId: row.Id });
        if (result.success && getUkey) {
            const fileService = new FileApis();
            await fileService.Remove(`${process.env.NEXT_PUBLIC_HTTP_URL + getUkey + "/TV_APPS/" + row.FileName}`);
        }
        return result;
    };

    const filteredData = useMemo(() => {
        let data = initialData.filter(item => {
            const matchesSearch = item.setName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDefault = isDefaultFilter === 'all' ||
                (isDefaultFilter === 'yes' && item.isDefault) ||
                (isDefaultFilter === 'no' && !item.isDefault);
            const matchesActive = isActiveFilter === 'all' ||
                (isActiveFilter === 'active' && item.isActive) ||
                (isActiveFilter === 'inactive' && !item.isActive);
            const matchesOrientation = orientationFilter === 'all' ||
                (orientationFilter === item.orientation);

            return matchesSearch && matchesDefault && matchesActive && matchesOrientation;
        });

        if (sortConfig.key) {
            data.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (typeof aValue === 'boolean') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return sortConfig.direction === 'asc'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }

        return data;
    }, [searchTerm, isDefaultFilter, orientationFilter, isActiveFilter, sortConfig, initialData]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * rowsPerPage;
        const lastPageIndex = firstPageIndex + rowsPerPage;
        return filteredData.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, filteredData, rowsPerPage]);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const handleToggleExpand = (id) => {
        setExpandedRowId(expandedRowId === id ? null : id);
    };

    const handleDeleteClick = (row) => {
        setDeleteDialogOpen(true);
        setSelectedRow(row);
    };

    const handelEditClick = (row) => {
        setSelectedRow(row);
        setDialogOpen(true);
    };

    const handelAddClick = () => {
        setSelectedRow(null);
        setDialogOpen(true);
    };

    const handelFilePreview = (fileRow) => {
        setPreviewDialogOpen(true);
        setSelectedFile(fileRow);
    };

    const handleDurationClick = (fileRow) => {
        setDurationDialogOpen(true);
        setSelectedFile(fileRow);
    };

    const handelDisplayOrder = async (newJson) => {
        if (!newJson) return;
        try {
            const response = await setDisplayOrder({ FileJson: JSON.stringify(newJson) });
            if (!response.success) {
                showMessage("Failed to drag a file", "error");
            }
        } catch (error) {
            console.error("error", error);
            showMessage("Internal Server error.", "error");
        }
    };

    const handelDuration = async (newDuration) => {
        if (!newDuration) {
            showMessage("Internal Server Error", "error");
            return;
        }
        try {
            const response = await setFileDuration({ FileId: newDuration.Id, Duration: newDuration.Duration });
            if (response.success) {
                fetchInitialData(false);
            }
            showMessage(response.message, response.success ? "success" : "error");
        } catch (error) {
            console.error("error", error);
            showMessage("Internal Server error.", "error");
        }
    };

    const handleDefaultClick = (event, row) => {
        setDefaultMenuAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleDefaultClose = () => {
        setDefaultMenuAnchorEl(null);
        setSelectedRow(null);
    };

    const handleIsActiveClick = (event, row) => {
        setIsActiveMenuAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleIsActiveClose = () => {
        setIsActiveMenuAnchorEl(null);
        setSelectedRow(null);
    };

    const confirmDelete = async () => {
        try {
            let response;
            if (selectedRow?.FileName) {
                response = await deleteFileData(selectedRow);
            } else {
                response = await deleteDisplayData({ TvSetId: selectedRow?.id });
            }
            if (response.success) {
                fetchInitialData(false);
            }
            showMessage(response.message, response.success ? "success" : "error");
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Delete failed:", error);
            showMessage("Internal Server error.", "error");
        }
    };

    const saveAndUpdateData = async (data, mode) => {
        const body = {
            SetName: data.name,
            Orientation: data.orientation,
            FileJson: JSON.stringify(data.files)
        };
        if (mode === "update") {
            body.TvSetId = data.id;
        }
        try {
            const response = mode === "add"
                ? await saveDisplayData(body)
                : await updateDisplayData(body);
            if (response.success) {
                fetchInitialData(false);
                showMessage(response.message, "success");
            } else {
                showMessage(response.message, "error");
            }
        } catch (error) {
            console.error("Form submission failed: ", error);
            showMessage("Internal Server error.", "error");
        }
    };

    const handleDefaultChange = async (newValue) => {
        if (!selectedRow) return;
        if (+newValue === selectedRow.isDefault) return;

        const body = {
            TvSetId: selectedRow.id,
            IsDefault: +newValue,
        };

        try {
            const response = await setDefaultRow(body);
            if (response.success) fetchInitialData(false);
            showMessage(response.message, response.success ? "success" : "error");
        } catch (error) {
            console.error("error", error);
            showMessage("Internal Server error.", "error");
        }

        handleDefaultClose();
    };

    const handelIsActiveChange = async (newValue) => {
        if (!selectedRow) return;
        if (+newValue === selectedRow.isActive) return;

        if (!newValue && selectedRow.isDefault) {
            showMessage("The default TV content set cannot be inactive.", "error");
            return;
        }

        const body = {
            TvSetId: selectedRow.id,
            IsActive: +newValue,
        };

        try {
            const response = await setActiveInActiveRow(body);
            if (response.success) {
                setInitialData(prev =>
                    prev.map(item =>
                        item.id === selectedRow.id ? { ...item, isActive: newValue } : item
                    )
                );
            }
            showMessage(response.message, response.success ? "success" : "error");
        } catch (error) {
            console.error("error", error);
            showMessage("Internal Server error.", "error");
        }
        handleIsActiveClose();
    };

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', p: 2, backgroundColor: '#f3f4f6' }}>
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: '85%',
                    height: 'calc(92vh - 92px)',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
            >
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h5" component="h2" sx={{ color: '#333', fontWeight: 'bold' }}>Signage Display</Typography>
                </Box>
                <Box sx={{ p: 3, flexWrap: 'wrap' }}>
                    <CustomeToolbar
                        params={{
                            searchTerm, setSearchTerm, isDefaultFilter, setIsDefaultFilter,
                            isActiveFilter, setIsActiveFilter, orientationFilter, setOrientationFilter,
                            setCurrentPage, setExpandedRowId: () => { }, handelAddClick
                        }}
                    />
                </Box>
                {loading ? (
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                        <CircularProgress size={40} thickness={4} />
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ flexGrow: 1 }}>
                            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="set management table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: '40px', backgroundColor: '#f9fafb' }} />
                                        {columns.map((col) => (
                                            <TableCell key={col.id} align={col.align} sx={col.style} sortDirection={sortConfig.key === col.id ? sortConfig.direction : false}>
                                                {col.sortable ? (
                                                    <TableSortLabel
                                                        active={sortConfig.key === col.id}
                                                        direction={sortConfig.key === col.id ? sortConfig.direction : 'asc'}
                                                        onClick={() => {
                                                            let direction = 'asc';
                                                            if (sortConfig.key === col.id && sortConfig.direction === 'asc') {
                                                                direction = 'desc';
                                                            }
                                                            setSortConfig({ key: col.id, direction });
                                                        }}
                                                    >
                                                        {col.label}
                                                    </TableSortLabel>
                                                ) : col.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentTableData.length > 0 ? currentTableData.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleExpand(item.id)}
                                                        disabled={item.files.length === 0}
                                                        aria-label="expand row"
                                                    >
                                                        {expandedRowId === item.id ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    onClick={() => item.files?.length ? handleToggleExpand(item.id) : null}
                                                    sx={{ cursor: item.files?.length ? 'pointer' : 'default', fontWeight: 600 }}
                                                >
                                                    {(currentPage - 1) * rowsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={item.setName} placement="bottom" arrow>
                                                        <span>{item.setName}</span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={item.orientation} placement="bottom" arrow>
                                                        <span>{item.orientation}</span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={item.entryDate} placement="bottom" arrow>
                                                        <span>{item.entryDate}</span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={item.isDefault ? 'Yes' : 'No'}
                                                        size="small"
                                                        onClick={(e) => handleDefaultClick(e, item)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            backgroundColor: item.isDefault ? '#dcfce7' : '#fee2e2',
                                                            color: item.isDefault ? '#16a34a' : '#ef4444',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={item.isActive ? "Active" : "Inactive"}
                                                        size="small"
                                                        onClick={(e) => handleIsActiveClick(e, item)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            backgroundColor: item.isActive ? '#dbeafe' : '#fef2f2',
                                                            color: item.isActive ? '#1d4ed8' : '#ef4444',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                        <IconButton size="small" onClick={() => handelEditClick(item)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteClick(item)}>
                                                            <DeleteIcon sx={{ color: 'error.main' }} />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                                                    <Collapse in={expandedRowId === item.id} timeout="auto" unmountOnExit>
                                                        <Box sx={{ margin: 2, backgroundColor: '#fdfdfd', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                                            <DraggableFileTable
                                                                initialFiles={item.files}
                                                                handleDeleteClick={handleDeleteClick}
                                                                handelPreview={handelFilePreview}
                                                                handelDisplayOrder={handelDisplayOrder}
                                                                handelDuration={handleDurationClick}
                                                            />
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                <Typography variant="h6" sx={{ mb: 1 }}>No data found.</Typography>
                                                <Button
                                                    variant="contained"
                                                    sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' }, borderRadius: '4px', textTransform: 'none', fontSize: '0.9rem', mt: 3 }}
                                                    onClick={handelAddClick}
                                                >
                                                    + Add New
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {filteredData.length > 0 && (
                            <CustomePagenation
                                currentPage={currentPage}
                                rowsPerPage={rowsPerPage}
                                filteredData={filteredData}
                                totalPages={totalPages}
                                handleRowsPerPageChange={handleRowsPerPageChange}
                                handlePageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </Paper>
            <DeleteDialogBox
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                confirmDelete={confirmDelete}
            />
            <Dialogbox
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                mode={selectedRow ? "update" : "add"}
                initialData={selectedRow}
                ukey={getUkey}
                onSave={saveAndUpdateData}
            />
            <DialogBoxDuration
                open={durationDialogOpen}
                onClose={() => setDurationDialogOpen(false)}
                initialData={selectedFile}
                onSaveDuration={handelDuration}
            />
            <PreviewFile
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                fileToPreview={selectedFile}
                uKey={getUkey}
            />
            <IsDefaultMenu
                params={{
                    defaultMenuAnchorEl,
                    isDefaultMenuOpen,
                    handleDefaultClose,
                    handleDefaultChange,
                    value: selectedRow?.isDefault
                }}
            />
            <IsActiveMenu
                params={{
                    isActiveMenuAnchorEl,
                    isIsActiveMenuOpen,
                    handleIsActiveClose,
                    handelIsActiveChange,
                    value: selectedRow?.isActive
                }}
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={closeSnackbar} severity={snackbar.type} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
