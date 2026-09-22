// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18601

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  IconButton,
  Popover,
  CircularProgress,
  Alert,
  Tooltip,
  Checkbox,
  Pagination,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CloseIcon from '@mui/icons-material/Close';
import { DateRangePicker } from 'mui-daterange-picker';
import * as XLSX from 'xlsx';
import { GetWipData } from '../../API/GetWipData/GetWipData';
import './WIPMis.scss';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

/* ---------------------------------------------------------------- */
/* Helpers (DATA LOGIC — UNCHANGED)                                   */
/* ---------------------------------------------------------------- */

const buildFieldMap = (rd2) => {
  const map = {};
  const cols = (rd2 && rd2[0]) || {};
  Object.entries(cols).forEach(([key, fieldName]) => {
    map[fieldName] = key;
  });
  return map;
};

const getField = (row, fieldMap, fieldName) => {
  if (row == null) return undefined;
  if (row[fieldName] !== undefined && row[fieldName] !== null) return row[fieldName];
  const key = fieldMap[fieldName];
  return key !== undefined ? row[key] : undefined;
};

const sumField = (rows, fieldMap, fieldName) =>
  rows.reduce((acc, row) => {
    const v = parseFloat(getField(row, fieldMap, fieldName));
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);

// Date format used everywhere in the tables: "25 Sep 2026"
const formatDateOnly = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDatePretty = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Returns { startDate, endDate } for the CURRENT calendar month
const getThisMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of this month
  return { startDate, endDate };
};

// Remaining days = jobpromisedate - expstartdate.
// Returns a number, or null when expstartdate (or a valid promise date) is missing.
const computeRemainingDays = (row, fieldMap) => {
  const promiseRaw = getField(row, fieldMap, 'jobpromisedate');
  const entryRaw = getField(row, fieldMap, 'expstartdate');
  if (!entryRaw) return null;

  const promiseDate = promiseRaw ? new Date(promiseRaw) : null;
  const entryDate = new Date(entryRaw);
  if (!promiseDate || Number.isNaN(promiseDate.getTime()) || Number.isNaN(entryDate.getTime())) return null;

  return Math.round((promiseDate - entryDate) / (1000 * 60 * 60 * 24));
};

const naturalSort = (a, b) => {
  const re = /(\d+)|(\D+)/g;
  const ax = String(a).match(re) || [];
  const bx = String(b).match(re) || [];
  while (ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();
    const nan = parseInt(an, 10);
    const nbn = parseInt(bn, 10);
    if (!Number.isNaN(nan) && !Number.isNaN(nbn)) {
      if (nan !== nbn) return nan - nbn;
    } else if (an !== bn) {
      return an > bn ? 1 : -1;
    }
  }
  return ax.length - bx.length;
};

// Some fields (e.g. department) can come back containing raw markup
// (e.g. "Sprue Cutting-Receive<br/><span class=...>"). Strip it so the
// pivot labels stay plain text instead of leaking HTML into the cell.
const stripHtml = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// Builds a row-label x column-label pivot. In addition to the plain job
// COUNT per cell/row/column (matrix / rowTotals / colTotals / grandTotal),
// this also accumulates the sum of the "Quantity" field (API response)
// per row-label grouping (rowQtyTotals) and overall (grandQty), which is
// what feeds the mandatory "Pcs" column on every pivot table.
const buildPivot = (rows, fieldMap, rowField, colField, rowFormatter) => {
  const matrix = {};
  const rowTotals = {};
  const colTotals = {};
  const rowQtyTotals = {};
  let grandTotal = 0;
  let grandQty = 0;
  let maxCell = 0;

  // Tracks which base job numbers have already contributed to a given
  // row-label's Pcs total (per-row-group dedupe) and to the grand Pcs
  // total (dataset-wide dedupe) — so a job split across S1/S2/... sub-rows
  // only adds its Quantity ONCE instead of once per sub-row.
  const rowQtySeenJobs = {};
  const grandQtySeenJobs = new Set();

  rows.forEach((row) => {
    let rVal = getField(row, fieldMap, rowField);
    let cVal = getField(row, fieldMap, colField);

    if (rowFormatter) rVal = rowFormatter(rVal);
    rVal = stripHtml(rVal);
    cVal = stripHtml(cVal);

    if (rVal === undefined || rVal === null || rVal === '') return;
    if (cVal === undefined || cVal === null || cVal === '') return;

    matrix[rVal] = matrix[rVal] || {};
    matrix[rVal][cVal] = (matrix[rVal][cVal] || 0) + 1;
    if (matrix[rVal][cVal] > maxCell) maxCell = matrix[rVal][cVal];

    rowTotals[rVal] = (rowTotals[rVal] || 0) + 1;
    colTotals[cVal] = (colTotals[cVal] || 0) + 1;
    grandTotal += 1;

    // Pcs = sum of "Quantity" (API response field), counted once per base
    // job number. "1/13765S1" and "1/13765S2" both belong to job
    // "1/13765" — strip the trailing S<n> suffix so they collapse into one
    // contribution instead of adding Quantity twice.
    const jobNoRaw = getField(row, fieldMap, 'serialjobno');
    const baseJobNo = jobNoRaw ? String(jobNoRaw).replace(/S\d+$/i, '') : null;

    const qtyRaw = getField(row, fieldMap, 'Quantity');
    const qtyParsed = parseFloat(qtyRaw);
    const qty = Number.isFinite(qtyParsed) ? qtyParsed : 0;

    rowQtySeenJobs[rVal] = rowQtySeenJobs[rVal] || new Set();

    const alreadyCountedForRow = baseJobNo && rowQtySeenJobs[rVal].has(baseJobNo);
    const alreadyCountedOverall = baseJobNo && grandQtySeenJobs.has(baseJobNo);

    if (!alreadyCountedForRow) {
      rowQtyTotals[rVal] = (rowQtyTotals[rVal] || 0) + qty;
      if (baseJobNo) rowQtySeenJobs[rVal].add(baseJobNo);
    }

    if (!alreadyCountedOverall) {
      grandQty += qty;
      if (baseJobNo) grandQtySeenJobs.add(baseJobNo);
    }
  });

  const rowKeys = Object.keys(rowTotals).sort((a, b) => rowTotals[b] - rowTotals[a]);
  const colKeys = Object.keys(colTotals)
    .filter((c) => colTotals[c] > 0)
    .sort(naturalSort);

  return { rowKeys, colKeys, matrix, rowTotals, colTotals, rowQtyTotals, grandTotal, grandQty, maxCell };
};

// alwaysKeepFields: field names that should never be stripped even if every
// row is blank/'-'/0 for that column (e.g. a mandatory "Rem. Days" column).
const filterEmptyColumns = (columns, rows, alwaysKeepFields = []) =>
  columns.filter((col) => {
    if (col.field === 'row' || col.field === 'total' || alwaysKeepFields.includes(col.field)) return true;
    return rows.some((r) => {
      const v = r[col.field];
      if (v === undefined || v === null || v === '') return false;
      if (v === '-') return false;
      if (typeof v === 'number' && v === 0) return false;
      return true;
    });
  });

// Pull a given column key (e.g. "Pending Request") to a fixed position
// (default: right after the row-label column) regardless of where the
// natural sort of the pivot would otherwise place it.
const reorderPriorityColumn = (colKeys, priorityLabel) => {
  if (!colKeys.includes(priorityLabel)) return colKeys;
  return [priorityLabel, ...colKeys.filter((c) => c !== priorityLabel)];
};

// Formats a KPI value as "D:<value> ct" and appends " S:<value> ct" only when
// a solitaire figure is present and non-zero — never shows "S:0 ct".
const formatDiamondSolitaire = (dVal, sVal, decimals = 0, unit = '') => {
  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  const suffix = unit ? ` ${unit}` : '';
  const dStr = `D:${fmt(dVal || 0)}${suffix}`;
  if (sVal && sVal > 0) {
    return `${dStr}\u00A0\u00A0\u00A0\u00A0S:${fmt(sVal)}${suffix}`;
  }
  return dStr;
};

/* ---------------------------------------------------------------- */
/* Row filtering — extracted into a pure helper so each TAB can hold */
/* its own independent filter state and pass it through here, while  */
/* the actual filtering predicate is identical for every tab.        */
/* ---------------------------------------------------------------- */

const createEmptyFilters = () => ({
  location: [],
  customerCode: [],
  orderNo: [],
  currentStatus: [],
  metalType: [],
  deliveryStatus: 'All',
});

const applyRowFilters = (rows, fieldMap, filters, dateCtx) => {
  const { location, customerCode, orderNo, currentStatus, metalType, deliveryStatus } = filters;
  const { isAllDates, dateRange, dateField } = dateCtx;

  return rows.filter((row) => {
    const loc = getField(row, fieldMap, 'JobLocation');
    const cust = getField(row, fieldMap, 'Customercode');
    const ord = getField(row, fieldMap, 'SKUNO');

    if (location.length > 0 && !location.includes(loc)) return false;
    if (customerCode.length > 0 && !customerCode.includes(cust)) return false;
    if (orderNo.length > 0 && !orderNo.includes(ord)) return false;

    if (currentStatus.length > 0) {
      const dept = stripHtml(getField(row, fieldMap, 'department'));
      if (!currentStatus.includes(dept)) return false;
    }

    if (metalType.length > 0) {
      const metal = stripHtml(getField(row, fieldMap, 'metal_type_name'));
      if (!metalType.includes(metal)) return false;
    }

    if (deliveryStatus !== 'All') {
      const remDays = computeRemainingDays(row, fieldMap);
      const isOnTime = typeof remDays === 'number' && remDays > 0;
      const isDeclined = typeof remDays === 'number' && remDays <= 0;
      if (deliveryStatus === 'On Time' && !isOnTime) return false;
      if (deliveryStatus === 'Delayed' && !isDeclined) return false;
    }

    if (orderNo.length === 0 && !isAllDates && dateRange.startDate && dateRange.endDate) {
      const raw = getField(row, fieldMap, dateField);
      if (raw) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime()) && (d < dateRange.startDate || d > dateRange.endDate)) {
          return false;
        }
      }
    }
    return true;
  });
};

/* ---------------------------------------------------------------- */
/* Dynamic grid height                                                */
/* ---------------------------------------------------------------- */

const ROW_HEIGHT_DENSE = 34;
const ROW_HEIGHT_NORMAL = 40;
const HEADER_HEIGHT_DENSE = 56;
const HEADER_HEIGHT_NORMAL = 42;
const EMPTY_STATE_HEIGHT = 110;

// Selectable "rows per page" options — default is the first entry.
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Hard cap on how many rows' worth of height a panel will ever take up
// before it starts scrolling internally.
const MAX_VISIBLE_ROWS = 10;

const computeGridMaxHeight = (rowCount, dense) => {
  const rowH = dense ? ROW_HEIGHT_DENSE : ROW_HEIGHT_NORMAL;
  const headerH = dense ? HEADER_HEIGHT_DENSE : HEADER_HEIGHT_NORMAL;

  if (!rowCount) return headerH + EMPTY_STATE_HEIGHT;

  return headerH + MAX_VISIBLE_ROWS * rowH + 24;
};

/* ---------------------------------------------------------------- */
/* Generic panel wrapping a DataGrid                                  */
/* ---------------------------------------------------------------- */

const NoRowsOverlay = () => (
  <Box className="data-table__no-rows">No records found</Box>
);

const DataGridPanel = ({
  icon,
  title,
  columns,
  rows,
  dense = false,
  showTotals = false,
  gridHeight, // optional manual override; auto-computed from row count otherwise
  headerFilters, // NEW: optional filter controls rendered on the right of the header
}) => {
  const gridWrapRef = useRef(null);
  const totalsRowRef = useRef(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const showFooter = rows.length > PAGE_SIZE_OPTIONS[0];
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows =
    rows.length > pageSize ? rows.slice((safePage - 1) * pageSize, safePage * pageSize) : rows;

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  const pageTotals = useMemo(() => {
    if (!showTotals) return null;
    const totals = {};
    columns.forEach((col) => {
      if (col.field === 'row') return;
      let sum = 0;
      let hasNumeric = false;
      pagedRows.forEach((r) => {
        const raw = r[col.field];
        const num =
          typeof raw === 'number'
            ? raw
            : raw !== '' && raw !== null && raw !== undefined && !Number.isNaN(Number(raw))
            ? Number(raw)
            : null;
        if (num !== null) {
          sum += num;
          hasNumeric = true;
        }
      });
      totals[col.field] = hasNumeric ? sum : '';
    });
    return totals;
  }, [showTotals, columns, pagedRows]);

  useEffect(() => {
    const scroller = gridWrapRef.current?.querySelector('.MuiDataGrid-virtualScroller');
    if (!scroller) return;

    const handleScroll = () => {
      if (totalsRowRef.current) {
        totalsRowRef.current.scrollLeft = scroller.scrollLeft;
      }
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [pagedRows]);

  const columnsNoHeaderTooltip = useMemo(
    () =>
      columns.map((col) =>
        col.renderHeader
          ? col
          : {
              ...col,
              renderHeader: () => (
                <span
                  style={{
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {col.headerName}
                </span>
              ),
            }
      ),
    [columns]
  );

  const resolvedMaxHeight = gridHeight ?? computeGridMaxHeight(pagedRows.length, dense);
  const isOverflowing = pagedRows.length > MAX_VISIBLE_ROWS;
  const hasRows = pagedRows.length > 0;

  return (
    <Paper className={`data-table data-table--full ${dense ? 'data-table--dense' : ''}`} elevation={0}>
      <Box className="data-table__header">
        <Box className="data-table__header-left">
          {icon}
          <Box>
            {title && (
              <Typography className="data-table__subtitle" style={{ color: '#000', fontWeight: 'bold' }}>
                {title}
              </Typography>
            )}
          </Box>
        </Box>

        {headerFilters && (
          <Box className="data-table__header-filters">{headerFilters}</Box>
        )}
      </Box>

      <Box
        className={`data-table__grid-wrap ${isOverflowing ? 'data-table__grid-wrap--scrollable' : ''}`}
        ref={gridWrapRef}
        style={
          hasRows
            ? { maxHeight: resolvedMaxHeight, overflowY: 'auto' }
            : { height: resolvedMaxHeight, overflowY: 'hidden' }
        }
      >
        <DataGrid
          autoHeight
          rows={pagedRows}
          columns={columnsNoHeaderTooltip}
          getRowId={(row) => row.__key}
          disableColumnMenu
          disableRowSelectionOnClick
          hideFooter
          hideFooterPagination
          rowHeight={dense ? 34 : 40}
          columnHeaderHeight={dense ? 56 : 42}
          pagination={false}
          className="mis-datagrid"
          components={{ NoRowsOverlay }}
        />
      </Box>

      {showTotals && pageTotals && rows.length > 0 && (
        <Box className="data-table__totals-row" ref={totalsRowRef}>
          {columns.map((col) => (
            <Box
              key={col.field}
              className="data-table__totals-cell"
              style={{
                flex: col.flex ?? 1,
                minWidth: col.minWidth,
                textAlign: col.align || 'left',
                justifyContent:
                  col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              {col.field === 'row' ? 'Total' : pageTotals[col.field] ?? ''}
            </Box>
          ))}
        </Box>
      )}

      {showFooter && (
        <Box className="data-table__pagination">
          <Box className="data-table__page-size">
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="data-table__page-size-select"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Typography className="data-table__pagination-info">
            {rangeStart}–{rangeEnd} of {rows.length}
          </Typography>

          {pageCount > 1 && (
            <Pagination
              count={pageCount}
              page={safePage}
              onChange={(e, val) => setPage(val)}
              size="small"
              shape="rounded"
              color="primary"
              siblingCount={0}
              boundaryCount={1}
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

/* ---------------------------------------------------------------- */
/* Stat card                                                          */
/* ---------------------------------------------------------------- */

const StatCard = ({ icon, label, value, subLabel, unit }) => (
  <Paper className="stat-card" elevation={0}>
    <Box className="stat-card__top">
      <Typography className="stat-card__label" sx={{ fontWeight: 'bold' }}>
        {label}
      </Typography>
      <Box className="stat-card__icon">{icon}</Box>
    </Box>
    <Typography className="stat-card__value" style={{ fontWeight: 'bold' }}>
      {value} {unit != 'Ct' ? ` ${unit}` : ''}
    </Typography>
  </Paper>
);

/* ---------------------------------------------------------------- */
/* Filter chip (single select) — used for Delivery Status             */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* Filter chip (single select) — used for Delivery Status. Clicking   */
/* ANYWHERE on the chip (not just the select) opens the dropdown.     */
/* ---------------------------------------------------------------- */

const FilterChip = ({ label, value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  return (
    <Box className="filter-chip" onClick={() => setOpen(true)}>
      <Typography className="filter-chip__label">{label}</Typography>
      <Select
        size="small"
        value={value}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(false);
        }}
        className="filter-chip__select"
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

/* ---------------------------------------------------------------- */
/* Checkbox-style multi-select filter — click the chip, a popover     */
/* with checkboxes opens. Used inline in each tab's header.           */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* Checkbox-style multi-select filter — click the chip, a popover     */
/* with a search box + checkboxes opens. Used inline in each tab's    */
/* header for Location / Customer / Order No. / Status / Metal.       */
/* ---------------------------------------------------------------- */

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const CheckboxFilterChip = ({ label, value, onChange, options }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');
  const open = Boolean(anchorEl);

  const toggleOption = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const filteredOptions = useMemo(
    () => options.filter((opt) => String(opt).toLowerCase().includes(search.trim().toLowerCase())),
    [options, search]
  );

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => {
    setAnchorEl(null);
    setSearch('');
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={handleOpen}
        className="tab-filter-chip"
      >
        {label}
        {value.length > 0 && <Box className="tab-filter-chip__count">{value.length}</Box>}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ className: 'tab-filter-popover' }}
      >
        <Box className="tab-filter-popover__search">
          <SearchIcon fontSize="small" className="tab-filter-popover__search-icon" />
          <TextField
            size="small"
            variant="standard"
            placeholder={`Search ${label}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            autoFocus
            InputProps={{ disableUnderline: true }}
          />
        </Box>

        <Box className="tab-filter-popover__list">
          {filteredOptions.length === 0 && (
            <Typography className="tab-filter-popover__empty">No options</Typography>
          )}
          {filteredOptions.map((opt) => (
            <Box key={opt} className="tab-filter-popover__item" onClick={() => toggleOption(opt)}>
              <Checkbox
                size="small"
                checked={value.includes(opt)}
                icon={checkboxIcon}
                checkedIcon={checkboxCheckedIcon}
                style={{ padding: 2, marginRight: 4 }}
              />
              <span>{opt}</span>
            </Box>
          ))}
        </Box>

        {value.length > 0 && (
          <Box className="tab-filter-popover__footer">
            <Button size="small" onClick={() => onChange([])}>
              Clear
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};
/* ---------------------------------------------------------------- */
/* Full filter bar for one tab — holds Location / Customer Code /     */
/* Order No. / Current Status / Metal Type (checkbox chips) plus      */
/* Delivery Status (single select). Independent per tab: each         */
/* instance gets its own `filters` state + `onChange` from the parent.*/
/* ---------------------------------------------------------------- */

const TabFilterBar = ({ filters, onChange, options }) => {
  const setField = (field, value) => onChange({ ...filters, [field]: value });

  const activeCount =
    (filters.location.length > 0 ? 1 : 0) +
    (filters.customerCode.length > 0 ? 1 : 0) +
    (filters.orderNo.length > 0 ? 1 : 0) +
    (filters.currentStatus.length > 0 ? 1 : 0) +
    (filters.metalType.length > 0 ? 1 : 0) +
    (filters.deliveryStatus !== 'All' ? 1 : 0);

  const handleClearAll = () => onChange(createEmptyFilters());

  return (
    <Box className="tab-filter-bar">
      <CheckboxFilterChip
        label="Location"
        value={filters.location}
        onChange={(v) => setField('location', v)}
        options={options.location}
      />
      <CheckboxFilterChip
        label="Customer"
        value={filters.customerCode}
        onChange={(v) => setField('customerCode', v)}
        options={options.customer}
      />
      <CheckboxFilterChip
        label="Order No."
        value={filters.orderNo}
        onChange={(v) => setField('orderNo', v)}
        options={options.orderNo}
      />
      <CheckboxFilterChip
        label="Status"
        value={filters.currentStatus}
        onChange={(v) => setField('currentStatus', v)}
        options={options.currentStatus}
      />
      <CheckboxFilterChip
        label="Metal"
        value={filters.metalType}
        onChange={(v) => setField('metalType', v)}
        options={options.metalType}
      />
      <FilterChip
        label="Delivery"
        value={filters.deliveryStatus}
        onChange={(v) => setField('deliveryStatus', v)}
        options={['All', 'On Time', 'Delayed']}
      />

      {activeCount > 0 && (
        <IconButton
          size="small"
          onClick={handleClearAll}
          className="tab-filter-bar__clear"
          title="Clear filters"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

/* ---------------------------------------------------------------- */
/* Main component                                                     */
/* ---------------------------------------------------------------- */

const DATE_FIELD_OPTIONS = [{ value: 'jobpromisedate', label: 'Promise Date' }];

const DIAMOND_WEIGHT_FIELD = 'Diamond_actualusedgm';
const SOLITAIRE_PCS_FIELD = 'solitairepcs';
const SOLITAIRE_WEIGHT_FIELD = 'solitairewt';

const TAB_LABELS = [
  'Order Details',
  'WIP Distribution by Location',
  'Current Status by Location',
  'Promise Date by Status',
];

const WIPMis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateField, setDateField] = useState('jobpromisedate');
  const [dateRange, setDateRange] = useState(() => getThisMonthRange());
  const [isAllDates, setIsAllDates] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [stagingRange, setStagingRange] = useState(dateRange);

  // ---- Active tab ----
  const [activeTab, setActiveTab] = useState(0);

  // ---- Per-tab, INDEPENDENT filter state (one object per tab) ----
  const [orderFilters, setOrderFilters] = useState(createEmptyFilters);
  const [promiseFilters, setPromiseFilters] = useState(createEmptyFilters);
  const [statusFilters, setStatusFilters] = useState(createEmptyFilters);
  const [deptFilters, setDeptFilters] = useState(createEmptyFilters);

  const handleFetchData = async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedData = await GetWipData(start, end);
      setData(fetchedData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, []);

  const rd2 = data?.Data?.rd2 || [{}];
  const rawRows = data?.Data?.rd3 || [];
  const fieldMap = useMemo(() => buildFieldMap(rd2), [rd2]);

  const handleSelectAllDates = () => {
    setIsAllDates(true);
    setPickerAnchor(null);
  };

  const openDatePicker = (e) => {
    setStagingRange({ startDate: dateRange.startDate, endDate: dateRange.startDate });
    setPickerAnchor(e.currentTarget);
  };

  const applyDateRange = () => {
    const start = new Date(stagingRange.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(stagingRange.endDate || stagingRange.startDate);
    end.setHours(23, 59, 59, 999);

    setDateRange({ startDate: start, endDate: end });
    setIsAllDates(false);
    setPickerAnchor(null);
  };

  // Rows restricted ONLY by the Promise Date range — feeds both the KPI
  // cards and the dropdown option lists shared by every tab's filter bar.
  const dateFilteredRows = useMemo(() => {
    if (isAllDates || !dateRange.startDate || !dateRange.endDate) return rawRows;
    return rawRows.filter((row) => {
      const raw = getField(row, fieldMap, dateField);
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;
      return d >= dateRange.startDate && d <= dateRange.endDate;
    });
  }, [rawRows, fieldMap, isAllDates, dateRange, dateField]);

  const filterOptionSets = useMemo(() => {
    const locSet = new Set();
    const custSet = new Set();
    const ordSet = new Set();
    const statusSet = new Set();
    const metalSet = new Set();
    dateFilteredRows.forEach((r) => {
      const loc = getField(r, fieldMap, 'JobLocation');
      const cust = getField(r, fieldMap, 'Customercode');
      const ord = getField(r, fieldMap, 'SKUNO');
      const dept = stripHtml(getField(r, fieldMap, 'department'));
      const metal = stripHtml(getField(r, fieldMap, 'metal_type_name'));
      if (loc) locSet.add(loc);
      if (cust) custSet.add(cust);
      if (ord) ordSet.add(ord);
      if (dept) statusSet.add(dept);
      if (metal) metalSet.add(metal);
    });
    return {
      location: [...locSet].sort(),
      customer: [...custSet].sort(),
      orderNo: [...ordSet].sort(),
      currentStatus: [...statusSet].sort(),
      metalType: [...metalSet].sort(),
    };
  }, [dateFilteredRows, fieldMap]);

  // ---- Per-tab filtered rows (each independent of the others) ----
  const dateCtx = { isAllDates, dateRange, dateField };

  const orderFilteredRows = useMemo(
    () => applyRowFilters(rawRows, fieldMap, orderFilters, dateCtx),
    [rawRows, fieldMap, orderFilters, isAllDates, dateRange, dateField]
  );
  const promiseFilteredRows = useMemo(
    () => applyRowFilters(rawRows, fieldMap, promiseFilters, dateCtx),
    [rawRows, fieldMap, promiseFilters, isAllDates, dateRange, dateField]
  );
  const statusFilteredRows = useMemo(
    () => applyRowFilters(rawRows, fieldMap, statusFilters, dateCtx),
    [rawRows, fieldMap, statusFilters, isAllDates, dateRange, dateField]
  );
  const deptFilteredRows = useMemo(
    () => applyRowFilters(rawRows, fieldMap, deptFilters, dateCtx),
    [rawRows, fieldMap, deptFilters, isAllDates, dateRange, dateField]
  );

  // KPI cards reflect the date range only (not any one tab's filters).
  const stats = useMemo(
    () => ({
      pcs: dateFilteredRows.length,
      nwt: sumField(dateFilteredRows, fieldMap, 'NetWtgm'),
      gwt: sumField(dateFilteredRows, fieldMap, 'GrossWeightgm'),
      diaPcs: sumField(dateFilteredRows, fieldMap, 'Diamond_actualusedpcs'),
      solPcs: sumField(dateFilteredRows, fieldMap, SOLITAIRE_PCS_FIELD),
      diaWt: sumField(dateFilteredRows, fieldMap, DIAMOND_WEIGHT_FIELD),
      solWt: sumField(dateFilteredRows, fieldMap, SOLITAIRE_WEIGHT_FIELD),
    }),
    [dateFilteredRows, fieldMap]
  );

  const promisePivot = useMemo(
    () => buildPivot(promiseFilteredRows, fieldMap, 'jobpromisedate', 'JobLocation', formatDateOnly),
    [promiseFilteredRows, fieldMap]
  );
  const statusPivot = useMemo(
    () => buildPivot(statusFilteredRows, fieldMap, 'department', 'JobLocation'),
    [statusFilteredRows, fieldMap]
  );
  const departmentPivot = useMemo(
    () => buildPivot(deptFilteredRows, fieldMap, 'jobpromisedate', 'department', formatDateOnly),
    [deptFilteredRows, fieldMap]
  );

  const pickerTheme = useMemo(() => createTheme({ palette: { primary: { main: '#6c5ce7' } } }), []);

  const buildPivotColumns = (rowLabel, colKeys) => [
    { field: 'row', headerName: rowLabel, flex: 1.4, minWidth: 160 },
    {
      field: 'pcs',
      headerName: 'Pcs',
      flex: 1,
      minWidth: 90,
      align: 'center',
      headerAlign: 'center',
    },
    ...colKeys.map((c) => ({
      field: c,
      headerName: c,
      flex: 1,
      minWidth: Math.max(90, c.length * 9),
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const val = params.value;
        if (val === '' || val === undefined || val === null) return null;
        return (
          <Box className="heat-cell" style={{ background: 'transparent', color: '#1a1f36' }}>
            {val}
          </Box>
        );
      },
    })),
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      minWidth: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box className="heat-cell heat-cell--total" style={{ background: 'transparent', color: '#1a1f36' }}>
          {params.value}
        </Box>
      ),
    },
  ];

  const buildPivotRows = (pivot, colKeys = pivot.colKeys) =>
    pivot.rowKeys.map((r) => ({
      __key: r,
      row: r,
      pcs: pivot.rowQtyTotals[r] || 0,
      total: pivot.rowTotals[r],
      ...colKeys.reduce((acc, c) => {
        acc[c] = pivot.matrix[r]?.[c] || '';
        return acc;
      }, {}),
    }));

  const buildPivotTotals = (pivot, colKeys = pivot.colKeys) => ({
    pcs: pivot.grandQty || 0,
    total: pivot.grandTotal,
    ...colKeys.reduce((acc, c) => {
      acc[c] = pivot.colTotals[c] || 0;
      return acc;
    }, {}),
  });

  const promise = useMemo(() => {
    const allCols = buildPivotColumns('Promise Date', promisePivot.colKeys);
    const rows = buildPivotRows(promisePivot);
    const columns = filterEmptyColumns(allCols, rows, ['pcs']);
    const totals = buildPivotTotals(promisePivot);
    return { columns, rows, totals };
  }, [promisePivot]);

  const status = useMemo(() => {
    const allCols = buildPivotColumns('Current Status', statusPivot.colKeys);
    const rows = buildPivotRows(statusPivot);
    const columns = filterEmptyColumns(allCols, rows, ['pcs']);
    const totals = buildPivotTotals(statusPivot);
    return { columns, rows, totals };
  }, [statusPivot]);

  const department = useMemo(() => {
    const orderedColKeys = reorderPriorityColumn(departmentPivot.colKeys, 'Pending Request');
    const allCols = buildPivotColumns('Promise Date', orderedColKeys);
    const rows = buildPivotRows(departmentPivot, orderedColKeys);
    const columns = filterEmptyColumns(allCols, rows, ['Pending Request', 'pcs']);
    const totals = buildPivotTotals(departmentPivot, orderedColKeys);
    return { columns, rows, totals };
  }, [departmentPivot]);

  /* ---------------- Order Details (uses expstartdate) ---------------- */
  const orderDetails = useMemo(() => {
    return orderFilteredRows
      .map((row, idx) => {
        const promiseRaw = getField(row, fieldMap, 'jobpromisedate');
        const entryRaw = getField(row, fieldMap, 'expstartdate');
        const remDays = computeRemainingDays(row, fieldMap);

        let remainingDaysTooltip = '';
        const missingPromise = !promiseRaw;
        const missingEntry = !entryRaw;
        if (missingPromise && missingEntry) {
          remainingDaysTooltip = 'Date Not Provided';
        } else if (missingPromise) {
          remainingDaysTooltip = 'Promise Date Not Provided';
        } else if (missingEntry) {
          remainingDaysTooltip = 'Exp. Start Date Not Provided';
        }

        return {
          __key: idx,
          promiseDateRaw: promiseRaw,
          promiseDate: formatDateOnly(promiseRaw),
          remainingDays: remDays === null ? '-' : remDays,
          Pcs: getField(row, fieldMap, 'Quantity') || '-',
          remainingDaysTooltip,
          location: getField(row, fieldMap, 'JobLocation') || '-',
          custCode: getField(row, fieldMap, 'Customercode') || '-',
          job: getField(row, fieldMap, 'serialjobno') || '-',
          designNo: getField(row, fieldMap, 'Designcode') || '-',
          status: getField(row, fieldMap, 'ProductionStatusName') || '-',
        };
      })
      .sort((a, b) => new Date(b.promiseDateRaw || 0) - new Date(a.promiseDateRaw || 0));
  }, [orderFilteredRows, fieldMap]);

  const orderColumnsAll = useMemo(
    () => [
      { field: 'promiseDate', headerName: 'Promise Date', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center' },
      {
        field: 'remainingDays',
        headerName: 'Rem. Days',
        flex: 0.8,
        minWidth: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const val = params.value;
          const isNum = typeof val === 'number';
          const chipClass = isNum
            ? (val > 0 ? 'remaining-chip--ok' : 'remaining-chip--danger')
            : 'remaining-chip--neutral';

          const chip = (
            <span className={`remaining-chip ${chipClass}`} style={{ display: 'flex' }}>
              {val}
            </span>
          );

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {!isNum && params.row.remainingDaysTooltip ? (
                <Tooltip title={params.row.remainingDaysTooltip} arrow>
                  {chip}
                </Tooltip>
              ) : (
                chip
              )}
            </Box>
          );
        },
      },
      { field: 'location', headerName: 'Location', flex: 1, minWidth: 120 },
      { field: 'custCode', headerName: 'CustCode', flex: 1.1, minWidth: 130 },
      { field: 'job', headerName: 'Job', flex: 1, minWidth: 120 },
      { field: 'Pcs', headerName: 'Pcs', flex: 1, minWidth: 80 },
      { field: 'designNo', headerName: 'Design No.', flex: 1.1, minWidth: 130 },
      {
        field: 'status',
        headerName: 'Current Status',
        flex: 1.4,
        minWidth: 160,
        renderCell: (params) => <span className="status">{params.value}</span>,
      },
    ],
    []
  );

  const orderColumns = useMemo(
    () => filterEmptyColumns(orderColumnsAll, orderDetails, ['Pcs', 'remainingDays', 'promiseDate']),
    [orderColumnsAll, orderDetails]
  );

  /* ---------------- export to excel (4 sheets) ---------------- */
  const buildSheetAOA = (columns, rows, totalsRow) => {
    const header = columns.map((c) => c.headerName || c.field);
    const dataRows = rows.map((r) => columns.map((c) => (r[c.field] === undefined || r[c.field] === null ? '' : r[c.field])));
    const aoa = [header, ...dataRows];
    if (totalsRow) {
      aoa.push(columns.map((c) => (c.field === 'row' ? 'Total' : totalsRow[c.field] ?? '')));
    }
    return aoa;
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buildSheetAOA(promise.columns, promise.rows, promise.totals)),
      'WIP Distribution'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buildSheetAOA(status.columns, status.rows, status.totals)),
      'Current Status'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buildSheetAOA(orderColumns, orderDetails, null)),
      'Order Details'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buildSheetAOA(department.columns, department.rows, department.totals)),
      'Promise Date by Status'
    );

    const fileName = `WIP_ANALYSIS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box className="wip-mis">
      {loading && (
        <Box className="wip-mis__loading" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <CircularProgress size={26} />
          <Typography>Loading report…</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" className="wip-mis__error">
          {error.message || 'Something went wrong while loading data.'}
        </Alert>
      )}

      {!loading && data && (
        <Box className="wip-mis__body">
          <Paper className="toolbar" elevation={0}>
            <Box className="toolbar__filters-row">
              <Box className="toolbar__group toolbar__group--left">
                <Box className=" ">
                  <Typography className="filter-chip__value" sx={{ fontWeight: 'bold' }}>
                    {DATE_FIELD_OPTIONS[0]?.label} :
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CalendarMonthOutlinedIcon fontSize="small" />}
                  onClick={openDatePicker}
                  sx={{
                    flexShrink: 0,
                    textTransform: 'none',
                    color: '#1a1f36',
                    borderColor: '#e6e8f0',
                    borderRadius: '8px',
                    fontWeight: 500,
                    fontSize: '13px',
                    background: '#f6f7fb',
                    whiteSpace: 'nowrap',
                    height: '36px',
                    '& .MuiButton-startIcon': { color: '#6c5ce7' },
                    '&:hover': { borderColor: '#6c5ce7', background: '#f2effe' },
                  }}
                >
                  {isAllDates
                    ? 'All Dates'
                    : `${formatDatePretty(dateRange.startDate)} — ${formatDatePretty(dateRange.endDate)}`}
                </Button>

                <Popover
                  open={Boolean(pickerAnchor)}
                  anchorEl={pickerAnchor}
                  onClose={() => setPickerAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{ className: 'date-range-popover' }}
                >
                  <ThemeProvider theme={pickerTheme}>
                    <DateRangePicker
                      open
                      toggle={() => setPickerAnchor(null)}
                      initialDateRange={stagingRange}
                      onChange={(range) => setStagingRange(range)}
                    />
                  </ThemeProvider>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                      padding: '10px 14px',
                      borderTop: '1px solid #e6e8f0',
                      background: '#fff',
                    }}
                  >
                    <Button size="small" color="inherit" onClick={() => setPickerAnchor(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={applyDateRange}
                      sx={{ background: '#6c5ce7', '&:hover': { background: '#5a4bd6' } }}
                    >
                      Apply
                    </Button>
                  </Box>
                </Popover>

                <Button
                  color="inherit"
                  onClick={handleSelectAllDates}
                  sx={{
                    flexShrink: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '8px',
                    padding: '6px 18px',
                    height: '36px',
                    ...(isAllDates
                      ? {
                          background: '#6c5ce7',
                          color: '#fff',
                          '&:hover': { background: '#5a4bd6' },
                        }
                      : {
                          background: '#f2effe',
                          color: '#5a4bd6',
                        }),
                  }}
                >
                  ALL
                </Button>
              </Box>

              <Box className="toolbar__group toolbar__group--right">
                <IconButton
                  className="wip-mis__export-btn"
                  onClick={handleExportExcel}
                  size="small"
                  title="Export to Excel"
                >
                  <DescriptionOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  className={`wip-mis__refresh-btn ${loading ? 'is-spinning' : ''}`}
                  onClick={() => handleFetchData()}
                  disabled={loading}
                  size="small"
                  title="Refresh"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          <Box className="wip-mis__stats">
            <StatCard
              icon={<Inventory2OutlinedIcon fontSize="small" />}
              label="WIP JOBS"
              value={stats.pcs.toLocaleString()}
              subLabel="Active Jobs"
              unit=""
            />
            <StatCard
              icon={<ScaleOutlinedIcon fontSize="small" />}
              label="NET WEIGHT"
              value={stats.nwt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              subLabel="Net Weight"
              unit="Gm"
            />
            <StatCard
              icon={<MonitorWeightOutlinedIcon fontSize="small" />}
              label="GROSS WEIGHT"
              value={stats.gwt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              subLabel="Gross Weight"
              unit="Gm"
            />
            <StatCard
              icon={<DiamondOutlinedIcon fontSize="small" />}
              label="DIAMOND PIECES"
              value={formatDiamondSolitaire(stats.diaPcs, stats.solPcs, 0, ' ')}
              subLabel="Total Diamond"
              unit=""
            />
            <StatCard
              icon={<DiamondOutlinedIcon fontSize="small" />}
              label="DIAMOND WEIGHT"
              value={formatDiamondSolitaire(stats.diaWt, stats.solWt, 2, 'ct')}
              subLabel="Total Diamond Weight"
              unit="Ct"
            />
          </Box>

          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            className="wip-tabs"
          >
            {TAB_LABELS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>

          <Box className="wip-mis__pivots">
            {activeTab === 0 && (
              <DataGridPanel
                icon={<Inventory2Icon fontSize="small" />}
                title="Order Details"
                dense
                columns={orderColumns}
                rows={orderDetails}
                headerFilters={
                  <TabFilterBar filters={orderFilters} onChange={setOrderFilters} options={filterOptionSets} />
                }
              />
            )}

            {activeTab === 1 && (
              <DataGridPanel
                icon={<EventNoteOutlinedIcon fontSize="small" />}
                title="WIP Distribution by Location"
                dense
                showTotals
                columns={promise.columns}
                rows={promise.rows}
                headerFilters={
                  <TabFilterBar filters={promiseFilters} onChange={setPromiseFilters} options={filterOptionSets} />
                }
              />
            )}

            {activeTab === 2 && (
              <DataGridPanel
                icon={<Inventory2Icon fontSize="small" />}
                title="Current Status by Location"
                dense
                showTotals
                columns={status.columns}
                rows={status.rows}
                headerFilters={
                  <TabFilterBar filters={statusFilters} onChange={setStatusFilters} options={filterOptionSets} />
                }
              />
            )}

            {activeTab === 3 && (
              <DataGridPanel
                icon={<EventNoteOutlinedIcon fontSize="small" />}
                title="Promise Date by Status"
                dense
                showTotals
                columns={department.columns}
                rows={department.rows}
                headerFilters={
                  <TabFilterBar filters={deptFilters} onChange={setDeptFilters} options={filterOptionSets} />
                }
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WIPMis;