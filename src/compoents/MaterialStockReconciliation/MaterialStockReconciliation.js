// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18618
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  ButtonBase,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  Chip,
  CircularProgress,
  Autocomplete,
  TablePagination,
  createFilterOptions,
  Divider,
  IconButton,
  Popover,
  Drawer,
  Dialog,
  Badge,
  ThemeProvider,
  Tooltip,
  Tabs,
  Tab,
  createTheme,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TuneIcon from "@mui/icons-material/Tune";
import { keyframes } from "@emotion/react";
import { getMasterMaterialData, GetmaterialWiseData } from "../../API/GetRmBulkReconcilationData/GetRmBulkReconcilationData";


/* ========================================================================
   COLOR TOKENS  (single source of truth — used everywhere via sx)
   ===================================================================== */
const COLORS = {
  purple: "#6C3FC5",
  purpleDark: "#542F9E",
  purpleLight: "#F1ECFB",
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  surfaceMuted: "#FAFAFD",
  text: "#1E1B2E",
  textMuted: "#6B6478",
  success: "#1B8A5A",
  successBg: "#E6F6EE",
  danger: "#D64545",
  dangerBg: "#FDECEC",
  warning: "#C77A1F",
  warningBg: "#FBF0E2",
  border: "#E7E5F0",
};
const scanLineMove = keyframes`
  0%   { top: 6%; opacity: 0; }
  10%  { opacity: 1; }
  50%  { top: 94%; opacity: 1; }
  60%  { opacity: 0; }
  100% { top: 6%; opacity: 0; }
`;

const iconPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.08); opacity: 0.85; }
`;

const framePulse = (color) => keyframes`
  0%, 100% { box-shadow: 0 0 0 0 ${color}55; }
  50%      { box-shadow: 0 0 0 8px ${color}00; }
`;

const theme = createTheme({
  palette: {
    primary: { main: COLORS.purple, dark: COLORS.purpleDark, light: COLORS.purpleLight },
    success: { main: COLORS.success },
    error: { main: COLORS.danger },
    warning: { main: COLORS.warning },
    background: { default: COLORS.bg },
    text: { primary: COLORS.text, secondary: COLORS.textMuted },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `"Public Sans", "Poppins", sans-serif`,
  },
});

/* ========================================================================
   REUSABLE SX FRAGMENTS
   ===================================================================== */
const cardSx = {
  bgcolor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  p: 2.5,
  mb: 2.5,
};

const panelTitleSx = { fontSize: 15, fontWeight: 600, color: "#6c3fc5", mb: 1.75 };

const hintSx = { fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, my: 0.75 };

const hintInlineSx = {
  ...hintSx,
  bgcolor: COLORS.purpleLight,
  borderRadius: "8px",
  px: 1.5,
  py: 1.25,
  m: 0,
};

const primaryBtnSx = {
  bgcolor: COLORS.purple,
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "8px",
  py: 1.1,
  boxShadow: "none",
  "&:hover": { bgcolor: COLORS.purpleDark, boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#D9D3EC", color: "#fff" },
};

const outlineBtnSx = {
  borderColor: COLORS.purple,
  color: COLORS.purple,
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "8px",
  py: 1.1,
  "&:hover": { borderColor: COLORS.purpleDark, bgcolor: COLORS.purpleLight },
};

const chipSx = { bgcolor: COLORS.purpleLight, color: COLORS.purpleDark, fontWeight: 500 };
const chipSuccessSx = { bgcolor: COLORS.successBg, color: COLORS.success, fontWeight: 600 };
const chipDangerSx = { bgcolor: COLORS.dangerBg, color: COLORS.danger, fontWeight: 600 };
const chipWarningSx = { bgcolor: COLORS.warningBg, color: COLORS.warning, fontWeight: 600 };

const tableContainerSx = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  maxHeight: 320,
};

const theadCellSx = {
  fontSize: 11,
  fontWeight: 700,
  color: COLORS.textMuted,
  bgcolor: COLORS.surfaceMuted,
  whiteSpace: "nowrap",
};

const tbodyCellSx = { fontSize: 13, whiteSpace: "nowrap" };
const linkCellSx = { ...tbodyCellSx, color: COLORS.purple, fontWeight: 600 };

const fieldSx = { mb: 1.75 };

/* ========================================================================
   API HELPERS
   - toArray:      accepts either a plain array or a wrapped response
   - normalizeRow: maps ONE API row (GetmaterialWiseData) to the field names
                   the rest of this screen already uses. If your API returns
                   different field names for Diamond / Color Stone / Mount /
                   Finding, adjust ONLY this function.
   ===================================================================== */
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.Data)) return res.Data;
  return [];
};

const normalizeRow = (r, materialName, index) => ({
  ...r, // keep every original API field available
  id: r.id ?? index,
  itemname: materialName, // data is fetched per material, so this always matches the selection
  rfbag: r.rfbag ?? "",
  MaterialType: r.MaterialType ?? r.typename ?? "",
  shape: r.shape ?? r.shapename ?? "",
  quality: r.quality ?? r.qualityname ?? r.purity ?? "",
  color: r.color ?? r.colorname ?? "",
  size: r.size ?? r.itemsize ?? "",
  supplier: r.supplier ?? r.suppliername ?? "",
  Mountcategoryname: r.Mountcategoryname ?? r.mountcategoryname ?? "",
  findingAccessories: r.findingAccessories ?? r.findingaccessories ?? "",
  findingtypename: r.findingtypename ?? "",
  Locker: r.Locker ?? r.LockerName ?? "",
  TotalRemainingPcs: Number(r.TotalRemainingPcs) || 0,
  TotalRemainingWeight: Number(r.TotalRemainingWeight) || 0,
  istoreCust_Customercode: r.istoreCust_Customercode ?? "",
});

/* ========================================================================
   FILTER CONFIG (keys are UPPERCASE to match API item names)
   ===================================================================== */
const DIAMOND_GROUP = ["DIAMOND", "COLOR STONE", "MISC"];

const FILTER_CONFIG = {
  diamondGroup: [
    { key: "materialtype", label: "Material Type", dataKey: "typename" },
    { key: "shape", label: "Shape", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "Quality" },
    { key: "color", label: "Color", dataKey: "colorname" },
    { key: "size", label: "Size", dataKey: "size" },
    // { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lotno", label: "Lot No.", dataKey: "lotNo" },
  ],
  METAL: [
    { key: "materialtype", label: "Metal Type", dataKey: "MaterialType" },
    // { key: "type", label: "Type", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
  ],
  MOUNT: [
    { key: "category", label: "Category", dataKey: "Mountcategoryname" },
    { key: "type", label: "Type", dataKey: "typename" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
    // { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lot", label: "Lot", dataKey: "lotNo" },
  ],
  FINDING: [
    { key: "ftype", label: "F.Type", dataKey: "findingtypename" },
    { key: "accessories", label: "Accessories", dataKey: "findingAccessories" },
    // { key: "type", label: "Type", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
    // { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lot", label: "Lot", dataKey: "lotNo" },
  ],
};

/* NEW: filters shown for EVERY material */
const COMMON_FILTERS = [
  { key: "customer", label: "Customer", dataKey: "istoreCust_Customercode" },
];

function getFilterConfig(material) {
  if (!material) return [];
  const key = String(material).toUpperCase();
  const specific = DIAMOND_GROUP.includes(key)
    ? FILTER_CONFIG.diamondGroup
    : FILTER_CONFIG[key] || [];
  return [...COMMON_FILTERS, ...specific];
}

const uniq = (arr) => [...new Set(arr.filter((v) => v !== undefined && v !== null && v !== ""))];
const fmt = (n, d = 3) => (Number.isFinite(n) ? n.toFixed(d) : (0).toFixed(d));
const nowStamp = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/* CHANGE: both builders now receive the API data as the first argument
   (instead of reading a global RAW_DATA constant). */
function buildSummary(data, loc, mat, subs) {
  // loc and every subs[key] are ARRAYS of selected values (empty = All)
  const lockers = [].concat(loc || []);
  const base = data.filter(
    (r) => (!lockers.length || lockers.includes(r.Locker)) && (!mat || r.itemname === mat)
  );
  const cfg = getFilterConfig(mat);
  const rows = base.filter((r) =>
    cfg.every((f) => {
      const sel = subs[f.key];
      return !sel || !sel.length || sel.includes(r[f.dataKey]);
    })
  );
  const bags = rows.length;
  const pieces = rows.reduce((s, r) => s + (Number(r.TotalRemainingPcs) || 0), 0);
  const weight = rows.reduce((s, r) => s + (Number(r.TotalRemainingWeight) || 0), 0);
  return { bags, pieces, weight, rows, material: mat, locker: lockers, subFilters: { ...subs } };
}

/* Build one combined summary from EVERY scanned Job / Lot No. (rfbag).
   Rows for all scanned codes are grouped together — this is what "scan
   mode" shows once the user clicks the "Scan" button, instead of the
   filter-built summary.

   Rows are restricted to the material selected on the landing
   page — a bag number only counts if it belongs to that material. */
function buildSummaryFromScanCodes(data, codes, mat) {
  const uniqueCodes = uniq(codes);
  const codeSet = new Set(uniqueCodes);
  const rows = data.filter(
    (r) => codeSet.has(r.rfbag) && (!mat || r.itemname === mat)
  );
  // One scanned Job/Lot No. = one bag, even if that bag's rfbag appears on
  // several item rows (e.g. Metal + Mount + Finding under the same bag).
  // Pieces/weight still sum every matching row; bags counts scanned jobs.
  const bags = uniqueCodes.length;
  const pieces = rows.reduce((s, r) => s + (Number(r.TotalRemainingPcs) || 0), 0);
  const weight = rows.reduce((s, r) => s + (Number(r.TotalRemainingWeight) || 0), 0);
  const materials = uniq(rows.map((r) => r.itemname));
  return {
    bags,
    pieces,
    weight,
    rows,
    material: mat || (materials.length === 1 ? materials[0] : "Scanned Items"),
    locker: rows[0]?.Locker || "",
    subFilters: { lotno: uniqueCodes.join(", ") },
  };
}

function ResultLine({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1,
        borderBottom: `1px dashed ${COLORS.border}`,
      }}
    >
      <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

/* ========================================================================
   LANDING PAGE
   Material dropdown on top + two entry points (Criteria Wise / Scan RM Bag)
   + tolerance settings.
   ===================================================================== */
function LandingActionCard({ icon, title, description, onClick, variant = "primary", disabled = false, loading = false }) {
  const isPrimary = variant === "primary";
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        width: "100%",
        p: 3,
        borderRadius: "16px",
        border: `1px solid ${isPrimary ? "transparent" : COLORS.border}`,
        background: isPrimary
          ? `linear-gradient(135deg, ${COLORS.purple} 0%, #8A5CE0 100%)`
          : COLORS.surface,
        color: isPrimary ? "#fff" : COLORS.text,
        boxShadow: isPrimary
          ? "0 10px 28px rgba(108,63,197,0.28)"
          : "0 4px 16px rgba(30,27,46,0.06)",
        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        opacity: disabled && !loading ? 0.5 : 1,
        "&:hover": disabled
          ? {}
          : {
            transform: "translateY(-4px)",
            boxShadow: isPrimary
              ? "0 16px 34px rgba(108,63,197,0.38)"
              : "0 12px 28px rgba(108,63,197,0.16)",
            borderColor: isPrimary ? "transparent" : COLORS.purple,
          },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2.5,
          bgcolor: isPrimary ? "rgba(255,255,255,0.2)" : COLORS.purpleLight,
          color: isPrimary ? "#fff" : COLORS.purple,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 0.75 }}>{title}</Typography>
      <Typography
        sx={{
          fontSize: 13,
          lineHeight: 1.6,
          mb: 2.5,
          color: isPrimary ? "rgba(255,255,255,0.85)" : COLORS.textMuted,
        }}
      >
        {description}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          mt: "auto",
          fontSize: 13,
          fontWeight: 600,
          color: isPrimary ? "#fff" : COLORS.purple,
        }}
      >
        {loading ? (
          <>
            <CircularProgress size={16} thickness={5} sx={{ color: isPrimary ? "#fff" : COLORS.purple }} />
            Loading data...
          </>
        ) : (
          <>
            Continue <ArrowForwardIcon sx={{ fontSize: 18 }} />
          </>
        )}
      </Box>
    </ButtonBase>
  );
}

function LandingPage({
  onSystemData,
  onScanBarcode,
  toleranceMetal,
  setToleranceMetal,
  toleranceOther,
  setToleranceOther,
  material,
  onMaterialChange,
  materialOptions,
  pendingAction, // NEW: 'filter' | 'scan' | null — card clicked, waiting for API data
}) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 5,
        px: 2,
        borderRadius: "20px",
        background: `radial-gradient(1200px 500px at 50% -10%, ${COLORS.purpleLight} 0%, ${COLORS.bg} 65%)`,
      }}
    >
      {/* Heading */}
      <Box sx={{ textAlign: "center", mb: 4.5, maxWidth: 560 }}>
        <Typography sx={{ fontSize: 28, fontWeight: 800, color: COLORS.text, mb: 1 }}>
          Material Stock Reconciliation
        </Typography>
        <Typography sx={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7 }}>
          Choose how you want to start — browse system stock using filters, or scan
          barcodes to reconcile specific RM Bag.
        </Typography>
      </Box>

      {/* NEW: Material dropdown — sits above the two entry cards */}

      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          p: 3,
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          bgcolor: COLORS.surface,
          boxShadow: "0 4px 16px rgba(30,27,46,0.05)",
          maxWidth: 720, mb: 3
        }}


      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: COLORS.purpleLight,
              color: COLORS.purple,
            }}
          >
            <FilterListIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
              Selecet Material
            </Typography>
          </Box>
        </Box>
        <FormControl fullWidth size="small" sx={{ bgcolor: COLORS.surface, borderRadius: "8px" }}>
          <InputLabel>Material</InputLabel>
          <Select
            label="Material"
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
          >
            {materialOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* {!material && (
          <Typography sx={{...hintSx,color:"red"}}>Select a material to continue.</Typography>
        )} */}
      </Box>

      {/* Two entry cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          width: "100%",
          maxWidth: 720,
          mb: 3,
        }}
      >
        <LandingActionCard
          variant="outline"
          disabled={!material || (!!pendingAction && pendingAction !== "filter")}
          loading={pendingAction === "filter"}
          icon={<Inventory2OutlinedIcon sx={{ fontSize: 30 }} />}
          title="Criteria Wise RM Reconciliation "
          description="Browse stock from the system by Locker, Material, Shape, Quality and more, then reconcile."
          onClick={onSystemData}
        />
        <LandingActionCard
          variant="outline"
          disabled={!material || (!!pendingAction && pendingAction !== "scan")}
          loading={pendingAction === "scan"}
          icon={<QrCodeScannerIcon sx={{ fontSize: 30 }} />}
          title="Scan RM Bag to Reconciliation"
          description="Scan or paste one or many Bag numbers and reconcile them together in one go."
          onClick={onScanBarcode}
        />
      </Box>

      {/* Tolerance settings */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 720,
          p: 3,
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          bgcolor: COLORS.surface,
          boxShadow: "0 4px 16px rgba(30,27,46,0.05)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: COLORS.purpleLight,
              color: COLORS.purple,
            }}
          >
            <TuneIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
              Tolerance Settings
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Metal Tolerance"
            size="small"
            type="number"
            fullWidth
            value={toleranceMetal}
            onChange={(e) => setToleranceMetal(Number(e.target.value))}
            inputProps={{ step: 0.001, min: 0 }}
            InputProps={{
              endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography>,
            }}
          />
          <TextField
            label="Other Material Tolerance"
            size="small"
            type="number"
            fullWidth
            value={toleranceOther}
            onChange={(e) => setToleranceOther(Number(e.target.value))}
            inputProps={{ step: 0.001, min: 0 }}
            InputProps={{
              endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>ct/gm</Typography>,
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

/* ========================================================================
   Shared filter fields — used inside the left Drawer (Criteria Wise
   mode). CHANGE: Material is now fixed (selected on the landing page)
   and shown disabled. The other filters stay material-wise as before.
   ===================================================================== */
/* PERF: lists with many options use a searchable Autocomplete that renders
   only the first 100 matches (type to narrow). Small lists keep the normal Select. */
const limitedFilter = createFilterOptions({ limit: 100 });

function FilterField({ label, value, options, onChange }) {
  // keep already-selected values visible even if the other filters narrowed the list
  const allOptions = useMemo(() => uniq([...value, ...options]), [value, options]);
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      size="small"
      sx={fieldSx}
      options={allOptions}
      value={value}
      onChange={(e, v) => onChange(v)}
      filterOptions={limitedFilter}
      limitTags={2}
      noOptionsText="No options"
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        return (
          <li key={key ?? option} {...rest}>
            <Checkbox size="small" checked={selected} sx={{ p: 0.5, mr: 1 }} />
            {option}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={value.length ? "" : "All"} />
      )}
    />
  );
}

function FilterPanelContent({
  locker,
  setLocker,
  lockerOptions,
  material,
  onMaterialChange,
  materialOptions,
  filterConfig,
  subFilters,
  onSubFilterChange,
  optionsFor,
  activeFilterCount,
  onClear,
  onSearch,
  onClose,
}) {
  return (
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ ...panelTitleSx, mb: 0 }}>Filters</Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <FilterField
        label="Locker"
        value={locker}
        options={lockerOptions}
        onChange={(val) => setLocker(val)}
      />

      {/* Material — selected on landing page, locked here */}
      <FormControl fullWidth size="small" sx={fieldSx} disabled>
        <InputLabel>Material</InputLabel>
        <Select
          label="Material"
          value={material}
          disabled
          onChange={(e) => onMaterialChange(e.target.value)}
        >
          {materialOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {filterConfig.length > 0 && <Divider sx={{ my: 1.5 }} />}

      {filterConfig.map((f) => (
        <FilterField
          key={f.key}
          label={f.label}
          value={subFilters[f.key] || []}
          options={optionsFor(f.dataKey)}
          onChange={(val) => onSubFilterChange(f.key, val)}
        />
      ))}

      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ClearAllIcon />}
          sx={outlineBtnSx}
          onClick={onClear}
          disabled={activeFilterCount === 0}
        >
          Clear
        </Button>
        <Button fullWidth variant="contained" startIcon={<SearchIcon />} sx={primaryBtnSx} onClick={onSearch}>
          Search
        </Button>
      </Box>
    </Box>
  );
}

/* ========================================================================
   Scan panel — the "Scan RM Bag to Reconciliation" drawer. Scanned Job
   No.'s are shown as small deletable chips instead of a modal list.
   CHANGE: shows the selected material, and a bag is VALID only if it
   belongs to that material.
   ===================================================================== */
function ScanPanelContent({
  scanInput,
  setScanInput,
  onKeyDown,
  onAdd,
  scannedCodes,
  validScannedCodes,
  invalidScannedCodes,
  onRemove,
  onClearAll,
  onScan,
  onClose,
  material,
}) {
  const isValid = (code) => validScannedCodes.includes(code);

  return (
    <Box sx={{ p: 2.5, width: 520 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ ...panelTitleSx, mb: 0 }}>Scan RM Bag</Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box
        sx={{
          position: "relative",
          width: 90,
          height: 90,
          mx: "auto",          // centered
          mb: 2.5,             // space before the input field
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* corner brackets — only the outer corner is rounded */}
        {[
          { top: 0, left: 0, borderWidth: "3px 0 0 3px", borderTopLeftRadius: "8px" },
          { top: 0, right: 0, borderWidth: "3px 3px 0 0", borderTopRightRadius: "8px" },
          { bottom: 0, left: 0, borderWidth: "0 0 3px 3px", borderBottomLeftRadius: "8px" },
          { bottom: 0, right: 0, borderWidth: "0 3px 3px 0", borderBottomRightRadius: "8px" },
        ].map((pos, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: 22,
              height: 22,
              borderStyle: "solid",
              borderColor: "#6d5efc",
              ...pos,
            }}
          />
        ))}

        {/* moving scan line — gradient with faded ends, kept inside the brackets */}
        <Box
          sx={{
            position: "absolute",
            left: "14%",
            width: "72%",
            height: 2,
            borderRadius: 1,
            background:
              "linear-gradient(90deg, transparent 0%, #6d5efc 20%, #6d5efc 80%, transparent 100%)",
            boxShadow: "0 0 8px 2px rgba(109,94,252,0.45)",
            animation: `${scanLineMove} 1.8s ease-in-out infinite`,
          }}
        />

        <QrCodeScannerIcon
          sx={{
            fontSize: 42,
            color: "#6d5efc",
            animation: `${iconPulse} 1.8s ease-in-out infinite`,
          }}
        />
      </Box>

      {/* Selected material (fixed) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Material:</Typography>
        <Chip label={material} size="small" sx={chipSx} />
      </Box>

      <TextField
        autoFocus
        fullWidth
        multiline
        minRows={3}
        size="small"
        placeholder="Scan or type RM Bag No.'s — e.g. 0000005845 0000005846"
        value={scanInput}
        onChange={(e) => setScanInput(e.target.value)}
        onKeyDown={onKeyDown}
        sx={{ mb: 1 }}
      />
      <Button
        size="small"
        variant="outlined"
        sx={{ ...outlineBtnSx, py: 0.5, mb: 2 }}
        onClick={onAdd}
        disabled={!scanInput.trim()}
      >
        Add
      </Button>

      <Divider sx={{ mb: 1.75 }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>
          Scanned RM Bag ({scannedCodes.length})
        </Typography>
        {scannedCodes.length > 0 && (
          <Button
            size="small"
            startIcon={<DeleteOutlineIcon fontSize="small" />}
            onClick={onClearAll}
            sx={{ textTransform: "none", color: COLORS.textMuted, fontSize: 12, p: 0, minWidth: 0 }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {scannedCodes.length === 0 ? (
        <Typography sx={hintInlineSx}>No items scanned yet.</Typography>
      ) : (
        <>


          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
            <Box sx={{ bgcolor: COLORS.successBg, borderRadius: "8px", px: 1.5, py: 1.25 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.success }}>VALID</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: COLORS.success }}>
                {validScannedCodes.length}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: COLORS.dangerBg, borderRadius: "8px", px: 1.5, py: 1.25 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.danger }}>INVALID</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: COLORS.danger }}>
                {invalidScannedCodes.length}
              </Typography>
            </Box>
          </Box>

          {invalidScannedCodes.length > 0 && (
            <Typography sx={{ ...hintSx, color: COLORS.danger, mb: 1.5 }}>
              Invalid bags don't exist or don't belong to the selected material ({material}).
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            // startIcon={<QrCodeScannerIcon />}
            sx={primaryBtnSx}
            onClick={onScan}
            disabled={validScannedCodes.length === 0}
          >
            Proceed to Reconciliation
          </Button>
        </>
      )}
    </Box>
  );
}

/* ========================================================================
   COMPONENT
   ===================================================================== */
export default function MaterialStockReconciliation() {
  const [mode, setMode] = useState("initial");

  /* ---- API data ---- */
  const [materialList, setMaterialList] = useState([]); // from getMasterMaterialData()
  const [rawData, setRawData] = useState([]);           // from GetmaterialWiseData(materialId)
  const [dataLoading, setDataLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'filter' | 'scan' | null

  const [locker, setLocker] = useState([]); // multi-select
  const [material, setMaterial] = useState("");
  const [subFilters, setSubFilters] = useState({});

  const [filterOpen, setFilterOpen] = useState(false);

  const [stockSummary, setStockSummary] = useState(null);

  const [scanDrawerOpen, setScanDrawerOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scannedCodes, setScannedCodes] = useState([]);

  const [scanInfoOpen, setScanInfoOpen] = useState(false);

  const [grossWeight, setGrossWeight] = useState("");
  const [trayWeight, setTrayWeight] = useState("");
  const [stickerWeight, setStickerWeight] = useState("");
  const [polytheneWeight, setPolytheneWeight] = useState("");
  const [remarks, setRemarks] = useState("");
  const [result, setResult] = useState(null);

  const [toleranceMetal, setToleranceMetal] = useState(0.02);
  const [toleranceOther, setToleranceOther] = useState(0.01);
  const [tolAnchor, setTolAnchor] = useState(null);

  const [history, setHistory] = useState([]);
  const [reconciledIds, setReconciledIds] = useState(new Set());

  const [historyTab, setHistoryTab] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(25);

  /* ------------------------------------------------------------------- */
  /* Load the material master list once */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMasterMaterialData();
        if (!cancelled) setMaterialList(toArray(res));
      } catch (err) {
        console.error("getMasterMaterialData failed:", err);
        if (!cancelled) setMaterialList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Load material-wise data whenever the selected material changes */
  useEffect(() => {
    if (!material) {
      setRawData([]);
      setDataLoading(false);
      return;
    }
    const selected = materialList.find((m) => m.itemname === material);
    if (!selected) return;

    let cancelled = false;
    setDataLoading(true);
    setRawData([]);
    (async () => {
      try {
        const res = await GetmaterialWiseData(selected.itemid);
        if (!cancelled) {
          setRawData(toArray(res).map((r, i) => normalizeRow(r, material, i)));
        }
      } catch (err) {
        console.error("GetmaterialWiseData failed:", err);
        if (!cancelled) setRawData([]);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [material, materialList]);

  const lockerOptions = useMemo(() => uniq(rawData.map((r) => r.Locker)), [rawData]);
  const materialOptions = useMemo(
    () => uniq(materialList.map((m) => m.itemname)),
    [materialList]
  );

  const baseFiltered = useMemo(
    () =>
      rawData.filter(
        (r) => (!locker.length || locker.includes(r.Locker)) && (!material || r.itemname === material)
      ),
    [rawData, locker, material]
  );

  const filterConfig = useMemo(() => getFilterConfig(material), [material]);

  // PERF: compute every dropdown's option list once per data/locker change
  const optionsMap = useMemo(() => {
    const m = {};
    filterConfig.forEach((f) => {
      m[f.dataKey] = uniq(baseFiltered.map((r) => r[f.dataKey]));
    });
    return m;
  }, [baseFiltered, filterConfig]);

  const optionsFor = useCallback((dataKey) => optionsMap[dataKey] || [], [optionsMap]);

  const handleMaterialChange = (val) => {
    setPendingAction(null);
    setMaterial(val);
    setSubFilters({});
  };

  const handleSubFilterChange = (key, val) => {
    setSubFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleSearchSummary = () => {
    setStockSummary(buildSummary(rawData, locker, material, subFilters));
    setResult(null);
    setFilterOpen(false);
    setMode("filter");
  };

  const handleClearFilters = () => {
    setLocker([]);
    setSubFilters({});
  };

  const activeFilterCount =
    (locker.length ? 1 : 0) + Object.values(subFilters).filter((v) => v && v.length).length;

  const doOpenSystemData = () => {
    handleClearFilters();
    setStockSummary(null);
    setResult(null);
    setFilterOpen(true);
    setMode("filter");
  };

  const doOpenScanFlow = () => {
    setScanInput("");
    setScannedCodes([]);
    setStockSummary(null);
    setResult(null);
    setScanInfoOpen(false);
    setScanDrawerOpen(true);
    setMode("scan");
  };

  /* Card click: if data is still loading, stay on the landing page (card shows
     a spinner) and redirect automatically as soon as the API data arrives. */
  const handleOpenSystemData = () => {
    if (!material || pendingAction) return;
    if (dataLoading) {
      setPendingAction("filter");
      return;
    }
    doOpenSystemData();
  };

  const handleOpenScanFlow = () => {
    if (!material || pendingAction) return;
    if (dataLoading) {
      setPendingAction("scan");
      return;
    }
    doOpenScanFlow();
  };

  useEffect(() => {
    if (!pendingAction || dataLoading) return;
    if (pendingAction === "filter") doOpenSystemData();
    else doOpenScanFlow();
    setPendingAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, dataLoading]);

  const parseAndAddScannedCodes = () => {
    const parts = scanInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setScannedCodes((prev) => {
      const merged = [...prev];
      parts.forEach((code) => {
        if (!merged.includes(code)) merged.push(code);
      });
      return merged;
    });
    setScanInput("");
  };

  const handleScanKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      parseAndAddScannedCodes();
    }
  };

  const handleRemoveScanned = (code) => {
    setScannedCodes((prev) => prev.filter((c) => c !== code));
  };

  const bagSet = useMemo(
    () => new Set(rawData.filter((r) => r.itemname === material).map((r) => r.rfbag)),
    [rawData, material]
  );
  const validScannedCodes = useMemo(
    () => scannedCodes.filter((code) => bagSet.has(code)),
    [scannedCodes, bagSet]
  );
  const invalidScannedCodes = useMemo(
    () => scannedCodes.filter((code) => !bagSet.has(code)),
    [scannedCodes, bagSet]
  );

  const handleScanAndView = () => {
    if (validScannedCodes.length === 0) return;
    setStockSummary(buildSummaryFromScanCodes(rawData, validScannedCodes, material));
    setResult(null);
    setScanDrawerOpen(false);
  };
  useEffect(() => {
    if (mode !== "scan") return;
    setStockSummary((prevSummary) => {
      if (!prevSummary) return prevSummary;
      if (validScannedCodes.length === 0) return null;
      return buildSummaryFromScanCodes(rawData, validScannedCodes, material);
    });


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedCodes]);

  useEffect(() => {
    if (validScannedCodes.length === 0) setScanInfoOpen(false);
  }, [validScannedCodes.length]);

  const goToStart = () => {
    setMode("initial");
    setStockSummary(null);
    setResult(null);
    setFilterOpen(false);
    setScanDrawerOpen(false);
    setScanInfoOpen(false);
  };

  /* ---- physical measurement calculations ---- */
  const totalBags = stockSummary?.bags || 0;
  const stickerTotal = totalBags * (Number(stickerWeight) || 0);
  const polytheneTotal = totalBags * (Number(polytheneWeight) || 0);
  const trayTotal = 1 * (Number(trayWeight) || 0);
  const deduction = stickerTotal + polytheneTotal + trayTotal;
  const netWeightLive = (Number(grossWeight) || 0) - deduction;

  const applicableTolerance = String(material).toUpperCase() === "METAL" ? toleranceMetal : toleranceOther;
  const toleranceLabel = String(material).toUpperCase() === "METAL" ? "Metal" : "Other Material";

  const handleReconcile = () => {
    if (!stockSummary || grossWeight === "") return;
    const physicalNet = netWeightLive;
    const difference = physicalNet - stockSummary.weight;
    const withinTolerance = Math.abs(difference) <= applicableTolerance;
    setResult({
      systemWeight: stockSummary.weight,
      grossWeight: Number(grossWeight) || 0,
      trayWeight: Number(trayWeight) || 0,
      stickerWeight: Number(stickerWeight) || 0,
      polytheneWeight: Number(polytheneWeight) || 0,
      physicalNet,
      difference,
      tolerance: applicableTolerance,
      status: withinTolerance ? "ACCEPT" : "REJECT",
      message: withinTolerance
        ? "Within Tolerance — Reconcile successfully"
        : "Out of Tolerance — Reconcile Rejected",
    });
  };

  const handleSaveReconciliation = () => {
    if (!result) return;

    const batchId = Date.now();
    const dateTime = nowStamp();

    // one history record per bag (row), not one bulk record
    const bagRecords = stockSummary.rows.map((r) => ({
      id: `${batchId}-${r.id}`,
      rowId: r.id, // NEW: links this record back to its bag row
      dateTime,
      user: "Admin",
      rmBag: r.rfbag,
      material: r.itemname,
      shape: r.shape || "—",
      size: r.size || "—",
      lotNo: r.rfbag,
      systemWeight: Number(r.TotalRemainingWeight) || 0,
      totalPieces: Number(r.TotalRemainingPcs) || 0,
      totalBags: 1,
      status: result.status,
      remarks,
      reconciledBy: r.istoreCust_Customercode || "—",

      grossWeight: result.grossWeight,
      stickerWeight: result.stickerWeight,
      polytheneWeight: result.polytheneWeight,
      trayWeight: result.trayWeight,
      physicalNet: result.physicalNet,
      difference: result.difference,
      tolerance: result.tolerance,
    }));

    setHistory((prev) => [...bagRecords, ...prev]);
    setReconciledIds((prev) => {
      const next = new Set(prev);
      stockSummary.rows.forEach((r) => next.add(r.id));
      return next;
    });

    setGrossWeight("");
    setTrayWeight("");
    setStickerWeight("");
    setPolytheneWeight("");
    setRemarks("");
    setResult(null);
    setStockSummary(null);
  };

  const handleDownloadRecord = (r) => {
    const rows = [
      ["Date & Time", r.dateTime],
      ["User", r.user],
      ["Material", r.material],
      ["Lot No", r.lotNo],
      ["Total Bags", r.totalBags],
      ["Total Pieces", r.totalPieces],
      ["System Weight (gm)", fmt(r.systemWeight)],
      ["Gross Weight (gm)", fmt(r.grossWeight)],
      ["Sticker Weight (gm)", fmt(r.stickerWeight)],
      ["Polythene Weight (gm)", fmt(r.polytheneWeight)],
      ["Tray/Box Weight (gm)", fmt(r.trayWeight)],
      ["Physical Net Weight (gm)", fmt(r.physicalNet)],
      ["Difference (gm)", fmt(r.difference)],
      ["Tolerance (gm)", fmt(r.tolerance)],
      ["Result", r.status],
      ["Remarks", r.remarks || ""],
    ];
    const csv = rows
      .map(([k, v]) => `"${k}","${String(v).replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reconciliation_${r.id}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const summaryChips = useMemo(() => {
    if (!stockSummary) return [];
    const chips = [];
    [].concat(stockSummary.locker || []).forEach((v) => v && chips.push(v));
    if (stockSummary.material) chips.push(stockSummary.material);
    Object.values(stockSummary.subFilters || {}).forEach((v) =>
      [].concat(v || []).forEach((x) => x && chips.push(x))
    );
    chips.push(`${stockSummary.bags} Bags`);
    chips.push(`${stockSummary.pieces} Pcs`);
    return chips;
  }, [stockSummary]);

  const showWorkspace = mode === "filter" || mode === "scan";
  const showSummaryBlock = showWorkspace && !!stockSummary;
  const showHistoryBlock = mode === "filter" || mode === "scan" || mode === "history";

  const todayDateStr = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  /* NEW: which bags are listed in the history table.
     - Criteria Wise mode -> every bag of the selected material
     - Scan mode          -> every valid scanned bag */
  const historyBaseRows = useMemo(() => {
    if (!material) return [];
    if (mode === "scan") {
      return rawData.filter(
        (r) => r.itemname === material && validScannedCodes.includes(r.rfbag)
      );
    }
    return rawData.filter((r) => r.itemname === material);
  }, [mode, material, validScannedCodes, rawData]);

  /* NEW: merge each listed bag with its latest saved reconciliation (if any).
     `history` is newest-first, so the first match is the latest. */
  const historyRows = useMemo(
    () => {
      // PERF: newest record per bag, built once (history is newest-first)
      const latest = new Map();
      history.forEach((h) => {
        if (!latest.has(h.rowId)) latest.set(h.rowId, h);
      });
      return historyBaseRows.map((r) => {
        const rec = latest.get(r.id);
        return {
          key: r.id,
          dateTime: rec ? rec.dateTime : "—",
          rmBag: r.rfbag,
          material: r.itemname,
          shape: r.shape || "—",
          size: r.size || "—",
          lotNo: r.lotNo,
          systemWeight: Number(r.TotalRemainingWeight) || 0,
          // reconciled: !!rec && rec.status === "ACCEPT",
          status: !rec ? "PENDING" : rec.status === "ACCEPT" ? "DONE" : "REJECTED",
          remarks: rec ? rec.remarks : "",
          reconciledBy: r.istoreCust_Customercode || "—",
          doneToday: !!rec && rec.dateTime.startsWith(todayDateStr),
        };
      });
    },
    [historyBaseRows, history, todayDateStr]
  );

  const todaysHistory = useMemo(
    () => historyRows.filter((h) => h.doneToday),
    [historyRows]
  );
  const historyRowsToShow = historyTab === 0 ? historyRows : todaysHistory;

  // PERF: render only one page of history rows instead of thousands at once
  const pagedHistoryRows = useMemo(
    () =>
      historyRowsToShow.slice(
        historyPage * historyRowsPerPage,
        historyPage * historyRowsPerPage + historyRowsPerPage
      ),
    [historyRowsToShow, historyPage, historyRowsPerPage]
  );

  useEffect(() => {
    setHistoryPage(0);
  }, [historyTab, mode, material, validScannedCodes.length]);

  /* ----------------------------------------------------------------- */
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          minHeight: "100vh",
          bgcolor: COLORS.bg,
          color: COLORS.text,
          "*": { boxSizing: "border-box" },
        }}
      >
        {/* ================= FILTER DRAWER (Criteria Wise mode) ================= */}
        {mode === "filter" && (
          <Drawer
            anchor="left"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            PaperProps={{ sx: { width: 380, bgcolor: COLORS.bg } }}
          >
            <FilterPanelContent
              locker={locker}
              setLocker={setLocker}
              lockerOptions={lockerOptions}
              material={material}
              onMaterialChange={handleMaterialChange}
              materialOptions={materialOptions}
              filterConfig={filterConfig}
              subFilters={subFilters}
              onSubFilterChange={handleSubFilterChange}
              optionsFor={optionsFor}
              activeFilterCount={activeFilterCount}
              onClear={handleClearFilters}
              onSearch={handleSearchSummary}
              onClose={() => setFilterOpen(false)}
            />
          </Drawer>
        )}

        {/* ================= SCAN DRAWER (Scan RM Bag mode) ================= */}
        {mode === "scan" && (
          <Drawer
            anchor="left"
            open={scanDrawerOpen}
            onClose={() => setScanDrawerOpen(false)}
            PaperProps={{ sx: { width: 520, bgcolor: COLORS.bg } }}
          >
            <ScanPanelContent
              scanInput={scanInput}
              setScanInput={setScanInput}
              onKeyDown={handleScanKeyDown}
              onAdd={parseAndAddScannedCodes}
              scannedCodes={scannedCodes}
              validScannedCodes={validScannedCodes}
              invalidScannedCodes={invalidScannedCodes}
              onRemove={handleRemoveScanned}
              onClearAll={() => setScannedCodes([])}
              onScan={handleScanAndView}
              onClose={() => setScanDrawerOpen(false)}
              material={material}
            />
          </Drawer>
        )}

        {/* ================= SCANNED JOBS INFO MODAL (Scan RM Bag mode) ================= */}
        {mode === "scan" && (
          <Dialog
            open={scanInfoOpen}
            onClose={() => setScanInfoOpen(false)}
            maxWidth={false}
            PaperProps={{
              sx: {
                width: 500,
                height: 300,
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "calc(100vh - 32px)",
                m: 2,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.25,
                borderBottom: `1px solid ${COLORS.border}`,
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#6c3fc5" }}>
                Scanned RM Bag No. ({validScannedCodes.length})
              </Typography>
              <IconButton size="small" onClick={() => setScanInfoOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 1,
                  width: "100%",
                }}
              >
                {validScannedCodes.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    size="small"
                    sx={{ ...chipSx, flexShrink: 0 }}
                  />
                ))}
              </Box>
            </Box>
          </Dialog>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <Box sx={{ flex: 1, minWidth: 0, p: 1.5, pt: 1 }}>
          {mode === "initial" && (
            <LandingPage
              onSystemData={handleOpenSystemData}
              onScanBarcode={handleOpenScanFlow}
              toleranceMetal={toleranceMetal}
              setToleranceMetal={setToleranceMetal}
              toleranceOther={toleranceOther}
              setToleranceOther={setToleranceOther}
              material={material}
              onMaterialChange={handleMaterialChange}
              materialOptions={materialOptions}
              pendingAction={pendingAction}
            />
          )}

          {mode !== "initial" && (
            <Tooltip title="Back" arrow>
              <IconButton
                onClick={goToStart}
                aria-label="Back"
                sx={{
                  width: 38,
                  height: 38,
                  mb: 0.5,
                  ml: 0.5,
                  color: COLORS.purple,
                  bgcolor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: "0 2px 6px rgba(30,27,46,0.06)",
                  "&:hover": { bgcolor: COLORS.purpleLight, borderColor: COLORS.purple },
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {mode !== "initial" && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", mb: 1, gap: 1.5, marginLeft: "6px", flexWrap: "wrap" }}>
              {mode === "filter" && (
                <Badge color="error" badgeContent={activeFilterCount} invisible={activeFilterCount === 0}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    sx={outlineBtnSx}
                    onClick={() => setFilterOpen(true)}
                  >
                    Filters
                  </Button>
                </Badge>
              )}

              {mode === "scan" && (
                <Badge color="error" badgeContent={scannedCodes.length} invisible={scannedCodes.length === 0}>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScannerIcon />}
                    sx={outlineBtnSx}
                    onClick={() => setScanDrawerOpen(true)}
                  >
                    Scan RM Bags
                  </Button>
                </Badge>
              )}

              <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                {mode === "scan" ? "" : "Material Stock Reconciliation"}
              </Typography>

              {mode === "scan" && validScannedCodes.length > 0 && (
                <Tooltip title="View scanned Job No.'s" arrow>
                  <IconButton
                    onClick={() => setScanInfoOpen(true)}
                    aria-label="View scanned Job No.'s"
                    sx={{
                      width: 38,
                      height: 38,
                      color: COLORS.purple,
                      bgcolor: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      boxShadow: "0 2px 6px rgba(30,27,46,0.06)",
                      "&:hover": { bgcolor: COLORS.purpleLight, borderColor: COLORS.purple },
                    }}
                  >
                    <Badge color="primary" badgeContent={validScannedCodes.length} max={999}>
                      <InfoOutlinedIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}

          {showSummaryBlock && (
            <>
              <Paper
                elevation={0}
                sx={{
                  ...cardSx,
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "#fff",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#6c3fc5" }}>
                    System Stock Summary
                  </Typography>
                  {mode !== "scan" && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "flex-end" }}>
                      {summaryChips.map((c, i) => (
                        <Chip key={i} label={c} size="small" sx={{ ...chipSx, backgroundColor: "#f3f4f6", fontWeight: 500 }} />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                    gap: 2.5,
                    mb: 2.5,
                  }}
                >
                  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "#6c3fc5", backgroundColor: "#ffffff", borderLeft: "4px solid #6c3fc5" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>TOTAL RM BAGS</Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 1, color: COLORS.text }}>
                      {stockSummary ? stockSummary.bags : "—"}
                    </Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "#6c3fc5", backgroundColor: "#ffffff", borderLeft: "4px solid #6c3fc5" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>TOTAL PIECES</Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 1, color: COLORS.text }}>
                      {stockSummary ? stockSummary.pieces : "—"}
                    </Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "#6c3fc5", borderLeft: "4px solid #6c3fc5", backgroundColor: "#ffffff" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>SYSTEM WEIGHT</Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 1 }}>
                      <Typography sx={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>
                        {stockSummary ? fmt(stockSummary.weight) : "—"}
                      </Typography>
                      {stockSummary && (
                        <Typography component="span" sx={{ fontSize: 16, color: COLORS.textMuted, fontWeight: 600 }}>
                          gm
                        </Typography>
                      )}
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ ...cardSx, p: 2, border: "1px solid", borderColor: "#6c3fc5", borderLeft: "4px solid #6c3fc5", backgroundColor: "#ffffff", mb: 0, width: "100%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Today's Reconciliations</Typography>
                      <Chip label="44" size="small" sx={{ backgroundColor: "#f3f4f6", fontWeight: 700, color: COLORS.text, borderRadius: 2 }} />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Passed</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.success }}>35</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Failed</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.danger }}>2</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Pending</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.warning }}>7</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </Paper>

              {/* Physical Measurement + Reconciliation Result */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 2.5, alignItems: "stretch" }}>
                <Paper sx={{ ...cardSx, mb: 0, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                    <Typography sx={{ ...panelTitleSx, mb: 0 }}>Physical Measurement</Typography>
                  </Box>

                  <TextField
                    label="Enter Total Weight"
                    required
                    fullWidth
                    size="small"
                    type="number"
                    sx={fieldSx}
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                  />

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 1.75 }}>
                    <TextField
                      label="Tray/Box Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      value={trayWeight}
                      onChange={(e) => setTrayWeight(e.target.value)}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                    <TextField
                      label=" Single Sticker Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      value={stickerWeight}
                      onChange={(e) => setStickerWeight(e.target.value)}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                    <TextField
                      label="Single Polythene Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      value={polytheneWeight}
                      onChange={(e) => setPolytheneWeight(e.target.value)}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                  </Box>

                  <Typography sx={hintSx}>
                    Total Bags: <b>{totalBags}</b> · Sticker Total: <b>{fmt(stickerTotal)}</b> gm · Polythene
                    Total: <b>{fmt(polytheneTotal)}</b> gm · Tray/Box: <b>{fmt(trayTotal)}</b> gm
                  </Typography>
                  <Typography sx={hintSx}>
                    Net Weight: <b>{fmt(netWeightLive)} gm</b>
                  </Typography>

                  <TextField
                    label="Remarks"
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    sx={fieldSx}
                    placeholder="Enter remarks (optional)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ ...outlineBtnSx, mt: "auto" }}
                    onClick={handleReconcile}
                    disabled={!stockSummary || grossWeight === ""}
                  >
                    Reconcile
                  </Button>
                </Paper>

                <Paper sx={{ ...cardSx, mb: 0, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                    <Typography sx={{ ...panelTitleSx, mb: 0 }}>Reconciliation Result</Typography>
                    <IconButton size="small" onClick={(e) => setTolAnchor(e.currentTarget)}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Popover
                    open={Boolean(tolAnchor)}
                    anchorEl={tolAnchor}
                    onClose={() => setTolAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  >
                    <Box sx={{ p: 2, width: 220 }}>
                      <Typography sx={panelTitleSx}>Existing Tolerance</Typography>
                      <TextField
                        label="Metal (gm)"
                        size="small"
                        type="number"
                        fullWidth
                        disabled
                        sx={fieldSx}
                        value={toleranceMetal}
                        onChange={(e) => setToleranceMetal(Number(e.target.value))}
                      />
                      <TextField
                        label="Other Material (ct/gm)"
                        size="small"
                        type="number"
                        disabled
                        fullWidth
                        sx={{ mb: 0 }}
                        value={toleranceOther}
                        onChange={(e) => setToleranceOther(Number(e.target.value))}
                      />
                    </Box>
                  </Popover>

                  {result ? (
                    <>
                      <ResultLine label="System Weight" value={`${fmt(result.systemWeight)} gm`} />
                      <ResultLine label="Physical Weight" value={`${fmt(result.physicalNet)} gm`} />
                      <ResultLine label="Difference" value={`${result.difference >= 0 ? "+" : ""}${fmt(result.difference)} gm`} />
                      <ResultLine label={`Allowed Tolerance (${toleranceLabel})`} value={`±${fmt(result.tolerance)} gm`} />

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderRadius: "8px",
                          px: 1.75,
                          py: 1.5,
                          my: 2,
                          bgcolor: result.status === "ACCEPT" ? COLORS.successBg : COLORS.dangerBg,
                          color: result.status === "ACCEPT" ? COLORS.success : COLORS.danger,
                        }}
                      >
                        {result.status === "ACCEPT" ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{result.message}</Typography>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{ ...primaryBtnSx, mt: "auto" }}
                        onClick={handleSaveReconciliation}
                      >
                        Save Reconciliation
                      </Button>
                    </>
                  ) : (
                    <Typography sx={hintInlineSx}>
                      Enter the physical weights and click "Reconcile" to see the comparison against
                      system weight.
                    </Typography>
                  )}
                </Paper>
              </Box>
            </>
          )}

          {/* Reconciliation History — all bags (criteria: material bags, scan: scanned bags) */}
          {showHistoryBlock && (
            <Paper sx={cardSx} elevation={0}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1 }}>
                <Typography sx={{ ...panelTitleSx, mb: 0 }}>Reconciliation History</Typography>
              </Box>

              <Tabs
                value={historyTab}
                onChange={(e, val) => setHistoryTab(val)}
                sx={{
                  minHeight: 36,
                  mb: 1.5,
                  borderBottom: `1px solid ${COLORS.border}`,
                  "& .MuiTabs-indicator": { backgroundColor: COLORS.purple },
                }}
              >
                <Tab
                  label={`History${historyRows.length ? ` (${historyRows.length})` : ""}`}
                  sx={{
                    minHeight: 36,
                    textTransform: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                    "&.Mui-selected": { color: COLORS.purple },
                  }}
                />
                <Tab
                  label={`Today's Reconciliation${todaysHistory.length ? ` (${todaysHistory.length})` : ""}`}
                  sx={{
                    minHeight: 36,
                    textTransform: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                    "&.Mui-selected": { color: COLORS.purple },
                  }}
                />
              </Tabs>

              <TableContainer sx={tableContainerSx}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={theadCellSx}>Date &amp; Time</TableCell>
                      <TableCell sx={theadCellSx}>RM Bag</TableCell>
                      <TableCell sx={theadCellSx}>Material</TableCell>
                      <TableCell sx={theadCellSx}>Shape</TableCell>
                      <TableCell sx={theadCellSx}>Size</TableCell>
                      <TableCell sx={theadCellSx}>Lot No</TableCell>
                      <TableCell sx={theadCellSx} align="right">System Weight</TableCell>
                      <TableCell sx={theadCellSx}>Status</TableCell>
                      <TableCell sx={theadCellSx}>Remarks</TableCell>
                      <TableCell sx={theadCellSx}>Reconciliation By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyRowsToShow.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ color: COLORS.textMuted, py: 3 }}>
                          {historyTab === 0
                            ? mode === "scan"
                              ? "No scanned bags yet."
                              : "No bags found for this material."
                            : "No reconciliations done today yet."}
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedHistoryRows.map((h) => (
                      <TableRow key={h.key}>
                        <TableCell sx={tbodyCellSx}>{h.dateTime}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.rmBag}</TableCell>
                        <TableCell sx={linkCellSx}>{h.material}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.shape}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.size}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.lotNo}</TableCell>
                        <TableCell sx={tbodyCellSx} align="right">{fmt(h.systemWeight)}</TableCell>
                        <TableCell sx={tbodyCellSx}>
                          <Chip
                            size="small"
                            label={
                              h.status === "DONE" ? "Done" : h.status === "REJECTED" ? "Rejected" : "Pending"
                            }
                            sx={
                              h.status === "DONE"
                                ? chipSuccessSx
                                : h.status === "REJECTED"
                                  ? chipDangerSx
                                  : chipWarningSx
                            }
                          />
                        </TableCell>
                        <TableCell sx={tbodyCellSx}>{h.remarks || "—"}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.reconciledBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={historyRowsToShow.length}
                page={Math.min(historyPage, Math.max(0, Math.ceil(historyRowsToShow.length / historyRowsPerPage) - 1))}
                onPageChange={(e, p) => setHistoryPage(p)}
                rowsPerPage={historyRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setHistoryRowsPerPage(Number(e.target.value));
                  setHistoryPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}