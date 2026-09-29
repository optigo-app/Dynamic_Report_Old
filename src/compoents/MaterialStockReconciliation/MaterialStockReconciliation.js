// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18618
import React, { useMemo, useState, useCallback } from "react";
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
  Chip,
  Divider,
  IconButton,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Badge,
  ThemeProvider,
  Tooltip,
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
   DUMMY DATA
   ===================================================================== */
const RAW_DATA = [
  {
    itemname: "DIAMOND", rfbag: "0000005799", MaterialType: "Labgrown", master_item_id: 3,
    Mountcategoryname: "", supplier: "Customer", shape: "ASSCHER", quality: "RJ01",
    color: "RED-S", size: "1.55 mm", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "Polki", TotalRemainingPcs: 2,
    TotalRemainingWeight: 4, Locker: "Locker1", certno: "DIADIA", certurl: "", inscription: "DIADIA",
    salerate: 10, length: "12", width: "11", depth: "10", depth_per: 15, table_per: 15,
    cutname: "round cut", polishname: "Good", symmetryname: "Good", gridlename: "Extremely Thin",
    fluorescencename: "Faint", culetname: "Very Small", labname: "IGI",
  },
  {
    itemname: "DIAMOND", rfbag: "0000005801", MaterialType: "Natural", master_item_id: 3,
    Mountcategoryname: "", supplier: "Company", shape: "Baguatte", quality: "check2",
    color: "A1", size: "1.70 mm", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "Polki", TotalRemainingPcs: 2,
    TotalRemainingWeight: 4, Locker: "Locker1", certno: "sasasas", certurl: "chatgpt.com",
    inscription: "sasasas", salerate: 100, length: "11", width: "12", depth: "17",
    depth_per: 12, table_per: 12, cutname: "Oval Cut", polishname: "Poor", symmetryname: "Good",
    gridlename: "Extremely Thin", fluorescencename: "Very Strong", culetname: "Large", labname: "LAB1",
  },
  {
    itemname: "DIAMOND", rfbag: "0000005802", MaterialType: "", master_item_id: 3,
    Mountcategoryname: "", supplier: "Manufacturer", shape: "A style 1", quality: "VVS1-M",
    color: "RED-S", size: "5.5-5.9", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "", TotalRemainingPcs: 2,
    TotalRemainingWeight: 4, Locker: "Locker1", certno: "", certurl: "", inscription: "",
    salerate: 0, length: "", width: "", depth: "", depth_per: 0, table_per: 0, cutname: "",
    polishname: "", symmetryname: "", gridlename: "", fluorescencename: "", culetname: "", labname: "",
  },
  {
    itemname: "DIAMOND", rfbag: "0000005806", MaterialType: "Labgrown", master_item_id: 3,
    Mountcategoryname: "", supplier: "Manufacturer", shape: "ABCD", quality: "VVS1-M",
    color: "RED-S", size: "C:2", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "", TotalRemainingPcs: 12,
    TotalRemainingWeight: 12.5, Locker: "Locker1", certno: "", certurl: "", inscription: "",
    salerate: 40.5, length: "", width: "", depth: "", depth_per: 0, table_per: 0, cutname: "",
    polishname: "", symmetryname: "", gridlename: "", fluorescencename: "", culetname: "", labname: "",
  },
  {
    itemname: "Colorstone", rfbag: "0000005812", master_item_id: 3, MaterialType: "",
    Mountcategoryname: "", supplier: "Company", shape: "ABCD", quality: "VVS1-M",
    color: "RED-S", size: "C:2", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "", TotalRemainingPcs: 12,
    TotalRemainingWeight: 12.5, Locker: "Locker1", certno: "", certurl: "", inscription: "",
    salerate: 40.5, length: "", width: "", depth: "", depth_per: 0, table_per: 0, cutname: "",
    polishname: "", symmetryname: "", gridlename: "", fluorescencename: "", culetname: "", labname: "",
  },
  {
    itemname: "Metal", rfbag: "0000005845", MaterialType: "Gold", master_item_id: 3,
    Mountcategoryname: "", supplier: "Customer", shape: "ALLOY", quality: "18k",
    color: "Ayellow", size: "71.000", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "", TotalRemainingPcs: 12,
    TotalRemainingWeight: 12.5, Locker: "Locker1", certno: "", certurl: "", inscription: "",
    salerate: 40.5, length: "", width: "", depth: "", depth_per: 0, table_per: 0, cutname: "",
    polishname: "", symmetryname: "", gridlename: "", fluorescencename: "", culetname: "", labname: "",
  },
  {
    itemname: "Mount", rfbag: "0000005845", master_item_id: 3, MaterialType: "Silver",
    Mountcategoryname: "check2", supplier: "Manufacturer", shape: "ALLOY", quality: "24K",
    color: "Ayellow", size: "71.000", job: "", findingAccessories: "", findingtypename: "",
    istoreCust_Customercode: "orail25", materialtypename: "", TotalRemainingPcs: 12,
    TotalRemainingWeight: 12.5, Locker: "Locker1", certno: "", certurl: "", inscription: "",
    salerate: 40.5, length: "", width: "", depth: "", depth_per: 0, table_per: 0, cutname: "",
    polishname: "", symmetryname: "", gridlename: "", fluorescencename: "", culetname: "", labname: "",
  },
  {
    itemname: "Finding", rfbag: "0000005845", MaterialType: "Gold", master_item_id: 3,
    Mountcategoryname: "check2", supplier: "Manufacturer", shape: "ALLOY", quality: "24K",
    color: "Ayellow", size: "71.000", job: "", findingAccessories: "HOOK12", findingtypename: "Chain",
    istoreCust_Customercode: "orail25", materialtypename: "", TotalRemainingPcs: 12,
    TotalRemainingWeight: 12.5, Locker: "Locker1", certno: "", certurl: "", inscription: "",
    salerate: 40.5, length: "", width: "", depth: "", depth_per: 0, table_per: 0, cutname: "",
    polishname: "", symmetryname: "", gridlename: "", fluorescencename: "", culetname: "", labname: "",
  },
].map((row, i) => ({ ...row, id: i }));

const DIAMOND_GROUP = ["DIAMOND", "Colorstone", "MISC"];

const FILTER_CONFIG = {
  diamondGroup: [
    { key: "materialtype", label: "Material Type", dataKey: "MaterialType" },
    { key: "shape", label: "Shape", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
    { key: "size", label: "Size", dataKey: "size" },
    { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lotno", label: "Lot No.", dataKey: "rfbag" },
  ],
  Metal: [
    { key: "materialtype", label: "Material Type", dataKey: "MaterialType" },
    { key: "type", label: "Type", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
  ],
  Mount: [
    { key: "category", label: "Category", dataKey: "Mountcategoryname" },
    { key: "type", label: "Type", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
    { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lot", label: "Lot", dataKey: "rfbag" },
  ],
  Finding: [
    { key: "ftype", label: "F.Type", dataKey: "findingtypename" },
    { key: "accessories", label: "Accessories", dataKey: "findingAccessories" },
    { key: "type", label: "Type", dataKey: "shape" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
    { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lot", label: "Lot", dataKey: "rfbag" },
  ],
};

function getFilterConfig(material) {
  if (!material) return [];
  if (DIAMOND_GROUP.includes(material)) return FILTER_CONFIG.diamondGroup;
  return FILTER_CONFIG[material] || [];
}

const uniq = (arr) => [...new Set(arr.filter((v) => v !== undefined && v !== null && v !== ""))];
const fmt = (n, d = 3) => (Number.isFinite(n) ? n.toFixed(d) : (0).toFixed(d));
const nowStamp = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

function buildSummary(loc, mat, subs) {
  const base = RAW_DATA.filter((r) => (!loc || r.Locker === loc) && (!mat || r.itemname === mat));
  const cfg = getFilterConfig(mat);
  const rows = base.filter((r) => cfg.every((f) => !subs[f.key] || r[f.dataKey] === subs[f.key]));
  const bags = rows.length;
  const pieces = rows.reduce((s, r) => s + (Number(r.TotalRemainingPcs) || 0), 0);
  const weight = rows.reduce((s, r) => s + (Number(r.TotalRemainingWeight) || 0), 0);
  return { bags, pieces, weight, rows, material: mat, locker: loc, subFilters: { ...subs } };
}

/* Build one combined summary from EVERY scanned Job / Lot No. (rfbag).
   Rows for all scanned codes are grouped together — this is what "scan
   mode" shows once the user clicks the "Scan" button, instead of the
   filter-built summary. */
function buildSummaryFromScanCodes(codes) {
  const rows = RAW_DATA.filter((r) => codes.includes(r.rfbag));
  const bags = rows.length;
  const pieces = rows.reduce((s, r) => s + (Number(r.TotalRemainingPcs) || 0), 0);
  const weight = rows.reduce((s, r) => s + (Number(r.TotalRemainingWeight) || 0), 0);
  const materials = uniq(rows.map((r) => r.itemname));
  return {
    bags,
    pieces,
    weight,
    rows,
    material: materials.length === 1 ? materials[0] : "Scanned Items",
    locker: rows[0]?.Locker || "",
    subFilters: { lotno: codes.join(", ") },
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
   Two entry points (System Data / Scan Barcode) + tolerance settings.
   ===================================================================== */
function LandingActionCard({ icon, title, description, onClick, variant }) {
  const isPrimary = variant === "primary";
  return (
    <ButtonBase
      onClick={onClick}
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
        "&:hover": {
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
        Continue <ArrowForwardIcon sx={{ fontSize: 18 }} />
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
        {/* <Box
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: `linear-gradient(135deg, ${COLORS.purple} 0%, #8A5CE0 100%)`,
            boxShadow: "0 10px 24px rgba(108,63,197,0.3)",
          }}
        >
          <QrCodeScannerIcon sx={{ fontSize: 32 }} />
        </Box> */}
        <Typography sx={{ fontSize: 28, fontWeight: 800, color: COLORS.text, mb: 1 }}>
          Material Stock Reconciliation
        </Typography>
        <Typography sx={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7 }}>
          Choose how you want to start — browse system stock using filters, or scan
          barcodes to reconcile specific jobs.
        </Typography>
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
          icon={<Inventory2OutlinedIcon sx={{ fontSize: 30 }} />}
          title="Criteria Wise RM Reconciliation "
          description="Browse stock from the system by Locker, Material, Shape, Quality and more, then reconcile."
          onClick={onSystemData}
        />
        <LandingActionCard
          variant="primary"
          icon={<QrCodeScannerIcon sx={{ fontSize: 30 }} />}
          title="Scan RM Bag to Reconciliation"
          description="Scan or paste one or many Job numbers and reconcile them together in one go."
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
            {/* <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
              Maximum allowed difference between system and physical weight. Applied automatically
              to every reconciliation.
            </Typography> */}
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
   Shared filter fields — used inside the left Drawer (System Data mode).
   ===================================================================== */
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

      <FormControl fullWidth size="small" sx={fieldSx}>
        <InputLabel>Locker</InputLabel>
        <Select label="Locker" value={locker} onChange={(e) => setLocker(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          {lockerOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={fieldSx}>
        <InputLabel>Material</InputLabel>
        <Select label="Material" value={material} onChange={(e) => onMaterialChange(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          {materialOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {filterConfig.length > 0 && <Divider sx={{ my: 1.5 }} />}

      {filterConfig.map((f) => (
        <FormControl fullWidth size="small" sx={fieldSx} key={f.key}>
          <InputLabel>{f.label}</InputLabel>
          <Select
            label={f.label}
            value={subFilters[f.key] || ""}
            onChange={(e) => onSubFilterChange(f.key, e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {optionsFor(f.dataKey).map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
   COMPONENT
   ===================================================================== */
export default function MaterialStockReconciliation() {
  /* ---- top-level mode:
     'initial' -> landing page (System Data / Scan Barcode / tolerance settings)
     'filter'  -> System Data view, driven by the Filters drawer
     'scan'    -> driven by scanned Job No.'s (filters disabled)
     'history' -> just the Reconciliation History table ---- */
  const [mode, setMode] = useState("initial");

  /* ---- filters (draft state) ---- */
  const [locker, setLocker] = useState("");
  const [material, setMaterial] = useState("");
  const [subFilters, setSubFilters] = useState({});

  /* ---- filter drawer (System Data mode only) ---- */
  const [filterOpen, setFilterOpen] = useState(false);

  /* ---- stock summary snapshot: null until either a filter search or a
     scan selection populates it ---- */
  const [stockSummary, setStockSummary] = useState(null);

  /* ---- scan flow ---- */
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanSource, setScanSource] = useState("barcode"); // 'barcode' | 'camera'
  const [scanInput, setScanInput] = useState("");
  const [scannedCodes, setScannedCodes] = useState([]);

  /* ---- physical measurement ---- */
  const [grossWeight, setGrossWeight] = useState("");
  const [trayWeight, setTrayWeight] = useState("");
  const [stickerWeight, setStickerWeight] = useState("");
  const [polytheneWeight, setPolytheneWeight] = useState("");
  const [remarks, setRemarks] = useState("");
  const [result, setResult] = useState(null);

  /* ---- tolerance (editable — set from the landing page, also visible
     via the info icon next to "Reconciliation Result") ---- */
  const [toleranceMetal, setToleranceMetal] = useState(0.02);
  const [toleranceOther, setToleranceOther] = useState(0.01);
  const [tolAnchor, setTolAnchor] = useState(null);

  /* ---- saved reconciliation log ---- */
  const [history, setHistory] = useState([]);
  const [reconciledIds, setReconciledIds] = useState(new Set());

  /* ------------------------------------------------------------------- */
  const lockerOptions = useMemo(() => uniq(RAW_DATA.map((r) => r.Locker)), []);
  const materialOptions = useMemo(() => uniq(RAW_DATA.map((r) => r.itemname)), []);

  const baseFiltered = useMemo(
    () =>
      RAW_DATA.filter(
        (r) => (!locker || r.Locker === locker) && (!material || r.itemname === material)
      ),
    [locker, material]
  );

  const filterConfig = useMemo(() => getFilterConfig(material), [material]);

  const optionsFor = useCallback(
    (dataKey) => uniq(baseFiltered.map((r) => r[dataKey])),
    [baseFiltered]
  );

  const handleMaterialChange = (val) => {
    setMaterial(val);
    setSubFilters({});
  };

  const handleSubFilterChange = (key, val) => {
    setSubFilters((prev) => ({ ...prev, [key]: val }));
  };

  /* Filters drive the page ONLY when the user explicitly clicks Search. */
  const handleSearchSummary = () => {
    setStockSummary(buildSummary(locker, material, subFilters));
    setResult(null);
    setFilterOpen(false);
    setMode("filter");
  };

  const handleClearFilters = () => {
    setLocker("");
    setMaterial("");
    setSubFilters({});
  };

  const activeFilterCount =
    (locker ? 1 : 0) + (material ? 1 : 0) + Object.values(subFilters).filter(Boolean).length;

  /* Landing → "System Data": enter the filter view with ALL data loaded
     and the filter drawer closed. The user can then open Filters and
     narrow the data down. */
  // const handleOpenSystemData = () => {
  //   handleClearFilters();
  //   setStockSummary(buildSummary("", "", {}));
  //   setResult(null);
  //   setFilterOpen(false);
  //   setMode("filter");
  // };

  const handleOpenSystemData = () => {
    handleClearFilters();
    setStockSummary(null);      // <-- no default data
    setResult(null);
    setFilterOpen(true);        // <-- open the filter drawer right away
    setMode("filter");
  };

  /* ---- scan flow handlers ---- */
  const openScanDialog = (source) => {
    setScanSource(source);
    setScanInput("");
    setScannedCodes([]);
    setScanDialogOpen(true);
  };

  const closeScanDialog = () => {
    setScanDialogOpen(false);
    setScanInput("");
  };

  /* A physical barcode scanner behaves like a fast keyboard, ending each
     scan with an Enter keystroke — the field is a textarea, so the user
     (or the scanner) can also enter several Job No.'s at once, separated
     by commas or new lines. */
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

  /* Clicking "Scan" loads the data for every Job No. in the list,
     combined into one summary. */
  const handleScanAndView = () => {
    if (scannedCodes.length === 0) return;
    setStockSummary(buildSummaryFromScanCodes(scannedCodes));
    setResult(null);
    setMode("scan");
    setScanDialogOpen(false);
  };

  const goToStart = () => {
    setMode("initial");
    setStockSummary(null);
    setResult(null);
    setFilterOpen(false);
  };

  /* ---- physical measurement calculations ---- */
  const totalBags = stockSummary?.bags || 0;
  const stickerTotal = totalBags * (Number(stickerWeight) || 0);
  const polytheneTotal = totalBags * (Number(polytheneWeight) || 0);
  const trayTotal = 1 * (Number(trayWeight) || 0);
  const deduction = stickerTotal + polytheneTotal + trayTotal;
  const netWeightLive = (Number(grossWeight) || 0) - deduction;

  const applicableTolerance = material === "Metal" ? toleranceMetal : toleranceOther;
  const toleranceLabel = material === "Metal" ? "Metal" : "Other Material";

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
    const record = {
      id: history.length + 1,
      dateTime: nowStamp(),
      user: "Admin",
      material: stockSummary.material || "All",
      shape: stockSummary.subFilters?.shape || stockSummary.subFilters?.type || "—",
      size: stockSummary.subFilters?.size || "—",
      lotNo: stockSummary.subFilters?.lotno || stockSummary.subFilters?.lot || "—",
      filters: stockSummary.subFilters,
      totalBags: stockSummary.bags,
      totalPieces: stockSummary.pieces,
      systemWeight: result.systemWeight,
      grossWeight: result.grossWeight,
      stickerWeight: result.stickerWeight,
      polytheneWeight: result.polytheneWeight,
      trayWeight: result.trayWeight,
      remarks,
      physicalNet: result.physicalNet,
      difference: result.difference,
      tolerance: result.tolerance,
      status: result.status,
    };
    setHistory((prev) => [record, ...prev]);
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

  /* Direct download of a saved reconciliation (no popup). */
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

  const validScannedCodes = useMemo(
    () => scannedCodes.filter((code) => RAW_DATA.some((r) => r.rfbag === code)),
    [scannedCodes]
  );
  const invalidScannedCodes = useMemo(
    () => scannedCodes.filter((code) => !RAW_DATA.some((r) => r.rfbag === code)),
    [scannedCodes]
  );

  const summaryChips = useMemo(() => {
    if (!stockSummary) return [];
    const chips = [];
    if (stockSummary.locker) chips.push(stockSummary.locker);
    if (stockSummary.material) chips.push(stockSummary.material);
    Object.values(stockSummary.subFilters || {}).forEach((v) => v && chips.push(v));
    chips.push(`${stockSummary.bags} Bags`);
    chips.push(`${stockSummary.pieces} Pcs`);
    return chips;
  }, [stockSummary]);

  // const showWorkspace = mode === "filter" || mode === "scan";
  // const showSummaryBlock = showWorkspace; // Summary + Measurement + Result
  // const showHistoryBlock = mode === "filter" || mode === "scan" || mode === "history";
  const showWorkspace = mode === "filter" || mode === "scan";
  // In filter mode, show the summary/measurement/result only after Search is clicked
  const showSummaryBlock = mode === "scan" || (mode === "filter" && !!stockSummary);
  const showHistoryBlock = mode === "filter" || mode === "scan" || mode === "history";

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
        {/* ================= FILTER DRAWER (left side) ================= */}
        {/* Only used in System Data mode. The landing page has no filters. */}
        {mode === "filter" && (
          <Drawer
            anchor="left"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            PaperProps={{ sx: { width: 320, bgcolor: COLORS.bg } }}
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

        {/* ================= SCAN DIALOG ================= */}
        <Dialog open={scanDialogOpen} onClose={closeScanDialog} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {scanSource === "camera" ? "Camera Scan" : "Scan Barcode"}
            <IconButton size="small" onClick={closeScanDialog}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              size="small"
              placeholder="Scan or type Job No.'s, separated by commas — e.g. 1/1254, 2/3464"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScanKeyDown}
              sx={{ mb: 1, mt: 1 }}
            />
            <Button
              size="small"
              variant="outlined"
              sx={{ ...outlineBtnSx, py: 0.5, mb: 2 }}
              onClick={parseAndAddScannedCodes}
              disabled={!scanInput.trim()}
            >
              Add
            </Button>

           

            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 1 }}>
              Scanned Job ({scannedCodes.length})
            </Typography>

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

                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeleteOutlineIcon />}
                    sx={{ ...outlineBtnSx, py: 0.5 }}
                    onClick={() => setScannedCodes([])}
                  >
                    Clear All
                  </Button>
                  {invalidScannedCodes.length > 0 && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px", py: 0.5 }}
                      onClick={() => setScannedCodes(validScannedCodes)}
                    >
                      Remove Invalid
                    </Button>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<QrCodeScannerIcon />}
                  sx={primaryBtnSx}
                  onClick={handleScanAndView}
                  disabled={validScannedCodes.length === 0}
                >
                  Scan
                </Button>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeScanDialog} sx={{ textTransform: "none", color: COLORS.textMuted }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= MAIN CONTENT ================= */}
        <Box sx={{ flex: 1, minWidth: 0, p: 1.5, pt: 1 }}>
          {/* Landing page */}
          {mode === "initial" && (
            <LandingPage
              onSystemData={handleOpenSystemData}
              onScanBarcode={() => openScanDialog("barcode")}
              toleranceMetal={toleranceMetal}
              setToleranceMetal={setToleranceMetal}
              toleranceOther={toleranceOther}
              setToleranceOther={setToleranceOther}
            />
          )}
          {/* Back button — filter/scan/history modes only */}
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
          {/* Page header — content changes with mode */}
          {mode !== "initial" && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", mb: 1, gap: 1.5, marginLeft: "6px" }}>
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
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  sx={outlineBtnSx}
                  onClick={() => openScanDialog("barcode")}
                >
                  New Scan
                </Button>
              )}

              <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                {mode === "scan"
                  ? `Scanned Lot: ${stockSummary?.subFilters?.lotno || ""}`
                  : "Material Stock Reconciliation"}
              </Typography>
            </Box>
          )}

          {/* System Stock Summary + Physical Measurement + Result (filter or scan mode) */}
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
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "flex-end" }}>
                    {summaryChips.map((c, i) => (
                      <Chip key={i} label={c} size="small" sx={{ ...chipSx, backgroundColor: "#f3f4f6", fontWeight: 500 }} />
                    ))}
                  </Box>
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
                      label=" Singale Sticker Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      value={stickerWeight}
                      onChange={(e) => setStickerWeight(e.target.value)}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                    <TextField
                      label="Singale Polythene Weight"
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

          {/* Reconciliation History */}
          {showHistoryBlock && (
            <Paper sx={cardSx} elevation={0}>
              <Typography sx={panelTitleSx}>Reconciliation History</Typography>
              <TableContainer sx={tableContainerSx}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={theadCellSx}>Date &amp; Time</TableCell>
                      <TableCell sx={theadCellSx}>Material</TableCell>
                      <TableCell sx={theadCellSx}>Shape</TableCell>
                      <TableCell sx={theadCellSx}>Size</TableCell>
                      <TableCell sx={theadCellSx}>Lot No</TableCell>
                      <TableCell sx={theadCellSx} align="right">System Weight</TableCell>
                      <TableCell sx={theadCellSx} align="right">Physical Weight</TableCell>
                      <TableCell sx={theadCellSx} align="right">Difference</TableCell>
                      <TableCell sx={theadCellSx}>Status</TableCell>
                      <TableCell sx={theadCellSx}>Remarks</TableCell>
                      <TableCell sx={theadCellSx} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ color: COLORS.textMuted, py: 3 }}>
                          No reconciliations saved yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell sx={tbodyCellSx}>{h.dateTime}</TableCell>
                        <TableCell sx={linkCellSx}>{h.material}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.shape}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.size}</TableCell>
                        <TableCell sx={tbodyCellSx}>{h.lotNo}</TableCell>
                        <TableCell sx={tbodyCellSx} align="right">{fmt(h.systemWeight)}</TableCell>
                        <TableCell sx={tbodyCellSx} align="right">{fmt(h.physicalNet)}</TableCell>
                        <TableCell sx={tbodyCellSx} align="right">
                          {h.difference >= 0 ? "+" : ""}
                          {fmt(h.difference)}
                        </TableCell>
                        <TableCell sx={tbodyCellSx}>
                          <Chip size="small" label={h.status === "ACCEPT" ? "PASS" : "FAIL"} sx={h.status === "ACCEPT" ? chipSuccessSx : chipDangerSx} />
                        </TableCell>
                        <TableCell sx={tbodyCellSx}>{h.remarks || "—"}</TableCell>
                        <TableCell sx={tbodyCellSx} align="center">
                          <IconButton size="small" onClick={() => handleDownloadRecord(h)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}