"use client";
import React from 'react';
import { Box, Typography, Pagination, TextField, MenuItem } from '@mui/material';

export default function CustomePagenation({
    currentPage,
    rowsPerPage,
    filteredData,
    totalPages,
    handleRowsPerPageChange,
    handlePageChange,
}) {
    return (
        <Box
            sx={{
                p: 2,
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#f9fafb',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="body2" color="text.secondary">
                    Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)} -{' '}
                    {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
                </Typography>
            </Box>
            <Box>
                <TextField
                    select
                    label="Rows per page"
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    variant="outlined"
                    size="small"
                    sx={{
                        width: {
                            xs: '100%',
                            sm: '160px',
                        },
                        minWidth: '120px',
                        flexShrink: 0,
                    }}
                    SelectProps={{
                        MenuProps: {
                            anchorOrigin: { vertical: 'top', horizontal: 'left' },
                            transformOrigin: { vertical: 'bottom', horizontal: 'left' },
                        }
                    }}
                >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                </TextField>
            </Box>
            <Box sx={{ minWidth: 160 }}>
                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    sx={{
                        '& .MuiPaginationItem-root': {
                            color: '#555',
                            '&.Mui-selected': {
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#2563eb',
                                },
                            },
                        },
                    }}
                />
            </Box>
        </Box>
    );
}
