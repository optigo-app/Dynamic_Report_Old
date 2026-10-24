// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18618
// REQUIRES:  npm i @zxing/browser @zxing/library
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
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
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined"; // NEW (camera scan)
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined"; // NEW (camera scan)
import { BrowserMultiFormatReader } from "@zxing/browser"; // NEW (camera scan)
import { BarcodeFormat, DecodeHintType } from "@zxing/library"; // NEW (camera scan)
import { keyframes } from "@emotion/react";
import { getMasterMaterialData, GetmaterialWiseData, SaveReconciliation, GetTodaysTransactionData, GetReconcilationSummary, SetToReconcile } from "../../API/GetRmBulkReconcilationData/GetRmBulkReconcilationData";
import ScaleIcon from "@mui/icons-material/Scale";

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

/* Status chip colour for the "Today's Transactions" table (driven by Last_Reconcileflg) */
const getStatusChipSx = (status) => {
  const v = String(status || "").toLowerCase();
  if (v.includes("reject") || v.includes("fail")) return chipDangerSx;
  if (v.includes("accept") || v.includes("done") || v.includes("success") || v.includes("pass")) return chipSuccessSx;
  return chipWarningSx;
};

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

/* NEW: keeps the typed value clearly readable when a field is disabled
   (locked after the Reconciliation Result is generated) */
const lockedTextSx = {
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: COLORS.text },
};


const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.Data)) return res.Data;
  return [];
};

const normalizeRow = (r, materialName, index) => ({
  ...r,
  id: r.id ?? index,
  itemname: materialName,
  rfbag: r.rfbag ?? "",
  MaterialType: r.MaterialType ?? r.shape ?? "",
  shape: r.shape ?? r.shapename ?? "",
  quality: r.quality ?? r.qualityname ?? r.Quality ?? "",
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
   NEW: INDEXEDDB CACHE FOR MATERIAL-WISE DATA
   - One record per material (key = material itemid) holding the already
     normalized rows + the time they were fetched.
   - Data older than CACHE_TTL_MS is treated as stale and re-fetched from
     the API (stock changes, so we never trust old data for long).
   - If IndexedDB is unavailable / blocked (private mode, quota, etc.)
     every helper fails silently and the code falls back to the API.
   ===================================================================== */
const IDB_NAME = "rmReconcileDB";
const IDB_VERSION = 1;
const IDB_STORE = "materialData";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — change as needed

let idbPromise = null;

const openIdb = () => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not supported"));
  }
  if (!idbPromise) {
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "key" });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        // if another tab upgrades the DB, close ours so it is not blocked
        db.onversionchange = () => {
          db.close();
          idbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => {
        idbPromise = null;
        reject(req.error);
      };
      req.onblocked = () => {
        idbPromise = null;
        reject(new Error("IndexedDB open blocked"));
      };
    });
  }
  return idbPromise;
};

/* returns cached rows (array) if present AND fresh, otherwise null */
const getCachedMaterialRows = async (materialKey) => {
  try {
    const db = await openIdb();
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(String(materialKey));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (!record || !Array.isArray(record.rows) || record.rows.length === 0) return null;
    if (Date.now() - (record.fetchedAt || 0) > CACHE_TTL_MS) {
      deleteCachedMaterialRows(materialKey); // expired -> remove, fire and forget
      return null;
    }
    return record.rows;
  } catch (err) {
    console.warn("IndexedDB read skipped:", err?.message || err);
    return null;
  }
};

/* stores rows for one material (replaces any previous record) */
const saveCachedMaterialRows = async (materialKey, materialName, rows) => {
  try {
    if (!Array.isArray(rows) || rows.length === 0) return; // never cache an empty / failed response
    const db = await openIdb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put({
        key: String(materialKey),
        itemname: materialName,
        rows,
        fetchedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    // quota exceeded or blocked -> ignore, app still works from the API
    console.warn("IndexedDB write skipped:", err?.message || err);
  }
};

const deleteCachedMaterialRows = async (materialKey) => {
  try {
    const db = await openIdb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(String(materialKey));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB delete skipped:", err?.message || err);
  }
};

/* NEW: logged-in user id for the SaveReconciliation API.
   >>> Adjust the storage key / field names to match how your app stores
   the logged-in user. <<< */
const getLoginUserId = () => {
  try {
    const raw =
      sessionStorage.getItem("loginUserDetail") ||
      localStorage.getItem("loginUserDetail");
    const u = raw ? JSON.parse(raw) : null;
    return u?.id ?? u?.userid ?? u?.UserId ?? 0;
  } catch (e) {
    return 0;
  }
};

/* ========================================================================
   FILTER CONFIG (keys are UPPERCASE to match API item names)
   ===================================================================== */
const DIAMOND_GROUP = ["DIAMOND", "COLOR STONE", "MISC"];

const FILTER_CONFIG = {
  diamondGroup: [
    { key: "customer", label: "Customer", dataKey: "istoreCust_Customercode" },
    { key: "materialtype", label: "Type", dataKey: "typename" },
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
    { key: "customer", label: "Customer", dataKey: "istoreCust_Customercode" },
    { key: "category", label: "Category", dataKey: "Mountcategoryname" },
    { key: "type", label: "Type", dataKey: "typename" },
    { key: "quality", label: "Quality", dataKey: "quality" },
    { key: "color", label: "Color", dataKey: "color" },
    // { key: "supplier", label: "Supplier", dataKey: "supplier" },
    { key: "lot", label: "Lot", dataKey: "lotNo" },
  ],
  FINDING: [
    { key: "customer", label: "Customer", dataKey: "istoreCust_Customercode" },
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
// const COMMON_FILTERS = [
//   { key: "customer", label: "Customer", dataKey: "istoreCust_Customercode" },
// ];

function getFilterConfig(material) {
  if (!material) return [];
  const key = String(material).toUpperCase();
  const specific = DIAMOND_GROUP.includes(key)
    ? FILTER_CONFIG.diamondGroup
    : FILTER_CONFIG[key] || [];
  return [...specific];
}

const uniq = (arr) => [...new Set(arr.filter((v) => v !== undefined && v !== null && v !== ""))];
const fmt = (n, d = 3) => (Number.isFinite(n) ? n.toFixed(d) : (0).toFixed(d));
const nowStamp = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/* NEW: block "-", "+", "e", "E" in number inputs */
const blockNegativeKeys = (e) => {
  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
};

/* NEW: accept only empty or values >= 0 */
const nonNegativeChange = (setter) => (e) => {
  const v = e.target.value;
  if (v === "" || Number(v) >= 0) setter(v);
};

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

/* CHANGE 6: ResultLine now accepts an optional `tooltip`. When given, hovering
   the label shows the tooltip (used for the Difference formula). */
function ResultLine({ label, value, tooltip }) {
  const labelNode = (
    <Typography
      sx={{
        fontSize: 13,
        color: COLORS.textMuted,
        ...(tooltip
          ? { cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "3px" }
          : {}),
      }}
    >
      {label}
    </Typography>
  );
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
      {tooltip ? (
        <Tooltip title={tooltip} arrow placement="top-start">
          {labelNode}
        </Tooltip>
      ) : (
        labelNode
      )}
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

/* CHANGE B: compact rows used inside the small calculation popover */
function CalcRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 1.5,
        py: 0.6,
      }}
    >
      <Typography sx={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.4 }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );
}

function CalcLine({ children, bold = false, color }) {
  return (
    <Typography
      sx={{
        fontSize: 12,
        lineHeight: 1.6,
        py: 0.4,
        color: color || COLORS.text,
        fontWeight: bold ? 700 : 500,
        wordBreak: "break-word",
      }}
    >
      {children}
    </Typography>
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
  isAdmin,
  onSaveTolerance,
  tolSaving,
  tolMsg,
}) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pb: 5,
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
              Select Material
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
      {isAdmin && (
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
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: tolMsg?.type === "error" ? COLORS.danger : COLORS.success,
              }}
            >
              {tolMsg?.text}
            </Typography>
          </Box>



          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 0.5fr" }, gap: 2 }}>
            <TextField
              label="Metal Tolerance"
              size="small"
              type="number"
              fullWidth
              value={toleranceMetal}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || Number(v) >= 0) setToleranceMetal(v);
              }}
              error={toleranceMetal === ""}
              helperText={toleranceMetal === "" ? "Required" : ""}
              inputProps={{ step: 0.001, min: 0, onKeyDown: blockNegativeKeys }}
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
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || Number(v) >= 0) setToleranceOther(v);
              }}
              error={toleranceOther === ""}
              helperText={toleranceOther === "" ? "Required" : ""}
              inputProps={{ step: 0.001, min: 0, onKeyDown: blockNegativeKeys }}
              InputProps={{
                endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>ct/gm</Typography>,
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>


              <Button
                variant="contained"
                startIcon={
                  tolSaving ? <CircularProgress size={16} thickness={5} sx={{ color: "#fff" }} /> : <SaveIcon />
                }
                sx={{ ...primaryBtnSx, px: 3 }}
                onClick={onSaveTolerance}
                disabled={tolSaving || toleranceMetal === "" || toleranceOther === ""}
              >
                {tolSaving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>

        </Paper>
      )}

    </Box>
  );
}


const limitedFilter = createFilterOptions({ limit: 100 });

function FilterField({ label, value, options, onChange, showAll = false }) {
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
      // renderInput={(params) => (
      //   <TextField {...params} label={label} placeholder={value.length ? "" : "All"} />
      // )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length ? "" : "All"}
          InputLabelProps={{ ...params.InputLabelProps, shrink: showAll ? true : params.InputLabelProps.shrink }}
        />
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
        showAll
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
   NEW: CAMERA SCAN (beep helper + CameraScanner)
   ===================================================================== */

/* beep + vibrate feedback on every camera scan */
let _audioCtx = null;
const scanFeedback = (ok = true) => {
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = _audioCtx.createOscillator();
    const g = _audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = ok ? 1000 : 300;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(_audioCtx.destination);
    o.start();
    o.stop(_audioCtx.currentTime + (ok ? 0.12 : 0.25));
  } catch (e) {
    /* audio not available — ignore */
  }
  try {
    if (navigator.vibrate) navigator.vibrate(ok ? 60 : [80, 60, 80]);
  } catch (e) {
    /* vibrate not available — ignore */
  }
};

/* barcode formats a bag label may use */
const CAMERA_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODABAR,
  BarcodeFormat.ITF,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
];

/* Live camera preview + continuous barcode decoding.
   Mounted only while the camera is ON; unmounting stops the camera. */
function CameraScanner({ onDetected, onStop }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastRef = useRef({ code: "", time: 0 });
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to retry

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("error");
      setErrorMsg("Camera needs a secure connection (HTTPS) or localhost. It is not available on plain http.");
      return undefined;
    }

    setStatus("starting");
    setErrorMsg("");

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, CAMERA_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });

    const handleResult = (result) => {
      if (!result) return;
      const text = String(result.getText() || "").trim();
      if (!text) return;
      const now = Date.now();
      // ignore the same code seen again within 2 seconds (camera sees it many times)
      if (text === lastRef.current.code && now - lastRef.current.time < 2000) return;
      lastRef.current = { code: text, time: now };
      onDetectedRef.current(text);
    };

    const starting = deviceId
      ? reader.decodeFromVideoDevice(deviceId, videoRef.current, handleResult)
      : reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" }, // back camera on phones/tablets
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        handleResult
      );

    starting
      .then(async (controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus("scanning");
        try {
          const list = await BrowserMultiFormatReader.listVideoInputDevices();
          if (!cancelled) setDevices(list);
        } catch (e) {
          /* device list is optional */
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Camera start failed:", err);
        setStatus("error");
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
          setErrorMsg("Camera permission was denied. Allow camera access in the browser and try again.");
        } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
          setErrorMsg("No camera was found on this device.");
        } else if (err?.name === "NotReadableError") {
          setErrorMsg("The camera is being used by another app or tab.");
        } else {
          setErrorMsg("Could not start the camera. Please try again.");
        }
      });

    return () => {
      cancelled = true;
      try {
        if (controlsRef.current) controlsRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      controlsRef.current = null;
    };
  }, [deviceId, attempt]);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 240,
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: "#000",
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* aim frame + moving scan line (only while scanning) */}
        {status === "scanning" && (
          <>
            <Box
              sx={{
                position: "absolute",
                top: "18%",
                bottom: "18%",
                left: "10%",
                right: "10%",
                border: "2px solid rgba(255,255,255,0.85)",
                borderRadius: "10px",
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: "12%",
                width: "76%",
                height: 2,
                borderRadius: 1,
                background:
                  "linear-gradient(90deg, transparent 0%, #6d5efc 20%, #6d5efc 80%, transparent 100%)",
                boxShadow: "0 0 8px 2px rgba(109,94,252,0.6)",
                animation: `${scanLineMove} 1.8s ease-in-out infinite`,
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {status === "starting" && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.55)",
            }}
          >
            <CircularProgress size={18} thickness={5} sx={{ color: "#fff" }} />
            <Typography sx={{ fontSize: 13 }}>Starting camera...</Typography>
          </Box>
        )}

        {status === "error" && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              px: 2.5,
              textAlign: "center",
              color: "#fff",
              bgcolor: "rgba(30,27,46,0.92)",
            }}
          >
            <VideocamOffOutlinedIcon />
            <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{errorMsg}</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setAttempt((a) => a + 1)}
              sx={{ color: "#fff", borderColor: "#fff", textTransform: "none" }}
            >
              Try again
            </Button>
          </Box>
        )}

        <Button
          size="small"
          variant="contained"
          onClick={onStop}
          startIcon={<CloseIcon fontSize="small" />}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "rgba(0,0,0,0.6)",
            boxShadow: "none",
            "&:hover": { bgcolor: "rgba(0,0,0,0.8)", boxShadow: "none" },
          }}
        >
          Stop
        </Button>
      </Box>

      {devices.length > 1 && (
        <FormControl fullWidth size="small" sx={{ mt: 1.25 }}>
          <InputLabel>Camera</InputLabel>
          <Select
            label="Camera"
            value={deviceId}
            displayEmpty
            onChange={(e) => setDeviceId(e.target.value)}
          >
            <MenuItem value="">Auto (back camera)</MenuItem>
            {devices.map((d, i) => (
              <MenuItem key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}


/* CHANGED: ScanPanelContent now has a "Scan using Camera" option.
   Gun scanner / typing logic is unchanged. New prop: onCameraScan(code). */
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
  inputRef,
  onCameraScan, // NEW: (code) => void — adds one code to the scanned list
}) {
  const [cameraOn, setCameraOn] = useState(false);
  const [lastScan, setLastScan] = useState(null); // { code, kind: 'added' | 'duplicate' | 'unreadable' }

  // always-fresh copy of the list for use inside the camera callback
  const scannedRef = useRef(scannedCodes);
  scannedRef.current = scannedCodes;

  const handleCameraDetected = useCallback(
    (raw) => {
      const code = String(raw).trim();

      // RM bag numbers are digits only (same rule as the text box)
      if (!/^[0-9]+$/.test(code)) {
        setLastScan({ code, kind: "unreadable" });
        scanFeedback(false);
        return;
      }
      if (scannedRef.current.includes(code)) {
        setLastScan({ code, kind: "duplicate" });
        scanFeedback(false);
        return;
      }
      if (onCameraScan) onCameraScan(code);
      setLastScan({ code, kind: "added" });
      scanFeedback(true);
    },
    [onCameraScan]
  );

  const stopCamera = () => {
    setCameraOn(false);
    // give the gun scanner its focus back
    setTimeout(() => {
      if (inputRef && inputRef.current) inputRef.current.focus();
    }, 150);
  };

  const renderLastScan = () => {
    if (!cameraOn || !lastScan) return null;
    let text = "";
    let bg = COLORS.successBg;
    let color = COLORS.success;

    if (lastScan.kind === "unreadable") {
      text = `Not a valid RM Bag barcode: ${lastScan.code}`;
      bg = COLORS.dangerBg;
      color = COLORS.danger;
    } else if (lastScan.kind === "duplicate") {
      text = `${lastScan.code} is already scanned`;
      bg = COLORS.warningBg;
      color = COLORS.warning;
    } else if (validScannedCodes.includes(lastScan.code)) {
      text = `${lastScan.code} added`;
    } else {
      text = `${lastScan.code} added, but it is not in ${material}`;
      bg = COLORS.dangerBg;
      color = COLORS.danger;
    }

    return (
      <Typography sx={{ fontSize: 12, fontWeight: 700, bgcolor: bg, color, borderRadius: "8px", px: 1.5, py: 1, mb: 1.5 }}>
        {text}
      </Typography>
    );
  };

  return (
    <Box sx={{ p: 2.5, width: 520 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ ...panelTitleSx, mb: 0 }}>Scan RM Bag</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* open / stop the camera (icon only) */}
          <Tooltip title={cameraOn ? "Stop camera" : "Scan using camera"} arrow>
            <IconButton
              onClick={() => (cameraOn ? stopCamera() : setCameraOn(true))}
              aria-label={cameraOn ? "Stop camera" : "Scan using camera"}
              sx={{
                width: 36,
                height: 36,
                color: cameraOn ? "#fff" : COLORS.purple,
                bgcolor: cameraOn ? COLORS.purple : COLORS.surface,
                border: `1px solid ${COLORS.purple}`,
                "&:hover": {
                  bgcolor: cameraOn ? COLORS.purpleDark : COLORS.purpleLight,
                },
              }}
            >
              {cameraOn ? (
                <VideocamOffOutlinedIcon fontSize="small" />
              ) : (
                <CameraAltOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {cameraOn ? (
        <CameraScanner onDetected={handleCameraDetected} onStop={stopCamera} />
      ) : (
        <>
          <Box
            sx={{
              position: "relative",
              width: 90,
              height: 90,
              mx: "auto",          // centered
              mb: 1.5,
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
        </>
      )}

      {renderLastScan()}

      {/* Selected material (fixed) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Material:</Typography>
        <Chip label={material} size="small" sx={chipSx} />
      </Box>

      <TextField
        autoFocus
        inputRef={inputRef}
        fullWidth
        multiline
        size="small"
        placeholder="Scan or type RM Bag No.'s — e.g. 0000005845 0000005846"
        value={scanInput}
        onChange={(e) => setScanInput(e.target.value.replace(/[^0-9\s,]/g, ""))}
        onKeyDown={onKeyDown}
        inputProps={{ inputMode: "numeric" }}
        sx={{
          mb: 1,
          "& .MuiInputBase-root": {
            height: cameraOn ? 110 : 180, // smaller while the camera preview is open
            alignItems: "flex-start",
            overflow: "hidden",
          },
          "& textarea": {
            height: "100% !important",
            overflowY: "auto !important",
            boxSizing: "border-box",
            scrollbarWidth: "thin",
            scrollbarColor: "#6c3ec1 transparent",
          },
          // scrollbar color (Chrome / Edge / Safari)
          "& textarea::-webkit-scrollbar": { width: 8 },
          "& textarea::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "& textarea::-webkit-scrollbar-thumb": {
            backgroundColor: "#6c3ec1",
            borderRadius: 8,
          },
        }}
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
            onClick={() => {
              setLastScan(null);
              onClearAll();
            }}
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


export default function MaterialStockReconciliation() {
  const [mode, setMode] = useState("initial");

  /* ---- API data ---- */
  const [materialList, setMaterialList] = useState([]); // from getMasterMaterialData()
  const [rawData, setRawData] = useState([]);           // from GetmaterialWiseData(materialId) (cached in IndexedDB)
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


  const [removeCode, setRemoveCode] = useState(null);
  const [scaleConnected, setScaleConnected] = useState(false);
  const scalePortRef = useRef(null);
  const scaleReaderRef = useRef(null);
  const scaleClosedRef = useRef(null);
  const scaleBufferRef = useRef("");

  const grossInputRef = useRef(null);
  const scanInputRef = useRef(null);
  const [grossWeight, setGrossWeight] = useState("");
  const [trayWeight, setTrayWeight] = useState("");
  const [stickerWeight, setStickerWeight] = useState("");
  const [polytheneWeight, setPolytheneWeight] = useState("");
  const [remarks, setRemarks] = useState("");
  const [result, setResult] = useState(null);

  /* CHANGED: inputs are NOT locked after the result. They are cleared after a
     successful save so the user can enter new values and save a new reconciliation. */


  const [touched, setTouched] = useState({});
  const markTouched = (k) => () => setTouched((p) => ({ ...p, [k]: true }));
  const isEmptyErr = (k, val) => !!touched[k] && val === "";


  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);


  const [calcAnchor, setCalcAnchor] = useState(null);

  const [toleranceMetal, setToleranceMetal] = useState(0);
  const [toleranceOther, setToleranceOther] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);   // NEW
  const [tolAnchor, setTolAnchor] = useState(null);
  const [tolSaving, setTolSaving] = useState(false);              // NEW
  const [tolMsg, setTolMsg] = useState({ type: "", text: "" });

  const [history, setHistory] = useState([]);
  const [reconciledIds, setReconciledIds] = useState(new Set());


  const [todaysData, setTodaysData] = useState([]);
  const [todaysLoading, setTodaysLoading] = useState(false);
  const todaysReqRef = useRef(0);
  const [reconSummary, setReconSummary] = useState({ total: 0, success: 0, reject: 0 });

  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(25);


  useEffect(() => {
    let timer = null;
    let stopped = false;
    let listSet = false;
    const MAX_ATTEMPTS = 10;

    const retry = (attempt) => {
      if (stopped || attempt >= MAX_ATTEMPTS) return;
      timer = setTimeout(() => load(attempt + 1), 800);
    };

    const load = async (attempt = 0) => {
      try {
        const res = await getMasterMaterialData();
        if (stopped) return;
        console.log("getMasterMaterialData response:", res);

        const root = res?.Data ?? res;
        const rd = toArray(root?.rd || []);
        const rd1 = Array.isArray(root?.rd1) ? root.rd1 : [];
        const rd2 = Array.isArray(root?.rd2) ? root.rd2 : [];


        if (rd.length && !listSet) {
          setMaterialList(rd);
          listSet = true;
        }

        // tolerance values from rd1
        const tol = rd1[0];
        if (tol) {
          if (tol.metal !== undefined && tol.metal !== null) {
            setToleranceMetal(Number(tol.metal) || 0);
          }
          if (tol.otherMaterial !== undefined && tol.otherMaterial !== null) {
            setToleranceOther(Number(tol.otherMaterial) || 0);
          }
        }

        // admin flag from rd2 (accepts 1, "1" or true) — only when rd2 really arrived
        if (rd2.length) {
          setIsAdmin([1, "1", true].includes(rd2[0]?.IsAdmin));
        }

        // response still incomplete -> retry
        if (!rd.length || !rd2.length) {
          retry(attempt);
        }
      } catch (err) {
        console.error("getMasterMaterialData failed:", err);
        retry(attempt);
      }
    };

    load();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);
  /* Load material-wise data whenever the selected material changes.
     CHANGED: first look in IndexedDB (fresh cache = no API call). If there
     is no fresh cache, call the API, normalize, show it, and save it into
     IndexedDB for next time. */
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
        // 1) try IndexedDB cache
        const cachedRows = await getCachedMaterialRows(selected.itemid);
        if (cachedRows) {
          if (!cancelled) setRawData(cachedRows);
          return;
        }

        // 2) no fresh cache -> call API
        const res = await GetmaterialWiseData(selected.itemid);
        const rows = toArray(res).map((r, i) => normalizeRow(r, material, i));
        if (!cancelled) setRawData(rows);

        // 3) save to IndexedDB (don't block the UI; errors are ignored inside)
        saveCachedMaterialRows(selected.itemid, material, rows);
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

  /* NEW: Today's reconcile summary (KPI card) */
  const loadReconSummary = useCallback(async () => {
    try {
      const res = await GetReconcilationSummary();
      const rec = Array.isArray(res) ? res[0] : res;
      setReconSummary({
        total: Number(rec?.totalreconcile) || 0,
        success: Number(rec?.successreconcile) || 0,
        reject: Number(rec?.rejectreconcile) || 0,
      });
    } catch (err) {
      console.error("GetReconcilationSummary failed:", err);
    }
  }, []);

  useEffect(() => {
    loadReconSummary();
  }, [loadReconSummary]);

  /* NEW: Today's transactions for the selected material */
  const loadTodaysTransactions = useCallback(async () => {
    const selected = materialList.find((m) => m.itemname === material);
    if (!material || !selected) {
      setTodaysData([]);
      setTodaysLoading(false);
      return;
    }
    const reqId = ++todaysReqRef.current;
    setTodaysLoading(true);
    try {
      const res = await GetTodaysTransactionData(selected.itemid);
      if (reqId === todaysReqRef.current) setTodaysData(toArray(res));
    } catch (err) {
      console.error("GetTodaysTransactionData failed:", err);
      if (reqId === todaysReqRef.current) setTodaysData([]);
    } finally {
      if (reqId === todaysReqRef.current) setTodaysLoading(false);
    }
  }, [material, materialList]);

  useEffect(() => {
    loadTodaysTransactions();
  }, [loadTodaysTransactions]);

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

  /* NEW: save tolerance (admin only) */
  const handleSaveTolerance = async () => {
    if (tolSaving) return;

    if (toleranceMetal === "" || toleranceOther === "") {
      setTolMsg({ type: "error", text: "Tolerance cannot be empty." });
      return;
    }

    if (toleranceMetal < 0 || toleranceOther < 0) {
      setTolMsg({ type: "error", text: "Tolerance cannot be negative." });
      return;
    }

    setTolSaving(true);
    setTolMsg({ type: "", text: "" });
    try {
      const res = await SetToReconcile(Number(toleranceMetal), Number(toleranceOther));
      const rec = Array.isArray(res) ? res[0] : res;

      // if your SP returns stat / stat_msg, respect it; otherwise treat as success
      if (rec && rec.stat !== undefined && Number(rec.stat) !== 1) {
        setTolMsg({ type: "error", text: rec.stat_msg || "Could not save tolerance." });
      } else {
        setTolMsg({ type: "success", text: "Tolerance saved successfully." });
        setTimeout(() => setTolMsg({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("SetToReconcile failed:", err);
      setTolMsg({ type: "error", text: "Something went wrong while saving. Please try again." });
    } finally {
      setTolSaving(false);
    }
  };

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
    setSaveError("");
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
    setSaveError("");
    setFilterOpen(true);
    setMode("filter");
  };

  const doOpenScanFlow = () => {
    setScanInput("");
    setScannedCodes([]);
    setStockSummary(null);
    setResult(null);
    setSaveError("");
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
    const parts = uniq(
      scanInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    );
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

  /* NEW: add ONE code coming from the camera scanner (no duplicates) */
  const handleCameraScan = useCallback((code) => {
    setScannedCodes((prev) => (prev.includes(code) ? prev : [...prev, code]));
  }, []);

  const handleScanKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const tokens = scanInput.split(/[\s,]+/).filter(Boolean);
    if (tokens.length === 0) return;

    // keep each code only once, and drop codes already in the Scanned RM Bag list
    const unique = uniq(tokens).filter((code) => !scannedCodes.includes(code));

    // text area shows only unique codes, with a space after the last one
    setScanInput(unique.length ? unique.join(" ") + " " : "");
  };

  const handleRemoveScanned = (code) => {
    setScannedCodes((prev) => prev.filter((c) => c !== code));
  };

  /* CHANGE 4: confirmed removal of one RM bag from the scanned list.
     Removing it from scannedCodes also refreshes the summary (via the
     existing [scannedCodes] effect below). */
  const handleConfirmRemoveScanned = () => {
    if (removeCode !== null) handleRemoveScanned(removeCode);
    setRemoveCode(null);
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
    setSaveError("");
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

  /* CHANGE 2: Back button now clears every input on the screen
     (weights, remarks, scan input + scanned bags, filters, result/errors).
     The selected material and tolerance settings are kept. */
  const goToStart = () => {
    setMode("initial");
    setStockSummary(null);
    setResult(null);
    setSaveError("");
    setFilterOpen(false);
    setScanDrawerOpen(false);
    setScanInfoOpen(false);
    setConfirmSaveOpen(false);
    setCalcAnchor(null); // CHANGE B
    setRemoveCode(null);

    // physical measurement inputs
    setGrossWeight("");
    setTrayWeight("");
    setStickerWeight("");
    setPolytheneWeight("");
    setRemarks("");
    setTouched({});

    // scan inputs
    setScanInput("");
    setScannedCodes([]);

    // filter inputs
    setLocker([]);
    setSubFilters({});
  };

  /* ---- physical measurement calculations ---- */
  const totalBags = stockSummary?.bags || 0;
  const stickerTotal = totalBags * (Number(stickerWeight) || 0);
  const polytheneTotal = totalBags * (Number(polytheneWeight) || 0);
  const trayTotal = 1 * (Number(trayWeight) || 0);
  const deduction = stickerTotal + polytheneTotal + trayTotal;
  const netWeightLive = (Number(grossWeight) || 0) - deduction;

  /* All four weight inputs are mandatory; Remarks is optional (max 200 chars). */
  const REMARKS_MAX = 200;
  const allMandatoryFilled =
    grossWeight !== "" && trayWeight !== "" && stickerWeight !== "" && polytheneWeight !== "";

  const isMetal = String(material).toUpperCase() === "METAL";
  const applicableTolerance = isMetal ? toleranceMetal : toleranceOther;
  const toleranceLabel = isMetal ? "Metal" : "Other Material";

  /* CHANGED: now calls the BulkReconcileSave API and builds `result`
     from the API response (rd[0]). */
  /* CHANGED: new BulkReconcileSave API.
   Calculation (physical weight) is done on the frontend; backend only
   receives the final values and returns stat / status / difference. */
  const handleReconcile = async () => {
    if (!stockSummary || !allMandatoryFilled || saving) return;

    setSaving(true);
    setSaveError("");
    setResult(null);

    try {
      // comma-separated unique RM bag numbers of everything in the summary
      const rfbags = uniq(stockSummary.rows.map((r) => r.id)).join(",");

      const systemWt = Number(stockSummary.weight) || 0;
      const physicalWt = Number(netWeightLive.toFixed(3)); // frontend calculated physical weight

      const res = await SaveReconciliation(
        rfbags,                                   // RmBags
        Math.abs(applicableTolerance),            // tolerance
        Number(grossWeight) || 0,                 // totalweight (entered total weight)
        systemWt?.toFixed(3),                                 // SyatemWt
        stockSummary.bags || 0,                   // totalbags
        remarks.trim().slice(0, REMARKS_MAX),     // remarks (optional, max 200)
        physicalWt?.toFixed(3)                              // physicalwt (frontend calculated)
      );

      // response: { Data: { rd: [ { stat, stat_msg, status, Reconcileflg, difference, remarks } ] } }
      // (your API helper should already return rd — this also handles the raw shape)
      const rec = Array.isArray(res)
        ? res[0]
        : res?.Data?.rd?.[0] ?? res?.rd?.[0] ?? res;

      if (!rec || Number(rec.stat) !== 1) {
        setSaveError(rec?.stat_msg || "Reconciliation could not be saved. Please try again.");
        return;
      }

      const accepted = String(rec.status || "").toLowerCase() === "accept";

      // use backend difference if present, otherwise fall back to frontend calculation
      const diff = Number.isFinite(Number(rec.difference))
        ? Number(rec.difference)
        : physicalWt - systemWt;

      setResult({
        systemWeight: systemWt,
        grossWeight: Number(grossWeight) || 0,
        trayWeight: Number(trayWeight) || 0,
        stickerWeight: Number(stickerWeight) || 0,
        polytheneWeight: Number(polytheneWeight) || 0,
        physicalNet: physicalWt,
        difference: diff,
        tolerance: Math.abs(applicableTolerance),
        status: accepted ? "ACCEPT" : "REJECT",
        message: accepted
          ? "Within Tolerance — Reconcile successfully"
          : "Out of Tolerance — Reconcile Rejected",
      });

      // CHANGED: clear the old values so the next reconciliation starts fresh
      setGrossWeight("");
      setTrayWeight("");
      setStickerWeight("");
      setPolytheneWeight("");
      setRemarks("");
      setTouched({});
      setTimeout(() => grossInputRef.current?.focus(), 100);

      // refresh the table + KPI card after a successful save
      loadTodaysTransactions();
      loadReconSummary();
    } catch (err) {
      console.error("SaveReconciliation failed:", err);
      setSaveError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* CHANGE 1: button opens the confirmation; the actual save runs only after confirm */
  const handleSaveClick = () => {
    if (!stockSummary || !allMandatoryFilled || saving) return;
    setConfirmSaveOpen(true);
  };

  const handleConfirmSave = () => {
    setConfirmSaveOpen(false);
    handleReconcile();
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
    // chips.push(`${stockSummary.bags} Bags`);
    // chips.push(`${stockSummary.pieces} Pcs`);
    return chips;
  }, [stockSummary]);

  const showWorkspace = mode === "filter" || mode === "scan";
  const showSummaryBlock = showWorkspace && !!stockSummary;
  /* try silent auto-connect when the weight form appears */
  useEffect(() => {
    if (showSummaryBlock) ensureScaleConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSummaryBlock]);

  /* NEW: focus "Enter Total Weight" by default once the weight form is visible
     and the Filter / Scan drawers are closed (the drawer would otherwise steal
     the focus back while it is closing). */
  useEffect(() => {
    if (!showSummaryBlock || filterOpen || scanDrawerOpen) return;
    const t = setTimeout(() => {
      grossInputRef.current?.focus();
    }, 400);
    return () => clearTimeout(t);
  }, [showSummaryBlock, filterOpen, scanDrawerOpen]);
  /* focus the scan text area every time the Scan drawer opens */
  useEffect(() => {
    if (!scanDrawerOpen) return;
    const t = setTimeout(() => scanInputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [scanDrawerOpen]);

  /* release the port when leaving the screen */
  useEffect(() => {
    return () => {
      disconnectScale();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const showHistoryBlock = mode === "filter" || mode === "scan" || mode === "history";

  // PERF: render only one page of rows instead of thousands at once
  const pagedTodaysRows = useMemo(
    () =>
      todaysData.slice(
        historyPage * historyRowsPerPage,
        historyPage * historyRowsPerPage + historyRowsPerPage
      ),
    [todaysData, historyPage, historyRowsPerPage]
  );

  useEffect(() => {
    setHistoryPage(0);
  }, [mode, material, todaysData.length]);

  const extractWeight = (line) => {
    const m = line.match(/([+-]?\d+\.?\d*)/);
    if (!m) return null;
    const w = parseFloat(m[1]);
    return !isNaN(w) && w >= 0 ? w.toFixed(3) : null;
  };

  const parseScaleBuffer = () => {
    const lines = scaleBufferRef.current.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const w = extractWeight(line);
      if (w !== null) setGrossWeight(w); // fills "Enter Total Weight"
    }
    scaleBufferRef.current = lines[lines.length - 1];
  };

  const readScaleData = async (port) => {
    const decoder = new TextDecoderStream();
    scaleClosedRef.current = port.readable.pipeTo(decoder.writable).catch(() => { });
    const reader = decoder.readable.getReader();
    scaleReaderRef.current = reader;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          scaleBufferRef.current += value;
          parseScaleBuffer();
        }
      }
    } catch (err) {
      console.error("Scale read error:", err);
    } finally {
      setScaleConnected(false);
    }
  };

  const openScalePort = async (port) => {
    await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" });
    scalePortRef.current = port;
    setScaleConnected(true);
    readScaleData(port);
  };

  /* silent connect if the user already granted a port earlier */
  const ensureScaleConnected = async () => {
    if (!("serial" in navigator) || scalePortRef.current) return;
    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) await openScalePort(ports[0]);
    } catch (err) {
      console.log("Scale auto-connect skipped:", err.message);
    }
  };

  /* manual connect (needs a click = user gesture) */
  const connectScale = async () => {
    if (!("serial" in navigator)) {
      alert("Web Serial API not supported. Use Chrome or Edge.");
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await openScalePort(port);
    } catch (err) {
      console.error("Scale connection error:", err);
    }
  };

  const disconnectScale = async () => {
    try {
      if (scaleReaderRef.current) {
        await scaleReaderRef.current.cancel();
        scaleReaderRef.current = null;
      }
      if (scaleClosedRef.current) await scaleClosedRef.current;
      if (scalePortRef.current) {
        await scalePortRef.current.close();
        scalePortRef.current = null;
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setScaleConnected(false);
    }
  };

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
            PaperProps={{ sx: { width: 520, maxWidth: "100vw", bgcolor: COLORS.bg } }}
            SlideProps={{ onEntered: () => scanInputRef.current?.focus() }}
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
              inputRef={scanInputRef}
              onCameraScan={handleCameraScan}
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
                {/* CHANGE 4: X icon on every RM bag chip → opens remove confirmation */}
                {validScannedCodes.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    size="small"
                    onDelete={() => setRemoveCode(code)}
                    deleteIcon={<CloseIcon />}
                    sx={{ ...chipSx, flexShrink: 0 }}
                  />
                ))}
              </Box>
            </Box>
          </Dialog>
        )}

        {/* CHANGE 4: confirmation before removing a scanned RM bag */}
        {mode === "scan" && (
          <Dialog
            open={removeCode !== null}
            onClose={() => setRemoveCode(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORS.purple }}>
              Remove RM Bag
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: 14, color: COLORS.text }}>
                Are you sure you want to remove RM Bag <b>{removeCode}</b> from the scanned list?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button variant="outlined" sx={{ ...outlineBtnSx, py: 0.6 }} onClick={() => setRemoveCode(null)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ ...primaryBtnSx, py: 0.6, bgcolor: COLORS.danger, "&:hover": { bgcolor: "#B53636", boxShadow: "none" } }}
                onClick={handleConfirmRemoveScanned}
              >
                Remove
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* CHANGE 1: confirmation before Save Reconciliation */}
        <Dialog
          open={confirmSaveOpen}
          onClose={() => setConfirmSaveOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORS.purple }}>
            Confirm Reconciliation
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: 14, color: COLORS.text }}>
              Are you sure you want to save this reconciliation
              {stockSummary ? <> for <b>{stockSummary.bags}</b> RM Bag(s)</> : null}?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button variant="outlined" sx={{ ...outlineBtnSx, py: 0.6 }} onClick={() => setConfirmSaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" sx={{ ...primaryBtnSx, py: 0.6 }} onClick={handleConfirmSave}>
              Yes, Save
            </Button>
          </DialogActions>
        </Dialog>

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


              isAdmin={isAdmin}
              onSaveTolerance={handleSaveTolerance}   // NEW
              tolSaving={tolSaving}                   // NEW
              tolMsg={tolMsg}
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
                <Tooltip title="View scanned RM Bag No.'s" arrow>
                  <IconButton
                    onClick={() => setScanInfoOpen(true)}
                    aria-label="View scanned RM Bag No.'s"
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#6c3fc5" }}>
                      System Stock Summary
                    </Typography>
                    {material && (
                      <Chip
                        label={material}
                        size="small"
                        sx={{ ...chipSx, fontWeight: 700 }}
                      />
                    )}
                  </Box>
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

                  {/* CHANGE 3: for METAL there are no pieces, so show "—" instead of 0 */}
                  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "#6c3fc5", backgroundColor: "#ffffff", borderLeft: "4px solid #6c3fc5" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>TOTAL PIECES</Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 1, color: COLORS.text }}>
                      {stockSummary && !isMetal ? stockSummary.pieces : "—"}
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
                          {["DIAMOND", "COLOR STONE"].includes(String(material).toUpperCase()) ? "ctw" : "gm"}
                        </Typography>
                      )}
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ ...cardSx, p: 2, border: "1px solid", borderColor: "#6c3fc5", borderLeft: "4px solid #6c3fc5", backgroundColor: "#ffffff", mb: 0, width: "100%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Today's Reconciliations</Typography>
                      <Chip label={reconSummary.total} size="small" sx={{ backgroundColor: "#f3f4f6", fontWeight: 700, color: COLORS.text, borderRadius: 2 }} />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Total</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.warning }}>{Math.max(reconSummary.total, 0)}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Passed</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.success }}>{reconSummary.success}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Failed</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.danger }}>{reconSummary.reject}</Typography>
                      </Box>
                      {/* <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: COLORS.textMuted }}>Pending</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5, color: COLORS.warning }}>{Math.max(reconSummary.total - reconSummary.success - reconSummary.reject, 0)}</Typography>
                      </Box> */}
                    </Box>
                  </Paper>
                </Box>
              </Paper>

              {/* Physical Measurement + Reconciliation Result */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 2.5, alignItems: "stretch" }}>
                <Paper sx={{ ...cardSx, mb: 0, display: "flex", flexDirection: "column" }} elevation={0}>
                  {/* CHANGE B: i icon after the heading → opens a small popover right below it */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.5, mb: 1.5 }}>
                    <Typography sx={{ ...panelTitleSx, mb: 0 }}>Physical Measurement</Typography>
                    <Tooltip title="How it's calculated" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => setCalcAnchor(e.currentTarget)}
                        aria-label="How physical weight is calculated"
                        sx={{ color: COLORS.purple }}
                      >
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Popover
                    open={Boolean(calcAnchor)}
                    anchorEl={calcAnchor}
                    onClose={() => setCalcAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    PaperProps={{ sx: { width: 340, maxWidth: "calc(100vw - 32px)", borderRadius: "12px" } }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.purple }}>
                          Entered Values
                        </Typography>
                        <IconButton size="small" onClick={() => setCalcAnchor(null)} sx={{ p: 0.25 }}>
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      <CalcRow
                        label="Entered whole box (tray + material)"
                        value={`${fmt(Number(grossWeight) || 0)} gm`}
                      />
                      <CalcRow
                        label="Entered tray weight"
                        value={`${fmt(Number(trayWeight) || 0)} gm`}
                      />
                      <CalcRow
                        label="Entered sticker weight of single RM bag"
                        value={`${fmt(Number(stickerWeight) || 0)} gm`}
                      />
                      <CalcRow
                        label="Entered polythene weight of single RM bag"
                        value={`${fmt(Number(polytheneWeight) || 0)} gm`}
                      />
                      <CalcRow label="Total RM bags" value={totalBags} />

                      <Divider sx={{ my: 1 }} />

                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.purple, mb: 0.25 }}>
                        Calculation
                      </Typography>
                      <CalcLine>
                        Sticker Total = {totalBags} × {fmt(Number(stickerWeight) || 0)} = <b>{fmt(stickerTotal)}</b>
                      </CalcLine>
                      <CalcLine>
                        Polythene Total = {totalBags} × {fmt(Number(polytheneWeight) || 0)} = <b>{fmt(polytheneTotal)}</b>
                      </CalcLine>
                      <CalcLine>
                        Deduction = {fmt(stickerTotal)} + {fmt(polytheneTotal)} + {fmt(trayTotal)} = <b>{fmt(deduction)}</b>
                      </CalcLine>
                      <CalcLine bold color={netWeightLive < 0 ? COLORS.danger : COLORS.success}>
                        Physical Weight = {fmt(Number(grossWeight) || 0)} − {fmt(deduction)} = {fmt(netWeightLive)} gm
                      </CalcLine>
                    </Box>
                  </Popover>

                  <TextField
                    label="Enter Total Weight"
                    required
                    fullWidth
                    inputRef={grossInputRef}
                    size="small"
                    type="number"
                    sx={{ ...fieldSx, ...lockedTextSx }}
                    value={grossWeight}
                    onChange={nonNegativeChange(setGrossWeight)}
                    onBlur={markTouched("gross")}
                    error={isEmptyErr("gross", grossWeight)}
                    helperText={isEmptyErr("gross", grossWeight) ? "Required" : ""}
                    inputProps={{ min: 0, step: "any", onKeyDown: blockNegativeKeys }}
                    // InputProps={{
                    //   endAdornment: (
                    //     <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    //       <Tooltip title={scaleConnected ? "Scale connected (click to disconnect)" : "Connect weight scale"} arrow>
                    //         <IconButton
                    //           size="small"
                    //           onClick={scaleConnected ? disconnectScale : connectScale}
                    //           sx={{ color: scaleConnected ? COLORS.success : COLORS.textMuted }}
                    //         >
                    //           <ScaleIcon fontSize="small" />
                    //         </IconButton>
                    //       </Tooltip>
                    //       {/* <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> */}
                    //     </Box>
                    //   ),
                    // }}
                  />

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 1.75 }}>
                    <TextField
                      label="Tray/Box Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      sx={lockedTextSx}
                      value={trayWeight}
                      onChange={nonNegativeChange(setTrayWeight)}
                      onBlur={markTouched("tray")}
                      error={isEmptyErr("tray", trayWeight)}
                      helperText={isEmptyErr("tray", trayWeight) ? "Required" : ""}
                      inputProps={{ min: 0, step: "any", onKeyDown: blockNegativeKeys }}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                    <TextField
                      label=" Single Sticker Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      sx={lockedTextSx}
                      value={stickerWeight}
                      onChange={nonNegativeChange(setStickerWeight)}
                      onBlur={markTouched("sticker")}
                      error={isEmptyErr("sticker", stickerWeight)}
                      helperText={isEmptyErr("sticker", stickerWeight) ? "Required" : ""}
                      inputProps={{ min: 0, step: "any", onKeyDown: blockNegativeKeys }}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                    <TextField
                      label="Single Polythene Weight"
                      required
                      fullWidth
                      size="small"
                      type="number"
                      sx={lockedTextSx}
                      value={polytheneWeight}
                      onChange={nonNegativeChange(setPolytheneWeight)}
                      onBlur={markTouched("polythene")}
                      error={isEmptyErr("polythene", polytheneWeight)}
                      helperText={isEmptyErr("polythene", polytheneWeight) ? "Required" : ""}
                      inputProps={{ min: 0, step: "any", onKeyDown: blockNegativeKeys }}
                      InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>gm</Typography> }}
                    />
                  </Box>

                  {/* CHANGE A: back to the previous two-line layout, with more vertical space
                      (extra margin below so it no longer touches the Remarks field) */}
                  <Typography sx={{ ...hintSx, mt: 0.5, mb: 1 }}>
                    Total Bags: <b>{totalBags}</b> · Tray/Box: <b>{fmt(trayTotal)}</b> gm · Sticker Total: <b>{fmt(stickerTotal)}</b> gm · Polythene
                    Total: <b>{fmt(polytheneTotal)}</b> gm
                  </Typography>
                  <Typography sx={{ ...hintSx, mt: 0, mb: 2.5 }}>
                    Physical Weight: <b>{fmt(netWeightLive)} gm</b>
                  </Typography>

                  <TextField
                    label="Remarks"
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    sx={{ ...fieldSx, ...lockedTextSx }}
                    placeholder="Enter remarks (optional)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value.slice(0, REMARKS_MAX))}
                    inputProps={{ maxLength: REMARKS_MAX }}
                    helperText={`${remarks.length}/${REMARKS_MAX}`}
                    FormHelperTextProps={{ sx: { textAlign: "right", mx: 0, mt: 0.5 } }}
                  />

                  {/* CHANGE 1: click opens the confirmation dialog (save happens after confirm) */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} thickness={5} sx={{ color: "#fff" }} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    sx={{ ...primaryBtnSx, mt: "auto" }}
                    onClick={handleSaveClick}
                    disabled={!stockSummary || !allMandatoryFilled || saving}
                  >
                    {saving ? "Saving..." : "Save Reconciliation"}
                  </Button>
                </Paper>

                <Paper sx={{ ...cardSx, mb: 0, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                    <Typography sx={{ ...panelTitleSx, mb: 0 }}>Reconciliation Result</Typography>
                    {/* CHANGE 5: hover label "Show Tolerance" on the i icon */}
                    <Tooltip title="Show Tolerance" arrow>
                      <IconButton size="small" onClick={(e) => setTolAnchor(e.currentTarget)}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
                      {/* CHANGE 6: hover on "Difference" shows the formula */}
                      <ResultLine
                        label="Difference"
                        value={`${result.difference >= 0 ? "+" : ""}${fmt(result.difference)} gm`}
                        tooltip={
                          <Box sx={{ fontSize: 12, lineHeight: 1.6 }}>
                            <div><b>Difference = Physical Weight − System Weight</b></div>

                          </Box>
                        }
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
                        variant="outlined"
                        sx={{ ...outlineBtnSx, mt: "auto" }}
                      // onClick={handleSaveReconciliation}
                      >
                        Reconcilation Report
                      </Button>
                    </>
                  ) : saveError ? (
                    <Typography sx={{ ...hintInlineSx, bgcolor: COLORS.dangerBg, color: COLORS.danger, fontWeight: 600 }}>
                      {saveError}
                    </Typography>
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

          {/* Today's Transactions — single table (API: GetTodaysTransactionData) */}
          {showHistoryBlock && (
            <Paper sx={cardSx} elevation={0}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                <Typography sx={{ ...panelTitleSx, mb: 0 }}>
                  {`Today's Transactions${todaysData.length ? ` (${todaysData.length})` : ""}`}
                </Typography>
              </Box>

              <TableContainer sx={tableContainerSx}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={theadCellSx}>Bag</TableCell>
                      <TableCell sx={theadCellSx}>Material</TableCell>
                      <TableCell sx={theadCellSx}>Customer</TableCell>
                      <TableCell sx={theadCellSx}>M.Type</TableCell>
                      <TableCell sx={theadCellSx}>Shape</TableCell>
                      <TableCell sx={theadCellSx}>Quality</TableCell>
                      <TableCell sx={theadCellSx}>Color</TableCell>
                      <TableCell sx={theadCellSx}>Size</TableCell>
                      <TableCell sx={theadCellSx} align="right">System Wt</TableCell>
                      <TableCell sx={theadCellSx}>Locker</TableCell>
                      <TableCell sx={theadCellSx}>Status</TableCell>
                      <TableCell sx={theadCellSx}>Last Action By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaysLoading && (
                      <TableRow>
                        <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={20} thickness={5} sx={{ color: COLORS.purple }} />
                        </TableCell>
                      </TableRow>
                    )}
                    {!todaysLoading && todaysData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} align="center" sx={{ color: COLORS.textMuted, py: 3 }}>
                          No transactions found for today.
                        </TableCell>
                      </TableRow>
                    )}
                    {!todaysLoading &&
                      pagedTodaysRows.map((r, i) => (
                        <TableRow key={`${r.id ?? "row"}-${historyPage}-${i}`}>
                          <TableCell sx={tbodyCellSx}>{r.rfbag || "—"}</TableCell>
                          <TableCell sx={linkCellSx}>{r.itemname || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.Customercode || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.materialtypename || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.shape || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.quality || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.color || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.Size || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx} align="right">{fmt(Number(r.RemainingWeight))}</TableCell>
                          <TableCell sx={tbodyCellSx}>{r.LockerName || "—"}</TableCell>
                          <TableCell sx={tbodyCellSx}>
                            <Chip
                              size="small"
                              label={r.Last_Reconcileflg || "—"}
                              sx={getStatusChipSx(r.Last_Reconcileflg)}
                            />
                          </TableCell>
                          <TableCell sx={tbodyCellSx}>{String(r.ActionBy || "").trim() || "—"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={todaysData.length}
                page={Math.min(historyPage, Math.max(0, Math.ceil(todaysData.length / historyRowsPerPage) - 1))}
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