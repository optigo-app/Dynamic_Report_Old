"use client";
import { Box, Button, IconButton, TextField, MenuItem } from "@mui/material";
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { red } from '@mui/material/colors';

export function CustomeToolbar({ params }) {
    const { searchTerm, setSearchTerm, isDefaultFilter, setIsDefaultFilter, orientationFilter, setOrientationFilter,
        isActiveFilter, setIsActiveFilter, setCurrentPage, setExpandedRowId, handelAddClick } = params;

    return (
        <Box
            sx={{
                gap: 2,
                mb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >

            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                        backgroundColor: '#2563eb',
                    },
                    borderRadius: '4px',
                    textTransform: 'none',
                    fontSize: '0.9rem'
                }}
                onClick={handelAddClick}
            >
                + Add New
            </Button>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search Field */}
                <TextField
                    label="Search by Tv Set"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                        setExpandedRowId(null);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'action.active' }} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ minWidth: '200px', flexGrow: 1, maxWidth: { xs: '100%', sm: '300px' } }}
                />

                {/* Orientation Filter */}
                <TextField
                    select
                    label="Orientation"
                    value={orientationFilter}
                    onChange={(e) => {
                        setOrientationFilter(e.target.value);
                        setCurrentPage(1);
                        setExpandedRowId(null);
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="Landscape (16:9)">Landscape (16:9)</MenuItem>
                    <MenuItem value="Portrait (9:16)">Portrait (9:16)</MenuItem>
                </TextField>

                {/* Is Default Filter */}
                <TextField
                    select
                    label="Is Default"
                    value={isDefaultFilter}
                    onChange={(e) => {
                        setIsDefaultFilter(e.target.value);
                        setCurrentPage(1);
                        setExpandedRowId(null);
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                </TextField>

                {/* Is Active Filter */}
                <TextField
                    select
                    label="Is Active"
                    value={isActiveFilter}
                    onChange={(e) => {
                        setIsActiveFilter(e.target.value);
                        setCurrentPage(1);
                        setExpandedRowId(null);
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
                <IconButton
                    onClick={() => {
                        setSearchTerm('');
                        setIsDefaultFilter('all');
                        setIsActiveFilter('all');
                        setOrientationFilter('all');
                        setCurrentPage(1);
                        setExpandedRowId(null);
                    }}
                    sx={{
                        backgroundColor: red[50],
                        color: '#ef4444',
                        '&:hover': {
                            backgroundColor: red[100],
                        },
                        ml: 'auto',
                    }}
                >
                    <FilterAltOffIcon />
                </IconButton>
            </Box>
        </Box>
    );
}

export function CustomeLocationToolbar({ params }) {
    const { searchTerm, setSearchTerm, setCurrentPage, handelAddClick } = params;

    return (
        <Box
            sx={{
                gap: 2,
                mb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >

            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                        backgroundColor: '#2563eb',
                    },
                    borderRadius: '4px',
                    textTransform: 'none',
                    fontSize: '0.9rem'
                }}
                onClick={handelAddClick}
            >
                + Add New
            </Button>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search Field */}
                <TextField
                    label="Search by Location Name"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'action.active' }} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ minWidth: '200px', flexGrow: 1, maxWidth: { xs: '100%', sm: '300px' } }}
                />

                <IconButton
                    icon={<FilterAltOffIcon />}
                    tooltip="Clear Filters"
                    onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                    }}
                    sx={{
                        backgroundColor: red[50],
                        color: '#ef4444',
                        '&:hover': {
                            backgroundColor: red[100],
                        },
                        ml: 'auto',
                    }}
                />
            </Box>
        </Box>
    );
}