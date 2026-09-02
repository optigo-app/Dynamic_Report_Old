// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=100021

import React, { useEffect, useMemo, useState } from 'react';
import { useGridApiRef } from '@mui/x-data-grid';
import { useRef } from 'react';
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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DateRangePicker } from 'mui-daterange-picker';
import { GetWipData } from '../../API/GetWipData/GetWipData';
import './WIPMis.scss';

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
  if (!iso) return 'Unspecified';
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

  rows.forEach((row) => {
    let rVal = getField(row, fieldMap, rowField);
    let cVal = getField(row, fieldMap, colField);

    if (rowFormatter) rVal = rowFormatter(rVal);
    rVal = stripHtml(rVal);
    cVal = stripHtml(cVal);
    if (rVal === undefined || rVal === null || rVal === '') rVal = 'Unspecified';
    if (cVal === undefined || cVal === null || cVal === '') cVal = 'Unspecified';

    matrix[rVal] = matrix[rVal] || {};
    matrix[rVal][cVal] = (matrix[rVal][cVal] || 0) + 1;

    rowTotals[rVal] = (rowTotals[rVal] || 0) + 1;
    colTotals[cVal] = (colTotals[cVal] || 0) + 1;
    grandTotal += 1;
  });

  const rowKeys = Object.keys(rowTotals).sort((a, b) => rowTotals[b] - rowTotals[a]);
  const colKeys = Object.keys(colTotals).sort(naturalSort);

  return { rowKeys, colKeys, matrix, rowTotals, colTotals, grandTotal };
};

/* ---------------------------------------------------------------- */
/* Pagination bar (fully controlled — sits below the totals row)      */
/* ---------------------------------------------------------------- */

const PaginationBar = ({ paginationModel, setPaginationModel, rowCount }) => {
  const { page, pageSize } = paginationModel;
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));

  const [pageInput, setPageInput] = useState(page + 1);
  useEffect(() => setPageInput(page + 1), [page]);

  const startItem = rowCount === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, rowCount);

  const goToPage = (p) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, p));
    setPaginationModel({ page: clamped, pageSize });
  };

  const commitPage = (val) => {
    let v = Number(val);
    if (!Number.isFinite(v) || v < 1) v = 1;
    if (v > pageCount) v = pageCount;
    goToPage(v - 1);
  };

  return (
    <Box className="table-pagination">
      <Box className="table-pagination__group">
        <Typography className="table-pagination__label">Rows per page:</Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(e) => setPaginationModel({ page: 0, pageSize: Number(e.target.value) })}
          className="table-pagination__select"
        >
          {[10, 20, 50, 100].map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box className="table-pagination__group table-pagination__group--center">
        <IconButton size="small" disabled={page === 0} onClick={() => goToPage(0)}>
          <FirstPageIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" disabled={page === 0} onClick={() => goToPage(page - 1)}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <Typography className="table-pagination__label">Page</Typography>
        <input
          className="table-pagination__page-input"
          type="number"
          value={pageInput}
          min={1}
          max={pageCount || 1}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={(e) => commitPage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitPage(e.target.value);
          }}
        />
        <Typography className="table-pagination__label">of {pageCount || 1}</Typography>

        <IconButton size="small" disabled={page >= pageCount - 1} onClick={() => goToPage(page + 1)}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          disabled={page >= pageCount - 1}
          onClick={() => goToPage(pageCount - 1)}
        >
          <LastPageIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className="table-pagination__group table-pagination__group--right">
        <Typography className="table-pagination__display">
          Displaying {startItem} to {endItem} of {rowCount}
        </Typography>
      </Box>
    </Box>
  );
};

/* ---------------------------------------------------------------- */
/* Generic panel wrapping a DataGrid, with an optional pinned         */
/* "Total" summary row that always stays visible above the pager.     */
/* ---------------------------------------------------------------- */

const DataGridPanel = ({
  icon,
  title,
  columns,
  rows,
  dense = false,
  defaultPageSize = 20,
  totalsRow,
  gridHeight,
}) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: defaultPageSize });
  const gridWrapRef = useRef(null);
  const totalsRowRef = useRef(null);

  useEffect(() => {
    setPaginationModel((m) => {
      const pageCount = Math.max(1, Math.ceil(rows.length / m.pageSize));
      return m.page > pageCount - 1 ? { ...m, page: 0 } : m;
    });
  }, [rows.length]);

  // Mirror the grid's real horizontal scroll position onto the pinned totals
  // row. We attach directly to MUI's internal scroller DOM node rather than
  // relying on the apiRef event system, which doesn't fire consistently for
  // horizontal scroll across MUI versions.
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

  return (
    <Paper className={`data-table ${dense ? 'data-table--dense' : ''}`} elevation={0}>
      <Box className="data-table__header">
        {icon}
        <Typography className="data-table__title">{title}</Typography>
      </Box>

      <Box
        className="data-table__grid-wrap"
        ref={gridWrapRef}
        style={gridHeight ? { height: gridHeight } : undefined}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.__key}
          disableColumnMenu
          disableColumnSorting
          disableRowSelectionOnClick
          hideFooter
          rowHeight={dense ? 34 : 40}
          columnHeaderHeight={dense ? 56 : 42}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          className="mis-datagrid"
        />
      </Box>

      {totalsRow && (
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

      <PaginationBar
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        rowCount={rows.length}
      />
    </Paper>
  );
};
/* ---------------------------------------------------------------- */
/* Stat card                                                          */
/* ---------------------------------------------------------------- */

const StatCard = ({ icon, value, label }) => (
  <Paper className="stat-card" elevation={0}>
    <Box className="stat-card__icon">{icon}</Box>
    <Box>
      <Typography className="stat-card__value" style={{ fontWeight: 700 }}>{value}</Typography>
      <Typography className="stat-card__label">{label}</Typography>
    </Box>
  </Paper>
);

/* ---------------------------------------------------------------- */
/* Filter chip (uniform themed dropdown)                              */
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
  { value: 'jobentrydate', label: 'Order Date' },
  { value: 'deliveryBatchDate', label: 'Delivery Date' },
  { value: 'expstartdate', label: 'Exp. Start Date' },
];

const WIPMis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateField, setDateField] = useState('jobpromisedate');
  const [dateRange, setDateRange] = useState({
    startDate: new Date('2025-12-04'),
    endDate: new Date('2026-12-31'),
  });
  const [isAllDates, setIsAllDates] = useState(true);
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
    handleFetchData('2026-01-01', '2026-01-31');
  }, []);

  const rd2 = data?.Data?.rd2 || [{}];
  const rawRows = data?.Data?.rd3 || [];
  const fieldMap = useMemo(() => buildFieldMap(rd2), [rd2]);

  /* ---------------- filter option lists ---------------- */
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
  const deliveryStatusOptions = ['All', 'Scheduled', 'Not Scheduled'];

  /* ---------------- apply filters ---------------- */
  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const loc = getField(row, fieldMap, 'JobLocation');
      const cust = getField(row, fieldMap, 'Customercode');
      const ord = getField(row, fieldMap, 'SKUNO');
      const isDelivery = getField(row, fieldMap, 'isDeliveryBatchJob');

      if (location !== 'All' && loc !== location) return false;
      if (customerCode !== 'All' && cust !== customerCode) return false;
      if (orderNo !== 'All' && ord !== orderNo) return false;

      if (deliveryStatus !== 'All') {
        const scheduled = Number(isDelivery) > 0;
        if (deliveryStatus === 'Scheduled' && !scheduled) return false;
        if (deliveryStatus === 'Not Scheduled' && scheduled) return false;
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

  /* ---------------- stats ---------------- */
  const stats = useMemo(
    () => ({
      pcs: filteredRows.length,
      nwt: sumField(filteredRows, fieldMap, 'NetWtgm'),
      gwt: sumField(filteredRows, fieldMap, 'GrossWeightgm'),
      diaPcs: sumField(filteredRows, fieldMap, 'Diamond_actualusedpcs'),
    }),
    [filteredRows, fieldMap]
  );

  /* ---------------- pivots ---------------- */
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

  const buildPivotColumns = (rowLabel, colKeys) => [
    { field: 'row', headerName: rowLabel, flex: 1.4, minWidth: 160, sortable: false },
    ...colKeys.map((c) => ({
      field: c,
      headerName: c,
      flex: 1,
      minWidth: Math.max(90, c.length * 9), // enough px per character to fit the full label
      align: 'center',
      headerAlign: 'center',
      sortable: false,
    })),
    { field: 'total', headerName: 'Total', flex: 1, minWidth: 90, align: 'center', headerAlign: 'center', sortable: false },
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

  /* ---------------- order details ---------------- */
  const orderDetails = useMemo(() => {
    return filteredRows
      .map((row, idx) => {
        const promiseRaw = getField(row, fieldMap, 'jobpromisedate');
        const entryRaw = getField(row, fieldMap, 'jobentrydate');
        const promiseDate = promiseRaw ? new Date(promiseRaw) : null;
        const entryDate = entryRaw ? new Date(entryRaw) : null;

        let remainingDays = '-';
        if (promiseDate && entryDate && !Number.isNaN(promiseDate.getTime()) && !Number.isNaN(entryDate.getTime())) {
          remainingDays = Math.round((promiseDate - entryDate) / (1000 * 60 * 60 * 24));
        }

        return {
          __key: idx,
          promiseDateRaw: promiseRaw,
          promiseDate: formatDateOnly(promiseRaw),
          remainingDays,
          location: getField(row, fieldMap, 'JobLocation') || '-',
          custCode: getField(row, fieldMap, 'Customercode') || '-',
          job: getField(row, fieldMap, 'serialjobno') || '-',
          designNo: getField(row, fieldMap, 'Designcode') || '-',
          status: getField(row, fieldMap, 'ProductionStatusName') || '-',
        };
      })
      .sort((a, b) => new Date(b.promiseDateRaw || 0) - new Date(a.promiseDateRaw || 0));
  }, [filteredRows, fieldMap]);

  const orderColumns = useMemo(
    () => [
      { field: 'promiseDate', headerName: 'Promise Date', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center' },
      {
        field: 'remainingDays',
        headerName: 'Rem. Days',
        flex: 0.8,
        minWidth: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <span
              className={`remaining-chip ${typeof params.value === 'number' && params.value <= 0
                ? 'remaining-chip--danger'
                : 'remaining-chip--ok'
                }`}

              style={{ display: 'flex' }}
            >
              {params.value}
            </span>
          </Box>
        ),
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

  return (
    <Box className="wip-mis">


      {loading && (
        <Box className="wip-mis__loading" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
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
          {/* ---------------- Toolbar: all filters in a single row ---------------- */}
          <Paper className="toolbar" elevation={0}>
            <Box className="toolbar__filters-row">
              <Box className="toolbar__group toolbar__group--left">
                <Box className="filter-chip">
                  <Typography className="filter-chip__label">Date Field</Typography>
                  <Select
                    size="small"
                    value={dateField}
                    onChange={(e) => setDateField(e.target.value)}
                    className="filter-chip__select"
                  >
                    {DATE_FIELD_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
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
                  {formatDatePretty(dateRange.startDate)} — {formatDatePretty(dateRange.endDate)}
                </Button>

                <Popover
                  open={Boolean(pickerAnchor)}
                  anchorEl={pickerAnchor}
                  onClose={() => setPickerAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{ className: 'date-range-popover' }}
                >
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
                </Popover>

                <Button
                  color="inherit"
                  onClick={() => setIsAllDates(true)}
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
              </Box>
            </Box>
          </Paper>

          {/* ---------------- Stats ---------------- */}
          <Box className="wip-mis__stats">
            <StatCard icon={<Inventory2OutlinedIcon />} value={stats.pcs.toLocaleString()} label="PCs" />
            <StatCard
              icon={<ScaleOutlinedIcon />}
              value={stats.nwt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              label="Nwt."
            />
            <StatCard
              icon={<MonitorWeightOutlinedIcon />}
              value={stats.gwt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              label="Gwt."
            />
            <StatCard icon={<DiamondOutlinedIcon />} value={stats.diaPcs.toLocaleString()} label="Dia. Pcs" />
          </Box>

          {/* ---------------- Pivot tables (side by side, each with a pinned Total row) ---------------- */}
          <Box className="wip-mis__pivots">
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="Promise Date"
              dense
              columns={buildPivotColumns('Promise Date', promisePivot.colKeys)}
              rows={buildPivotRows(promisePivot)}
              totalsRow={buildPivotTotals(promisePivot)}
              defaultPageSize={10}
              gridHeight={360}
            />
            <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Current Status"
              dense
              columns={buildPivotColumns('Current Status', statusPivot.colKeys)}
              rows={buildPivotRows(statusPivot)}
              totalsRow={buildPivotTotals(statusPivot)}
              defaultPageSize={10}
              gridHeight={360}
            />
            <DataGridPanel
              icon={<Inventory2Icon fontSize="small" />}
              title="Order Details"
              dense
              columns={orderColumns}
              rows={orderDetails}
              defaultPageSize={10}
              gridHeight={360}
            />
            <DataGridPanel
              icon={<EventNoteOutlinedIcon fontSize="small" />}
              title="Promise Date by Status"
              dense
              columns={buildPivotColumns('Promise Date', departmentPivot.colKeys)}
              rows={buildPivotRows(departmentPivot)}
              totalsRow={buildPivotTotals(departmentPivot)}
              defaultPageSize={10}
              gridHeight={360}
            />
          </Box>


        </Box>
      )}
    </Box>
  );
};

export default WIPMis;