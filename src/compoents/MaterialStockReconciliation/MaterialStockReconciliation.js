// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=186662
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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Divider,
  Checkbox,
  FormControlLabel,
  IconButton,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Drawer,
  Badge,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ScaleIcon from "@mui/icons-material/Scale";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import PendingRoundedIcon from '@mui/icons-material/PendingRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';

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
   REUSABLE SX FRAGMENTS  (kept as plain JS objects so styling stays inline
   with MUI's sx system instead of living in an external stylesheet)
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

const ghostBtnSx = {
  color: COLORS.purple,
  textTransform: "none",
  fontSize: 12,
  mt: -1,
  mb: 1.5,
  p: 0,
  minWidth: 0,
  "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
};

const chipSx = { bgcolor: COLORS.purpleLight, color: COLORS.purpleDark, fontWeight: 500 };
const badgeSx = { bgcolor: COLORS.purpleLight, color: COLORS.purpleDark, fontWeight: 600 };
const chipSuccessSx = { bgcolor: COLORS.successBg, color: COLORS.success, fontWeight: 600 };
const chipDangerSx = { bgcolor: COLORS.dangerBg, color: COLORS.danger, fontWeight: 600 };
const chipPendingSx = { bgcolor: COLORS.warningBg, color: COLORS.warning, fontWeight: 600 };

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
  // ---- exact records supplied by the user ----
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
  // ---- additional rows so Metal / Mount / Finding branches have data to filter ----
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

/* Sub-filter configuration per Material selection.
   key = internal id, label = UI label, dataKey = field on the row object   */
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

/* Builds the "System Stock Summary" snapshot for a given set of filter
   values. Used both for the initial (unfiltered) view and whenever the
   user explicitly clicks "Search Summary". */
function buildSummary(loc, mat, subs) {
  const base = RAW_DATA.filter((r) => (!loc || r.Locker === loc) && (!mat || r.itemname === mat));
  const cfg = getFilterConfig(mat);
  const rows = base.filter((r) => cfg.every((f) => !subs[f.key] || r[f.dataKey] === subs[f.key]));
  const bags = rows.length;
  const pieces = rows.reduce((s, r) => s + (Number(r.TotalRemainingPcs) || 0), 0);
  const weight = rows.reduce((s, r) => s + (Number(r.TotalRemainingWeight) || 0), 0);
  return { bags, pieces, weight, rows, material: mat, locker: loc, subFilters: { ...subs } };
}

/* small presentational helpers, built purely with sx (no external classes) */
function KpiCard({ label, value, sub, valueColor }) {
  return (
    <Paper sx={{ ...cardSx, mb: 0 }} elevation={0}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: COLORS.textMuted }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, my: 0.5, color: valueColor || COLORS.text }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{sub}</Typography>
    </Paper>
  );
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
   COMPONENT
   ===================================================================== */
export default function MaterialStockReconciliation() {
  /* ---- filters (draft state — these only take effect on the data once
     "Search Summary" is clicked, they never touch stockSummary directly) ---- */
  const [locker, setLocker] = useState("");
  const [material, setMaterial] = useState("");
  const [subFilters, setSubFilters] = useState({});

  /* ---- filter drawer open/close ---- */
  const [filterOpen, setFilterOpen] = useState(false);

  /* ---- stock summary snapshot (built by "Search Summary"); starts out
     showing ALL data, and only changes again when the user clicks
     "Search Summary" — changing filters alone does not touch it ---- */
  const [stockSummary, setStockSummary] = useState(() => buildSummary("", "", {}));

  /* ---- physical measurement ---- */
  const [grossWeight, setGrossWeight] = useState("");
  const [trayWeight, setTrayWeight] = useState("");
  const [stickerWeight, setStickerWeight] = useState("");
  const [polytheneWeight, setPolytheneWeight] = useState("");
  const [remarks, setRemarks] = useState("");
  const [result, setResult] = useState(null);

  /* ---- tolerance (editable) ---- */
  const [toleranceMetal, setToleranceMetal] = useState(0.02);
  const [toleranceOther, setToleranceOther] = useState(0.01);
  const [tolAnchor, setTolAnchor] = useState(null);

  /* ---- saved reconciliation log ---- */
  const [history, setHistory] = useState([]);
  const [reconciledIds, setReconciledIds] = useState(new Set());
  const [viewRecord, setViewRecord] = useState(null);
  const [todayOnly, setTodayOnly] = useState(true);

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

  /* Filters only ever update their own (draft) state here — the stock
     summary panel / table is left completely untouched until the user
     explicitly clicks "Search Summary". */
  const handleMaterialChange = (val) => {
    setMaterial(val);
    setSubFilters({});
  };

  const handleSubFilterChange = (key, val) => {
    setSubFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleSearchSummary = () => {
    setStockSummary(buildSummary(locker, material, subFilters));
    setResult(null);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setLocker("");
    setMaterial("");
    setSubFilters({});
  };

  const activeFilterCount =
    (locker ? 1 : 0) + (material ? 1 : 0) + Object.values(subFilters).filter(Boolean).length;

  /* ---- physical measurement calculations ---- */
  const totalBags = stockSummary?.bags || 0;
  const stickerTotal = totalBags * (Number(stickerWeight) || 0);
  const polytheneTotal = totalBags * (Number(polytheneWeight) || 0);
  const trayTotal = 1 * (Number(trayWeight) || 0);
  const deduction = stickerTotal + polytheneTotal + trayTotal;
  const netWeightLive = (Number(grossWeight) || 0) - deduction;

  const fetchFromMachine = () => {
    if (!stockSummary) return;
    const simulated = stockSummary.weight + deduction + (Math.random() * 0.06 - 0.03);
    setGrossWeight(simulated.toFixed(3));
  };

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

  /* ----------------------------------------------------------------- */
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          bgcolor: COLORS.bg,
          minHeight: "100vh",
          p: 2,
          pt:1,
          color: COLORS.text,
          "*": { boxSizing: "border-box" },
        }}
      >
        {/* ================= FILTER DRAWER (left side) ================= */}
        <Drawer
          anchor="left"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          PaperProps={{ sx: { width: 320, bgcolor: COLORS.bg } }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ ...panelTitleSx, mb: 0 }}>Filters</Typography>
              <IconButton size="small" onClick={() => setFilterOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
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
              <Select label="Material" value={material} onChange={(e) => handleMaterialChange(e.target.value)}>
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
                  onChange={(e) => handleSubFilterChange(f.key, e.target.value)}
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
                onClick={handleClearFilters}
                disabled={activeFilterCount === 0}
              >
                Clear
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                sx={primaryBtnSx}
                onClick={handleSearchSummary}
              >
                Search
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* ================= MAIN CONTENT (full width) ================= */}
        <Box  >
          {/* Page header with Filters toggle */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", mb: 1,gap:1.5,marginLeft:"6px" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Material Stock Reconciliation</Typography>
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
          </Box>

          {/* Today's Reconciliations — static */}
           

          {/* System Stock Summary */}
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#fff'
            }}
          >
            {/* Header with Title and Chips */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#6c3fc5" }}>
                System Stock Summary
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "flex-end" }}>
                {summaryChips.map((c, i) => (
                  <Chip key={i} label={c} size="small" sx={{ ...chipSx, backgroundColor: '#f3f4f6', fontWeight: 500 }} />
                ))}
              </Box>
            </Box>

            {/* Metrics Grid Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                gap: 2.5,
                mb: 2.5,
              }}
            >
              {/* Total RM Bags Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: '#6c3fc5',
                  backgroundColor: '#ffffff',
                  borderLeft: '4px solid #6c3fc5',
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
                  TOTAL RM BAGS
                </Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 1, color: COLORS.text }}>
                  {stockSummary ? stockSummary.bags : "—"}
                </Typography>
              </Paper>

              {/* Total Pieces Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: '#6c3fc5',
                  backgroundColor: '#ffffff',
                  borderLeft: '4px solid #6c3fc5',
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
                  TOTAL PIECES
                </Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 1, color: COLORS.text }}>
                  {stockSummary ? stockSummary.pieces : "—"}
                </Typography>
              </Paper>

              {/* System Weight Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: '#6c3fc5',
                  borderLeft: '4px solid #6c3fc5',
                  backgroundColor: '#ffffff'
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
                  SYSTEM WEIGHT
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
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
              <Paper
              elevation={0}
              sx={{
                ...cardSx,
                p: 2,
              
                border: '1px solid',
                  borderColor: '#6c3fc5',
                  borderLeft: '4px solid #6c3fc5',
                  backgroundColor: '#ffffff',
               mb:0,
                width: "100%"
              }}
            >
              {/* Master Header with Title and Total Count Badge */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
                  Today's Reconciliations
                </Typography>
                <Chip
                  label="44"
                  size="small"
                  sx={{
                    backgroundColor: '#f3f4f6',
                    fontWeight: 700,
                    color: COLORS.text,
                    borderRadius: 2
                  }}
                />
              </Box>

              {/* Inner Nested Container Card for Sub-metrics */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 2,
              
                 
              
                  
                  borderColor: 'divider',
                }}
              >
                {/* Passed */}
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>
                    Passed
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.success }}>
                    35
                  </Typography>
                </Box>

                {/* Failed */}
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>
                    Failed
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.danger }}>
                   2
                  </Typography>
                </Box>

                {/* Pending */}
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>
                    Pending
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.warning }}>
                    7
                  </Typography>
                </Box>
              </Box>
            </Paper>
            </Box>
          </Paper>

          {/* Physical Measurement + Reconciliation Result */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mb: 2.5,
              alignItems: "stretch",
            }}
          >
            {/* --- Physical Measurement --- */}
            <Paper sx={{ ...cardSx, mb: 0, display: "flex", flexDirection: "column" }} elevation={0}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ ...panelTitleSx, mb: 0 }}>Physical Measurement</Typography>
              </Box>

              <TextField
                label="Enter Weight"
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
                  label="Sticker Weight"
                  required
                  fullWidth
                  size="small"
                  type="number"
                  value={stickerWeight}
                  onChange={(e) => setStickerWeight(e.target.value)}
                  InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                />
                <TextField
                  label="Polythene Weight"
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

            {/* --- Reconciliation Result --- */}
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
                    sx={fieldSx}
                    value={toleranceMetal}
                    onChange={(e) => setToleranceMetal(Number(e.target.value))}
                  />
                  <TextField
                    label="Other Material (ct/gm)"
                    size="small"
                    type="number"
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
                  <ResultLine
                    label="Difference"
                    value={`${result.difference >= 0 ? "+" : ""}${fmt(result.difference)} gm`}
                  />
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

          {/* Reconciliation History */}
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
                        <IconButton size="small" onClick={() => setViewRecord(h)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* View saved reconciliation dialog */}
        <Dialog open={Boolean(viewRecord)} onClose={() => setViewRecord(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>Reconciliation Detail</DialogTitle>
          <DialogContent dividers>
            {viewRecord && (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {[
                  ["Date & Time", viewRecord.dateTime],
                  ["User", viewRecord.user],
                  ["Material", viewRecord.material],
                  ["Total Bags", viewRecord.totalBags],
                  ["Total Pieces", viewRecord.totalPieces],
                  ["System Weight", `${fmt(viewRecord.systemWeight)} gm`],
                  ["Gross Weight", `${fmt(viewRecord.grossWeight)} gm`],
                  ["Sticker Weight", `${fmt(viewRecord.stickerWeight)} gm`],
                  ["Polythene Weight", `${fmt(viewRecord.polytheneWeight)} gm`],
                  ["Tray/Box Weight", `${fmt(viewRecord.trayWeight)} gm`],
                  ["Physical Net Weight", `${fmt(viewRecord.physicalNet)} gm`],
                  ["Difference", `${fmt(viewRecord.difference)} gm`],
                  ["Tolerance", `±${fmt(viewRecord.tolerance)} gm`],
                  ["Remarks", viewRecord.remarks || "—"],
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{val}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mb: 0.25 }}>Result</Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: viewRecord.status === "ACCEPT" ? COLORS.success : COLORS.danger,
                    }}
                  >
                    {viewRecord.status}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewRecord(null)} sx={{ textTransform: "none", color: COLORS.textMuted }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}