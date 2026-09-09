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

/* ---------------------------------------------------------------- */
/* Generic panel wrapping a DataGrid                                  */
/* ---------------------------------------------------------------- */

const DataGridPanel = ({
  icon,
  title,
  columns,
  rows,
  dense = false,
  showTotals = false,
  totalsRow,
  gridHeight,
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
        style={gridHeight ? { height: gridHeight } : undefined}
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
        />
      </Box>

      {showTotals && totalsRow && (
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
/* Filter chip                                                        */
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
/* Main component                                                     */
/* ---------------------------------------------------------------- */

const DATE_FIELD_OPTIONS = [
  { value: 'jobpromisedate', label: 'Promise Date' },
];

const WIPMis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateField, setDateField] = useState('jobpromisedate');
  // Default to THIS month instead of last month / a fixed hardcoded range
  const [dateRange, setDateRange] = useState(() => getThisMonthRange());
  const [isAllDates, setIsAllDates] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState(null);

  const [location, setLocation] = useState('All');
  const [customerCode, setCustomerCode] = useState('All');
  const [orderNo, setOrderNo] = useState('All');
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

  const buildOptions = (fieldName) => {
    const set = new Set();
    rawRows.forEach((r) => {
      const v = getField(r, fieldMap, fieldName);
      if (v) set.add(v);
    });
    return ['All', ...[...set].sort()];
  };

  const locationOptions = useMemo(() => buildOptions('JobLocation'), [rawRows, fieldMap]);
  const customerOptions = useMemo(() => buildOptions('Customercode'), [rawRows, fieldMap]);
  const orderNoOptions = useMemo(() => buildOptions('SKUNO'), [rawRows, fieldMap]);

  // Delivery Status now reflects remaining-days health, not isDeliveryBatchJob
  const deliveryStatusOptions = ['All', 'On Time', 'Delayed'];

  /* ---------------- ALL button handler ---------------- */
  const handleSelectAllDates = () => {
    setIsAllDates(true);
    setPickerAnchor(null);
  };

  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const loc = getField(row, fieldMap, 'JobLocation');
      const cust = getField(row, fieldMap, 'Customercode');
      const ord = getField(row, fieldMap, 'SKUNO');

      if (location !== 'All' && loc !== location) return false;
      if (customerCode !== 'All' && cust !== customerCode) return false;
      if (orderNo !== 'All' && ord !== orderNo) return false;

      if (deliveryStatus !== 'All') {
        const remDays = computeRemainingDays(row, fieldMap);
        const isOnTime = typeof remDays === 'number' && remDays > 0;
        const isDeclined = typeof remDays === 'number' && remDays <= 0;
        if (deliveryStatus === 'On Time' && !isOnTime) return false;
        if (deliveryStatus === 'Delayed' && !isDeclined) return false;
      }

      if (!isAllDates && dateRange.startDate && dateRange.endDate) {
        const raw = getField(row, fieldMap, dateField);
        if (raw) {
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) {
            if (d < dateRange.startDate || d > dateRange.endDate) return false;
          }
        }
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

  const buildPivotRows = (pivot) =>
    pivot.rowKeys.map((r) => ({
      __key: r,
      row: r,
      total: pivot.rowTotals[r],
      ...pivot.colKeys.reduce((acc, c) => {
        acc[c] = pivot.matrix[r]?.[c] || '';
        return acc;
      }, {}),
    }));

  const buildPivotTotals = (pivot) => ({
    total: pivot.grandTotal,
    ...pivot.colKeys.reduce((acc, c) => {
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

  const department = useMemo(() => {
    const allCols = buildPivotColumns('Promise Date', departmentPivot.colKeys);
    const rows = buildPivotRows(departmentPivot);
    const columns = filterEmptyColumns(allCols, rows);
    const totals = buildPivotTotals(departmentPivot);
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

  // 'remainingDays' is mandatory — always shown even if every row is '-'
  const orderColumns = useMemo(
    () => filterEmptyColumns(orderColumnsAll, orderDetails, ['remainingDays']),
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
                  onClick={(e) => setPickerAnchor(e.currentTarget)}
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
                      initialDateRange={dateRange}
                      onChange={(range) => {
                        setDateRange(range);
                        setIsAllDates(false);
                        setPickerAnchor(null);
                      }}
                    />
                  </ThemeProvider>
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
                <FilterChip label="Location" value={location} onChange={setLocation} options={locationOptions} />
                <FilterChip
                  label="Customer Code"
                  value={customerCode}
                  onChange={setCustomerCode}
                  options={customerOptions}
                />
                <FilterChip label="Order No." value={orderNo} onChange={setOrderNo} options={orderNoOptions} />
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
          </Box>

          <Box className="wip-mis__pivots">
          <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Order Details"
              dense
              columns={orderColumns}
              rows={orderDetails}
              gridHeight={360}
            />
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="WIP Distribution by Location"
              dense
              showTotals
              columns={promise.columns}
              rows={promise.rows}
              totalsRow={promise.totals}
              gridHeight={360}
            />
            <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Current Status by Location"
              dense
              showTotals
              columns={status.columns}
              rows={status.rows}
              totalsRow={status.totals}
              gridHeight={360}
            />
           
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="Promise Date by Status"
              dense
              showTotals
              columns={department.columns}
              rows={department.rows}
              totalsRow={department.totals}
              gridHeight={360}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WIPMis;