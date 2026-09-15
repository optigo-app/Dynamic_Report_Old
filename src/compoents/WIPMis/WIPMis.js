// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=123456

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
  Drawer,
  Divider,
  Badge,
  Pagination,
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
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { DateRangePicker } from 'mui-daterange-picker';
import * as XLSX from 'xlsx';
import { GetWipData } from '../../API/GetWipData/GetWipData';
import './WIPMis.scss';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

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

// Formats a KPI value as "D:<value>" and appends " S:<value>" only when a
// solitaire figure is present and non-zero — never shows "S:0".
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
/* Dynamic grid height                                                */
/*                                                                    */
/* Instead of computing a pixel-exact height in JS (rowHeight *       */
/* rowCount + headerHeight...) — which drifts from MUI's REAL layout  */
/* the moment a header wraps to 2 lines, a border adds a px, etc, and */
/* was showing a scrollbar even exactly AT 10 rows — the grid is now  */
/* given the `autoHeight` prop so it sizes itself to its true content */
/* height. The wrapping Box only applies a generous `maxHeight`       */
/* CEILING (not a forced height): pages with ≤10 rows are always      */
/* shorter than the ceiling, so they're never clipped or scrolled;    */
/* pages with more (page size 20/50) exceed it and scroll exactly     */
/* where real content — not our estimate — crosses that line.         */
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

// A generous ceiling for "MAX_VISIBLE_ROWS rows' worth of height" — err on
// the taller side on purpose. Because DataGrid sizes itself naturally
// (autoHeight) and we only clip once real content crosses this ceiling,
// a generous buffer here can only ever delay the scrollbar showing up a
// little later than 10 rows on the dot — it can never cause a false
// scrollbar/clip at exactly 10 rows the way a tight, forced height did.
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
}) => {
  const gridWrapRef = useRef(null);
  const totalsRowRef = useRef(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Whenever the underlying data set changes (filters change, refresh,
  // etc.) jump back to page 1 instead of leaving the user stranded on a
  // page that may no longer exist.
  useEffect(() => {
    setPage(1);
  }, [rows]);

  // Changing the page size also resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Footer (page-size selector + info + page numbers) shows once there are
  // more records than the smallest page-size option.
  const showFooter = rows.length > PAGE_SIZE_OPTIONS[0];
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows =
    rows.length > pageSize ? rows.slice((safePage - 1) * pageSize, safePage * pageSize) : rows;

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  // Totals row reflects ONLY the rows on the current page — so page 1's
  // total is different from page 2's, and different again from the "all
  // dates" grand total, instead of always showing the full-dataset sum.
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

  // Ceiling only — see computeGridMaxHeight comment above. isOverflowing
  // is just an approximation for the optional CSS hook; the actual
  // clip/scroll decision is made by the browser comparing the DataGrid's
  // real autoHeight content against this maxHeight, not by this flag.
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
    <Typography className="stat-card__value" style={{fontWeight: 'bold'}}>
      {value} {unit !="Ct" ? ` ${unit}` : ''}
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
/* Order No. / Current Status / Metal Type. Empty selection === "All" */
/* (within the active date range). Selections are summarised as plain */
/* text ("3 selected") instead of individual removable chips, and the */
/* single built-in "x" clears the whole selection at once.            */
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

// NOTE: adjust these to whatever the actual API field names are if they
// differ — they follow the same naming pattern as "Diamond_actualusedpcs".
const DIAMOND_WEIGHT_FIELD = 'Diamond_actualusedgm';
const SOLITAIRE_PCS_FIELD = 'solitairepcs';
const SOLITAIRE_WEIGHT_FIELD = 'solitairewt';

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

  // ---- Applied filters (actually used to filter the tables) ----
  const [location, setLocation] = useState([]); // [] === All
  const [customerCode, setCustomerCode] = useState([]); // [] === All
  const [orderNo, setOrderNo] = useState([]); // [] === All
  const [deliveryStatus, setDeliveryStatus] = useState('All');
  const [currentStatusFilter, setCurrentStatusFilter] = useState([]); // [] === All — filters by "Current Status" (department)
  const [metalType, setMetalType] = useState([]); // [] === All — filters by "Metal Type"

  // ---- Filter drawer ----
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // Staged copies edited inside the drawer — only committed to the applied
  // filters above when the user presses "Apply".
  const [stagingLocation, setStagingLocation] = useState([]);
  const [stagingCustomerCode, setStagingCustomerCode] = useState([]);
  const [stagingOrderNo, setStagingOrderNo] = useState([]);
  const [stagingDeliveryStatus, setStagingDeliveryStatus] = useState('All');
  const [stagingCurrentStatus, setStagingCurrentStatus] = useState([]);
  const [stagingMetalType, setStagingMetalType] = useState([]);

  const openFilterDrawer = () => {
    setStagingLocation(location);
    setStagingCustomerCode(customerCode);
    setStagingOrderNo(orderNo);
    setStagingDeliveryStatus(deliveryStatus);
    setStagingCurrentStatus(currentStatusFilter);
    setStagingMetalType(metalType);
    setFilterDrawerOpen(true);
  };

  // Closing without "Apply" (backdrop click / back arrow) discards any
  // unsaved edits made inside the drawer.
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const handleClearFilters = () => {
    setStagingLocation([]);
    setStagingCustomerCode([]);
    setStagingOrderNo([]);
    setStagingDeliveryStatus('All');
    setStagingCurrentStatus([]);
    setStagingMetalType([]);
  };

  const handleApplyFilters = () => {
    setLocation(stagingLocation);
    setCustomerCode(stagingCustomerCode);
    setOrderNo(stagingOrderNo);
    setDeliveryStatus(stagingDeliveryStatus);
    setCurrentStatusFilter(stagingCurrentStatus);
    setMetalType(stagingMetalType);
    setFilterDrawerOpen(false);
  };

  const activeFilterCount =
    (location.length > 0 ? 1 : 0) +
    (customerCode.length > 0 ? 1 : 0) +
    (orderNo.length > 0 ? 1 : 0) +
    (deliveryStatus !== 'All' ? 1 : 0) +
    (currentStatusFilter.length > 0 ? 1 : 0) +
    (metalType.length > 0 ? 1 : 0);

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
  // Selecting "All" dates also clears every active filter, so the user
  // gets a truly unfiltered, all-time view in one click.
  const handleSelectAllDates = () => {
    setIsAllDates(true);
    setPickerAnchor(null);

    setLocation([]);
    setCustomerCode([]);
    setOrderNo([]);
    setDeliveryStatus('All');
    setCurrentStatusFilter([]);
    setMetalType([]);

    // Keep the drawer's staged copies in sync too, in case it's opened next.
    setStagingLocation([]);
    setStagingCustomerCode([]);
    setStagingOrderNo([]);
    setStagingDeliveryStatus('All');
    setStagingCurrentStatus([]);
    setStagingMetalType([]);
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
  // Customer Code / Order No. / Delivery Status / Current Status / Metal
  // Type). The dropdown OPTIONS are built from this set, so they only ever
  // list values that actually exist within the selected date range — since
  // the date picker is the primary filter and the table is date-driven,
  // there's no point offering options that don't apply to any row in the
  // current window.
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

  // Build all dropdown option lists in a single pass over dateFilteredRows
  // (instead of separate full scans) so opening any of the filter
  // dropdowns is fast even on larger datasets.
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

  const locationOptions = filterOptionSets.location;
  const customerOptions = filterOptionSets.customer;
  const orderNoOptions = filterOptionSets.orderNo;
  const currentStatusOptions = filterOptionSets.currentStatus;
  const metalTypeOptions = filterOptionSets.metalType;

  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const loc = getField(row, fieldMap, 'JobLocation');
      const cust = getField(row, fieldMap, 'Customercode');
      const ord = getField(row, fieldMap, 'SKUNO');

      if (location.length > 0 && !location.includes(loc)) return false;
      if (customerCode.length > 0 && !customerCode.includes(cust)) return false;
      if (orderNo.length > 0 && !orderNo.includes(ord)) return false;

      if (currentStatusFilter.length > 0) {
        const dept = stripHtml(getField(row, fieldMap, 'department'));
        if (!currentStatusFilter.includes(dept)) return false;
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
  }, [
    rawRows,
    fieldMap,
    location,
    customerCode,
    orderNo,
    currentStatusFilter,
    metalType,
    deliveryStatus,
    isAllDates,
    dateRange,
    dateField,
  ]);

  const stats = useMemo(
    () => ({
      pcs: filteredRows.length,
      nwt: sumField(filteredRows, fieldMap, 'NetWtgm'),
      gwt: sumField(filteredRows, fieldMap, 'GrossWeightgm'),
      diaPcs: sumField(filteredRows, fieldMap, 'Diamond_actualusedpcs'),
      solPcs: sumField(filteredRows, fieldMap, SOLITAIRE_PCS_FIELD),
      diaWt: sumField(filteredRows, fieldMap, DIAMOND_WEIGHT_FIELD),
      solWt: sumField(filteredRows, fieldMap, SOLITAIRE_WEIGHT_FIELD),
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
              <Tooltip title="Filters">
                  <IconButton
                    className="wip-mis__filter-btn"
                    onClick={openFilterDrawer}
                    size="small"
                    title="Filters"
                  >
                    <Badge
                      badgeContent={activeFilterCount}
                      color="primary"
                      invisible={activeFilterCount === 0}
                    >
                      <FilterListIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Box className=" ">
                  {/* <Typography className="filter-chip__label">Date Field</Typography> */}
                  <Typography className="filter-chip__value" sx={{fontWeight:"bold"}}>
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
              value={formatDiamondSolitaire(stats.diaPcs, stats.solPcs, 0," ")}
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
            />
            <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Current Status by Location"
              dense
              showTotals
              columns={status.columns}
              rows={status.rows}
            />
           
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="Promise Date by Status"
              dense
              showTotals
              columns={department.columns}
              rows={department.rows}
            />
          </Box>
        </Box>
      )}

      {/* ---------------- Left-side filter drawer ---------------- */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={closeFilterDrawer}
        PaperProps={{ className: 'filter-drawer' }}
      >
        <Box className="filter-drawer__header">
          <Box className="filter-drawer__header-left">
            <IconButton size="small" className="filter-drawer__back-btn" onClick={closeFilterDrawer}>
              <KeyboardArrowLeftIcon fontSize="small" />
            </IconButton>
            <Typography className="filter-drawer__title">Filters</Typography>
          </Box>

          <Box className="filter-drawer__header-actions">
            <Button
              size="small"
              color="inherit"
              startIcon={<FilterAltOffOutlinedIcon fontSize="small" />}
              onClick={handleClearFilters}
              className="filter-drawer__clear-btn"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<FilterAltOutlinedIcon fontSize="small" />}
              onClick={handleApplyFilters}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '20px',
                background: '#6c5ce7',
                '&:hover': { background: '#5a4bd6' },
              }}
            >
              Apply
            </Button>
          </Box>
        </Box>
        <Divider />

        <Box className="filter-drawer__body">
          <Box className="filter-drawer__field">
            <MultiSelectFilterChip
              label="Location"
              value={stagingLocation}
              onChange={setStagingLocation}
              options={locationOptions}
            />
          </Box>
          <Box className="filter-drawer__field">
            <MultiSelectFilterChip
              label="Customer Code"
              value={stagingCustomerCode}
              onChange={setStagingCustomerCode}
              options={customerOptions}
            />
          </Box>
          <Box className="filter-drawer__field">
            <MultiSelectFilterChip
              label="Order No."
              value={stagingOrderNo}
              onChange={setStagingOrderNo}
              options={orderNoOptions}
            />
          </Box>
          <Box className="filter-drawer__field">
            <MultiSelectFilterChip
              label="Current Status"
              value={stagingCurrentStatus}
              onChange={setStagingCurrentStatus}
              options={currentStatusOptions}
            />
          </Box>
          <Box className="filter-drawer__field">
            <MultiSelectFilterChip
              label="Metal Type"
              value={stagingMetalType}
              onChange={setStagingMetalType}
              options={metalTypeOptions}
            />
          </Box>
          <Box className="filter-drawer__field">
            <FilterChip
              label="Delivery Status"
              value={stagingDeliveryStatus}
              onChange={setStagingDeliveryStatus}
              options={deliveryStatusOptions}
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default WIPMis;