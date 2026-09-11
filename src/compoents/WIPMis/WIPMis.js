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
  Autocomplete,
  TextField,
  Checkbox,
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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { DateRangePicker } from 'mui-daterange-picker';
import * as XLSX from 'xlsx';
import { GetWipData } from '../../API/GetWipData/GetWipData';
import './WIPMis.scss';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

/* ---------------------------------------------------------------- */
/* Helpers                                                            */
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

const formatDateOnly = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
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

const buildPivot = (rows, fieldMap, rowField, colField, rowFormatter) => {
  const matrix = {};
  const rowTotals = {};
  const colTotals = {};
  let grandTotal = 0;
  let maxCell = 0;

  rows.forEach((row) => {
    let rVal = getField(row, fieldMap, rowField);
    let cVal = getField(row, fieldMap, colField);

    if (rowFormatter) rVal = rowFormatter(rVal);
    rVal = stripHtml(rVal);
    cVal = stripHtml(cVal);

    // Skip entries where the row-grouping value or column-grouping value
    // is missing, instead of bucketing them under "Unspecified" — e.g.
    // rows with no JobLocation no longer create a phantom column.
    if (rVal === undefined || rVal === null || rVal === '') return;
    if (cVal === undefined || cVal === null || cVal === '') return;

    matrix[rVal] = matrix[rVal] || {};
    matrix[rVal][cVal] = (matrix[rVal][cVal] || 0) + 1;
    if (matrix[rVal][cVal] > maxCell) maxCell = matrix[rVal][cVal];

    rowTotals[rVal] = (rowTotals[rVal] || 0) + 1;
    colTotals[cVal] = (colTotals[cVal] || 0) + 1;
    grandTotal += 1;
  });

  const rowKeys = Object.keys(rowTotals).sort((a, b) => rowTotals[b] - rowTotals[a]);
  const colKeys = Object.keys(colTotals)
    .filter((c) => colTotals[c] > 0)
    .sort(naturalSort);

  return { rowKeys, colKeys, matrix, rowTotals, colTotals, grandTotal, maxCell };
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

/* ---------------------------------------------------------------- */
/* Dynamic grid height (no dead space when there are few rows,        */
/* capped + scrollable once row count passes the visible limit)       */
/* ---------------------------------------------------------------- */

const ROW_HEIGHT_DENSE = 34;
const ROW_HEIGHT_NORMAL = 40;
const HEADER_HEIGHT_DENSE = 56;
const HEADER_HEIGHT_NORMAL = 42;
const MAX_VISIBLE_ROWS = 9;
const EMPTY_STATE_HEIGHT = 110;

const computeGridHeight = (rowCount, dense) => {
  const rowH = dense ? ROW_HEIGHT_DENSE : ROW_HEIGHT_NORMAL;
  const headerH = dense ? HEADER_HEIGHT_DENSE : HEADER_HEIGHT_NORMAL;

  if (!rowCount) return headerH + EMPTY_STATE_HEIGHT;

  const visibleRows = Math.min(rowCount, MAX_VISIBLE_ROWS);
  return headerH + visibleRows * rowH + 2; // +2px border buffer
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
  totalsRow,
  gridHeight, // optional manual override; auto-computed from row count otherwise
}) => {
  const gridWrapRef = useRef(null);
  const totalsRowRef = useRef(null);

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
  }, [rows]);

  // MUI DataGrid wraps the header label in its own <Tooltip> (via
  // GridColumnHeaderTitle) whenever the text is truncated, which is what
  // shows a tooltip on hover of the column name. Supplying our own
  // `renderHeader` bypasses that default wrapper entirely — we render the
  // plain label ourselves, so there's no tooltip, without touching every
  // column definition where these columns are built.
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

  const resolvedHeight = gridHeight ?? computeGridHeight(rows.length, dense);
  const showScroll = rows.length > MAX_VISIBLE_ROWS;

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
      </Box>

      <Box
        className="data-table__grid-wrap"
        ref={gridWrapRef}
        style={{ height: resolvedHeight, overflowY: showScroll ? 'auto' : 'hidden' }}
      >
        <DataGrid
          rows={rows}
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

      {showTotals && totalsRow && rows.length > 0 && (
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
              {col.field === 'row' ? 'Total' : totalsRow[col.field] ?? ''}
            </Box>
          ))}
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
    <Typography className="stat-card__value">
      {value} {unit ? ` ${unit}` : ''}
    </Typography>
  </Paper>
);

/* ---------------------------------------------------------------- */
/* Filter chip (single select) — still used for Delivery Status       */
/* ---------------------------------------------------------------- */

const FilterChip = ({ label, value, onChange, options }) => (
  <Box className="filter-chip">
    <Typography className="filter-chip__label">{label}</Typography>
    <Select size="small" value={value} onChange={(e) => onChange(e.target.value)} className="filter-chip__select">
      {options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </Select>
  </Box>
);

/* ---------------------------------------------------------------- */
/* Multi-select + searchable filter chip — Location / Customer Code / */
/* Order No. Empty selection === "All" (within the active date range). */
/* Selections are summarised as plain text ("3 selected") instead of  */
/* individual removable chips, and the single built-in "x" clears the */
/* whole selection at once.                                           */
/* ---------------------------------------------------------------- */

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const MultiSelectFilterChip = ({ label, value, onChange, options }) => (
  <Box className="filter-chip filter-chip--multi">
    <Typography className="filter-chip__label">{label}</Typography>
    <Autocomplete
      multiple
      disableCloseOnSelect
      size="small"
      className="filter-chip__autocomplete"
      options={options}
      value={value}
      onChange={(e, newValue) => onChange(newValue)}
      isOptionEqualToValue={(opt, val) => opt === val}
      // No per-item chips — just a short plain-text summary of the
      // selection. Clearing the whole selection happens through the
      // single built-in "x" clear button (forced always-visible below).
      renderTags={(selected) =>
        selected.length ? (
          <Typography noWrap style={{ fontSize: 13, color: '#1a1f36' }}>
            {/* {selected.length === 1 ? selected[0] : `${selected.length} selected`} */}
            { `${selected.length} selected`}
          </Typography>
        ) : null
      }
      renderOption={(props, option, { selected }) => (
        <li
          {...props}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 14px',
            fontSize: 13,
          }}
        >
          <Checkbox
            icon={checkboxIcon}
            checkedIcon={checkboxCheckedIcon}
            checked={selected}
            size="small"
            style={{ marginRight: 8, padding: 2 }}
          />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{option}</span>
        </li>
      )}
      componentsProps={{
        paper: {
          style: {
            minWidth: 220,
            borderRadius: 10,
            marginTop: 4,
            backgroundColor: '#fff',
            boxShadow: '0 8px 24px rgba(20, 20, 43, 0.16)',
          },
        },
        popper: {
          style: { zIndex: 1500 },
        },
      }}
      sx={{
        // The default MUI clear "x" only fades in on hover — make it
        // always visible once something is selected, so there's a
        // constantly-visible single control to clear the filter.
        '& .MuiAutocomplete-clearIndicator': {
          visibility: 'visible',
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          placeholder={value.length ? '' : 'All'}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
        />
      )}
    />
  </Box>
);

/* ---------------------------------------------------------------- */
/* Main component                                                     */
/* ---------------------------------------------------------------- */

const DATE_FIELD_OPTIONS = [
  { value: 'jobpromisedate', label: 'Promise Date' },
];

// NOTE: adjust this to whatever the actual API field name is for diamond
// weight if it differs — it follows the same naming pattern as
// "Diamond_actualusedpcs" (used for the Diamond Pieces KPI below).
const DIAMOND_WEIGHT_FIELD = 'Diamond_actualusedgm';

const WIPMis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateField, setDateField] = useState('jobpromisedate');
  // Default to THIS month instead of last month / a fixed hardcoded range
  const [dateRange, setDateRange] = useState(() => getThisMonthRange());
  const [isAllDates, setIsAllDates] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  // Staged range so the popover only commits on "Apply" — this also fixes
  // single-day selection, since the picker library fires onChange on the
  // very first click (before a second click can extend the range) and the
  // old code closed the popover immediately on that first call.
  const [stagingRange, setStagingRange] = useState(dateRange);

  const [location, setLocation] = useState([]); // [] === All
  const [customerCode, setCustomerCode] = useState([]); // [] === All
  const [orderNo, setOrderNo] = useState([]); // [] === All
  const [deliveryStatus, setDeliveryStatus] = useState('All');

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

  // Delivery Status now reflects remaining-days health, not isDeliveryBatchJob
  const deliveryStatusOptions = ['All', 'On Time', 'Delayed'];

  /* ---------------- ALL button handler ---------------- */
  const handleSelectAllDates = () => {
    setIsAllDates(true);
    setPickerAnchor(null);
  };

  const openDatePicker = (e) => {
    // Start the popover from a single-day selection (the currently applied
    // start date) instead of carrying over the previously applied range.
    // Otherwise a fresh single click on a new day can leave the picker's
    // internal endDate pointing at the OLD range's end, so Apply would
    // silently span the old wide range instead of just the clicked day.
    setStagingRange({ startDate: dateRange.startDate, endDate: dateRange.startDate });
    setPickerAnchor(e.currentTarget);
  };

  const applyDateRange = () => {
    // Expand the picked range to cover the full day(s), so a single-day
    // pick like "3 Sept — 3 Sept" (or just clicking 3 Sept once, with no
    // end date chosen) becomes [3rd 00:00:00.000, 3rd 23:59:59.999] — the
    // whole day's data — instead of a zero-width instant.
    const start = new Date(stagingRange.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(stagingRange.endDate || stagingRange.startDate);
    end.setHours(23, 59, 59, 999);

    setDateRange({ startDate: start, endDate: end });
    setIsAllDates(false);
    setPickerAnchor(null);
  };

  // Rows restricted ONLY by the Promise Date range (ignoring Location /
  // Customer Code / Order No. / Delivery Status). The Location, Customer
  // Code and Order No. dropdown OPTIONS are built from this set, so they
  // only ever list values that actually exist within the selected date
  // range — since the date picker is the primary filter and the table is
  // date-driven, there's no point offering options that don't apply to any
  // row in the current window.
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

  // Build all three dropdown option lists in a single pass over
  // dateFilteredRows (instead of three separate full scans) so opening any
  // of the filter dropdowns is fast even on larger datasets.
  const filterOptionSets = useMemo(() => {
    const locSet = new Set();
    const custSet = new Set();
    const ordSet = new Set();
    dateFilteredRows.forEach((r) => {
      const loc = getField(r, fieldMap, 'JobLocation');
      const cust = getField(r, fieldMap, 'Customercode');
      const ord = getField(r, fieldMap, 'SKUNO');
      if (loc) locSet.add(loc);
      if (cust) custSet.add(cust);
      if (ord) ordSet.add(ord);
    });
    return {
      location: [...locSet].sort(),
      customer: [...custSet].sort(),
      orderNo: [...ordSet].sort(),
    };
  }, [dateFilteredRows, fieldMap]);

  const locationOptions = filterOptionSets.location;
  const customerOptions = filterOptionSets.customer;
  const orderNoOptions = filterOptionSets.orderNo;

  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const loc = getField(row, fieldMap, 'JobLocation');
      const cust = getField(row, fieldMap, 'Customercode');
      const ord = getField(row, fieldMap, 'SKUNO');

      if (location.length > 0 && !location.includes(loc)) return false;
      if (customerCode.length > 0 && !customerCode.includes(cust)) return false;
      if (orderNo.length > 0 && !orderNo.includes(ord)) return false;

      if (deliveryStatus !== 'All') {
        const remDays = computeRemainingDays(row, fieldMap);
        const isOnTime = typeof remDays === 'number' && remDays > 0;
        const isDeclined = typeof remDays === 'number' && remDays <= 0;
        if (deliveryStatus === 'On Time' && !isOnTime) return false;
        if (deliveryStatus === 'Delayed' && !isDeclined) return false;
      }

      if (!isAllDates && dateRange.startDate && dateRange.endDate) {
        const raw = getField(row, fieldMap, dateField);
        // No date value on this row → it doesn't belong to any specific
        // date-range selection, so exclude it (previously it slipped
        // through every date filter because this whole block was skipped).
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        if (d < dateRange.startDate || d > dateRange.endDate) return false;
      }

      return true;
    });
  }, [rawRows, fieldMap, location, customerCode, orderNo, deliveryStatus, isAllDates, dateRange, dateField]);

  const stats = useMemo(
    () => ({
      pcs: filteredRows.length,
      nwt: sumField(filteredRows, fieldMap, 'NetWtgm'),
      gwt: sumField(filteredRows, fieldMap, 'GrossWeightgm'),
      diaPcs: sumField(filteredRows, fieldMap, 'Diamond_actualusedpcs'),
      diaWt: sumField(filteredRows, fieldMap, DIAMOND_WEIGHT_FIELD),
    }),
    [filteredRows, fieldMap]
  );

  const promisePivot = useMemo(
    () => buildPivot(filteredRows, fieldMap, 'jobpromisedate', 'JobLocation', formatDateOnly),
    [filteredRows, fieldMap]
  );
  const statusPivot = useMemo(
    () => buildPivot(filteredRows, fieldMap, 'department', 'JobLocation'),
    [filteredRows, fieldMap]
  );
  const departmentPivot = useMemo(
    () => buildPivot(filteredRows, fieldMap, 'jobpromisedate', 'department', formatDateOnly),
    [filteredRows, fieldMap]
  );

  const pickerTheme = useMemo(
    () => createTheme({ palette: { primary: { main: '#6c5ce7' } } }),
    []
  );

  const buildPivotColumns = (rowLabel, colKeys) => [
    { field: 'row', headerName: rowLabel, flex: 1.4, minWidth: 160 },
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
      // Bold the Total column body cells (used by every pivot table — Order
      // Details has no 'total' field, so it's unaffected automatically)
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
      total: pivot.rowTotals[r],
      ...colKeys.reduce((acc, c) => {
        acc[c] = pivot.matrix[r]?.[c] || '';
        return acc;
      }, {}),
    }));

  const buildPivotTotals = (pivot, colKeys = pivot.colKeys) => ({
    total: pivot.grandTotal,
    ...colKeys.reduce((acc, c) => {
      acc[c] = pivot.colTotals[c] || 0;
      return acc;
    }, {}),
  });

  const promise = useMemo(() => {
    const allCols = buildPivotColumns('Promise Date', promisePivot.colKeys);
    const rows = buildPivotRows(promisePivot);
    const columns = filterEmptyColumns(allCols, rows);
    const totals = buildPivotTotals(promisePivot);
    return { columns, rows, totals };
  }, [promisePivot]);

  const status = useMemo(() => {
    const allCols = buildPivotColumns('Current Status', statusPivot.colKeys);
    const rows = buildPivotRows(statusPivot);
    const columns = filterEmptyColumns(allCols, rows);
    const totals = buildPivotTotals(statusPivot);
    return { columns, rows, totals };
  }, [statusPivot]);

  // "Pending Request" is pinned as the 2nd column (right after the Promise
  // Date row label) regardless of natural sort order, and is always kept
  // even if every value in it is empty.
  const department = useMemo(() => {
    const orderedColKeys = reorderPriorityColumn(departmentPivot.colKeys, 'Pending Request');
    const allCols = buildPivotColumns('Promise Date', orderedColKeys);
    const rows = buildPivotRows(departmentPivot, orderedColKeys);
    const columns = filterEmptyColumns(allCols, rows, ['Pending Request']);
    const totals = buildPivotTotals(departmentPivot, orderedColKeys);
    return { columns, rows, totals };
  }, [departmentPivot]);

  /* ---------------- Order Details (uses expstartdate) ---------------- */
  const orderDetails = useMemo(() => {
    return filteredRows
      .map((row, idx) => {
        const promiseRaw = getField(row, fieldMap, 'jobpromisedate');
        const entryRaw = getField(row, fieldMap, 'expstartdate');
        const remDays = computeRemainingDays(row, fieldMap);
  
        // Build the tooltip message based on exactly which date(s) are missing
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
          remainingDaysTooltip,
          location: getField(row, fieldMap, 'JobLocation') || '-',
          custCode: getField(row, fieldMap, 'Customercode') || '-',
          job: getField(row, fieldMap, 'serialjobno') || '-',
          designNo: getField(row, fieldMap, 'Designcode') || '-',
          status: getField(row, fieldMap, 'ProductionStatusName') || '-',
        };
      })
      .sort((a, b) => new Date(b.promiseDateRaw || 0) - new Date(a.promiseDateRaw || 0));
  }, [filteredRows, fieldMap]);

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

  // 'remainingDays' and 'promiseDate' are mandatory — always shown even if
  // every row is '-' for them.
  const orderColumns = useMemo(
    () => filterEmptyColumns(orderColumnsAll, orderDetails, ['remainingDays', 'promiseDate']),
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
                <Box className="filter-chip">
                  <Typography className="filter-chip__label">Date Field</Typography>
                  <Typography className="filter-chip__value">
                    {DATE_FIELD_OPTIONS[0]?.label}
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
                <MultiSelectFilterChip label="Location" value={location} onChange={setLocation} options={locationOptions} />
                <MultiSelectFilterChip
                  label="Customer Code"
                  value={customerCode}
                  onChange={setCustomerCode}
                  options={customerOptions}
                />
                <MultiSelectFilterChip label="Order No." value={orderNo} onChange={setOrderNo} options={orderNoOptions} />
                <FilterChip
                  label="Delivery Status"
                  value={deliveryStatus}
                  onChange={setDeliveryStatus}
                  options={deliveryStatusOptions}
                />
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
              value={stats.diaPcs.toLocaleString()}
              subLabel="Total Diamond"
            />
            <StatCard
              icon={<DiamondOutlinedIcon fontSize="small" />}
              label="DIAMOND WEIGHT"
              value={stats.diaWt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              subLabel="Total Diamond Weight"
              unit="Ct"
            />
          </Box>

          <Box className="wip-mis__pivots">
          <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Order Details"
              dense
              columns={orderColumns}
              rows={orderDetails}
            />
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="WIP Distribution by Location"
              dense
              showTotals
              columns={promise.columns}
              rows={promise.rows}
              totalsRow={promise.totals}
            />
            <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Current Status by Location"
              dense
              showTotals
              columns={status.columns}
              rows={status.rows}
              totalsRow={status.totals}
            />
           
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="Promise Date by Status"
              dense
              showTotals
              columns={department.columns}
              rows={department.rows}
              totalsRow={department.totals}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WIPMis;