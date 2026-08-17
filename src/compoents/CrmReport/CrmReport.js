

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Phone,
  MapPin,
  Mail,
  User,
  TrendingUp,
  CreditCard,
  IndianRupee,
  Activity,
  ShoppingBag,
  FileText,
  Calendar,
  Star,
  Filter,
  Printer,
  List,
  RefreshCw,
  Search,
  Bell,
  ChevronRight,
  Clock,
  MessageSquare,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Zap,
  MessageCircle,
  Users,
  Info,
  History,
  FlaskConical,
  ArrowRightCircle,
  TrendingDown,
  FilePlus,
  Gift,
  RotateCcw,
  PackageX,
  Undo2,
  Truck,
  Landmark,
  Pencil,
  Lock,
  Building2,
  ArrowLeft,
  X,
  ExternalLink,
  Gem,
  // ✅ new — for name-matched sidebar icons
  Boxes,
  ShieldCheck,
  PiggyBank,
  Banknote,
  ArrowLeftRight,
  Repeat,
  Receipt,
  ClipboardList,
  Wallet,
  Wrench,
  Coins,
  UserCheck,
  ScrollText,
  Award,
  PackageCheck,
} from "lucide-react";
import "./CrmReport.scss";
import axios from "axios";
import { GiMetalBar } from "react-icons/gi";

/* ══════════════════════════════════════════════
   API CONFIG
   TODO: replace with the real gateway endpoint
   (same one used by your other SP-backed screens)
   ══════════════════════════════════════════════ */
const API_URL = "/api/gateway"; // <-- put the actual endpoint here

const formatCurrency = (val) =>
  "₹" + Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatShort = (val) => {
  const num = Number(val || 0);
  if (num >= 10000000) return "₹" + (num / 10000000).toFixed(2) + "Cr";
  if (num >= 100000) return "₹" + (num / 100000).toFixed(2) + "L";
  if (num >= 1000) return "₹" + (num / 1000).toFixed(1) + "K";
  return "₹" + num;
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${datePart}, ${timePart}`;
};

const statusColor = (status) => {
  if (["Paid", "Received", "Approved"].includes(status)) return { bg: "#e8f5e9", color: "#2e7d32" };
  if (status === "Pending") return { bg: "#fff3e0", color: "#e65100" };
  return { bg: "#f3e5f5", color: "#7b1fa2" };
};

const CardTitle = ({ title, icon, action }) => (
  <Box className="crm_card_title_row">
    <span className="crm_card_title_icon">{icon}</span>
    <Typography className="crm_card_title_text">{title}</Typography>
    {action && <Box className="crm_card_title_action">{action}</Box>}
  </Box>
);


const CommonAPI = async (body) => {
  let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));

  const APIURL =
    window.location.hostname == "localhost" ||
      window.location.hostname == "nzen"
      ? "http://newnextjs.web/api/report"
      : "https://apilx.optigoapps.com/api/report";

  let AuthorizationToken = sessionStorage.getItem("Token");

  try {
    const headers = {
      Yearcode: `${AllData?.yc}`,
      version: `${AllData?.cuver}`,
      sv: `${AllData?.sv}`,
      sp: 215,
    };
    const response = await axios.post(APIURL, body, { headers });
    return response?.data;
  } catch (error) {
    console.error(
      "API error is:",
      error.response ? error.response.data : error.message
    );
    throw error; // rethrow it so the caller knows API failed
  }
};

/* ══════════════════════════════════════════════
   Response -> UI mappers for the Customer Report
   endpoints (CustomerOverview / QuickCounts /
   TopDealingCategories / RecentActivity)
   ══════════════════════════════════════════════ */
const mapCustomerOverview = (rd) => {
  if (!rd) return null;
  return {
    outstanding: rd.OutstandingAmount ?? 0,
    overdueAmount: rd.OverdueAmount ?? 0,
    creditLimit: rd.CreditLimit ?? 0,
    lifetimeSales: rd.LifetimeSales ?? 0,
    customerSince: formatDate(rd.CustomerSince),
    lastOrderDate: formatDate(rd.LastOrderDate),
    lastOrderNo: rd.LastOrderNo || "-",
    totalOrders: rd.TotalOrdersLifetime ?? 0,
    Amount: rd.Amount ?? 0,
    Diamond: rd.Diamond ?? 0,
    Metal: rd.Metal ?? 0,
    totalOrdersFY: rd.TotalOrdersThisFY ?? 0,
  };
};

const QUICK_COUNT_COLORS = ["#7367f0", "#28c76f", "#ff9f43", "#1e9ff2", "#ea5455", "#00cfe8", "#a742f5", "#82868b"];

const mapQuickCounts = (rd) => {
  if (!rd || !rd.length) return null;
  const maxCount = Math.max(...rd.map((r) => r.MetricCount || 0), 1);
  return rd.map((item, i) => ({
    count: item.MetricCount || 0,
    total: maxCount,
    label: item.MetricName,
    PageName: item.PageName,
    subtitle:
      item.MetricSubText && item.MetricSubText !== "-"
        ? formatShort(Number(item.MetricSubText))
        : null,
    color: QUICK_COUNT_COLORS[i % QUICK_COUNT_COLORS.length],
    redirectUrl: item.RedirectUrl || null,
  }));
};

const CATEGORY_COLORS = ["#7367f0", "#28c76f", "#ff9f43", "#1e9ff2", "#ea5455", "#00cfe8"];

const mapTopCategories = (rd) => {
  if (!rd || !rd.length) return null;
  return rd.map((item, i) => ({
    name: item.CategoryName,
    value: item.Percentage,
    amount: item.Amount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
};

const mapRecentActivity = (rd) => {
  if (!rd || !rd.length) return null;
  return rd.map((item) => ({
    type: item.Type,
    date: item.Date,
    amount: item.Amount,
    status: item.Status,
  }));
};

/* LastFiveInvoices -> invoice list */
const mapLastInvoices = (rd) => {
  if (!rd || !rd.length) return null;
  return rd.map((item) => ({
    invoiceNo: item.InvoiceNo,
    date: item.InvoiceDate,
    amount: item.TotalAmount ?? 0,
    status: item.Status,
  }));
};

const OUTSTANDING_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#f43f5e", "#0ea5e9", "#8b5cf6"];

/* OutstandingMarks -> donut breakdown + total */
const mapOutstandingMarks = (rd) => {
  if (!rd || !rd.length) return null;
  return {
    total: rd[0]?.GrandTotal ?? rd.reduce((s, r) => s + (r.Amount || 0), 0),
    breakdown: rd.map((item, i) => ({
      label: item.CategoryName,
      value: item.Percentage ?? 0,
      amount: item.Amount ?? 0,
      color: OUTSTANDING_COLORS[i % OUTSTANDING_COLORS.length],
    })),
  };
};

/* LastSixMonthsQuotationsSales -> merge quotations (rd) + sales (rd1) by month */
const mapMonthlySales = (rd, rd1) => {
  if ((!rd || !rd.length) && (!rd1 || !rd1.length)) return null;
  const map = {};
  const order = [];
  (rd || []).forEach((q) => {
    map[q.MonthName] = { month: q.MonthName, quote: q.T_Amt ?? 0, sale: 0 };
    order.push(q.MonthName);
  });
  (rd1 || []).forEach((s) => {
    if (!map[s.MonthName]) {
      map[s.MonthName] = { month: s.MonthName, quote: 0, sale: 0 };
      order.push(s.MonthName);
    }
    map[s.MonthName].sale = s.TotalAmount ?? 0;
  });
  return order.map((m) => map[m]);
};

/* LastSixMonthsSalesAndReturns -> Monitor Sale Report (amount / units / returns) */
const mapMonitorSale = (rd) => {
  if (!rd || !rd.length) return null;
  return rd.map((item) => ({
    month: item.MonthName,
    amount: item.NetSaleAmount ?? 0,
    units: item.SaleCount ?? 0,
    returns: item.ReturnCount ?? 0,
  }));
};

/* ══════════════════════════════════════════════
   SideMenuURL -> left sidebar action list
   (DisplayOrder / DisplayName / URL)
   ══════════════════════════════════════════════ */
const SIDE_MENU_COLORS = ["#7367f0", "#28c76f", "#ea5455", "#ff9f43", "#1e9ff2", "#00cfe8", "#a742f5"];

/* ══════════════════════════════════════════════
   Name-matched icons for the left side menu.
   Matched by keyword against DisplayName (case-
   insensitive), first match wins — order the rules
   from most specific to most generic.
   ══════════════════════════════════════════════ */
const SIDE_MENU_ICON_RULES = [
  { keywords: ["kyc"], icon: <ShieldCheck size={14} /> },
  { keywords: ["family", "staff"], icon: <Users size={14} /> },
  { keywords: ["scheme"], icon: <PiggyBank size={14} /> },
  { keywords: ["cash"], icon: <Banknote size={14} /> },
  { keywords: ["bank"], icon: <Landmark size={14} /> },
  { keywords: ["old gold", "gold exchange"], icon: <GiMetalBar size={14} /> },
  { keywords: ["exchange"], icon: <ArrowLeftRight size={14} /> },
  { keywords: ["return"], icon: <Undo2 size={14} /> },
  { keywords: ["repair"], icon: <Wrench size={14} /> },
  { keywords: ["booking", "appointment"], icon: <Calendar size={14} /> },
  { keywords: ["gift", "voucher", "coupon"], icon: <Gift size={14} /> },
  { keywords: ["advance"], icon: <Wallet size={14} /> },
  { keywords: ["ledger", "statement", "account"], icon: <ClipboardList size={14} /> },
  { keywords: ["invoice", "bill", "receipt"], icon: <Receipt size={14} /> },
  { keywords: ["quotation", "quote", "estimate"], icon: <ScrollText size={14} /> },
  { keywords: ["stock", "inventory"], icon: <Boxes size={14} /> },
  { keywords: ["order"], icon: <ShoppingBag size={14} /> },
  { keywords: ["diamond"], icon: <Gem size={14} /> },
  { keywords: ["metal", "bullion"], icon: <Coins size={14} /> },
  { keywords: ["print"], icon: <Printer size={14} /> },
  { keywords: ["history", "activity", "log"], icon: <History size={14} /> },
  { keywords: ["sale", "purchase"], icon: <TrendingUp size={14} /> },
  { keywords: ["reward", "loyalty", "badge"], icon: <Award size={14} /> },
  { keywords: ["delivery", "dispatch", "courier"], icon: <Truck size={14} /> },
  { keywords: ["approve", "verified", "verify"], icon: <UserCheck size={14} /> },
  { keywords: ["complete", "closed", "done"], icon: <PackageCheck size={14} /> },
  { keywords: ["edit", "update"], icon: <Pencil size={14} /> },
  { keywords: ["lock", "block", "hold"], icon: <Lock size={14} /> },
];

const getSideMenuIcon = (label) => {
  const text = String(label || "").toLowerCase();
  const rule = SIDE_MENU_ICON_RULES.find((r) =>
    r.keywords.some((kw) => text.includes(kw))
  );
  return rule ? rule.icon : <FileText size={14} />; // sensible default
};

const mapSideMenu = (rd) => {
  if (!rd || !rd.length) return null;
  return rd
    .slice()
    .sort((a, b) => (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0))
    .map((item, i) => ({
      order: item.DisplayOrder,
      label: item.DisplayName,
      url: item.URL,
      PageName: item.PageName,
      color: SIDE_MENU_COLORS[i % SIDE_MENU_COLORS.length],
      icon: getSideMenuIcon(item.DisplayName),
    }));
};

// DisplayOrder values that open in a new tab vs inside a modal (iframe)
const NEW_TAB_ORDERS = [1, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16];
const MODAL_ORDERS = [4, 9, 14, 17, 18];

// Static width/height per DisplayOrder for modal-opened menu items.
// Adjust these numbers (px) to whatever each screen actually needs.
const MODAL_SIZE_BY_ORDER = {
  2: { width: 1000, height: 500 },  // Customer Stock
  4: { width: 900, height: 650 },  // Customer Stock
  9: { width: 600, height: 500 },   // KYC
  14: { width: 520, height: 480 },  // Continue to Scheme
  17: { width: 800, height: 700 },  // Cash
  18: { width: 800, height: 720 },  // Bank
};
const DEFAULT_MODAL_SIZE = { width: 700, height: 600 };

/* ══════════════════════════════════════════════
   PaymentBehaviour -> 6-month bar chart
   ══════════════════════════════════════════════ */
const mapPaymentBehaviour = (rd) => {
  if (!rd || !rd.length) return null;
  const data = rd.map((item) => ({ month: item.MonthName, payment: item.Amount ?? 0 }));
  const amounts = data.map((d) => d.payment);
  const higherPayment = Math.max(...amounts);
  const lowerPayment = Math.min(...amounts);
  const type = data[data.length - 1].payment >= data[0].payment ? "Improving" : "Declining";
  return { data, higherPayment, lowerPayment, type };
};

/* ══════════════════════════════════════════════
   CustomerNotes -> right sidebar notes list
   Notes come back with a custom-encoded HTML string
   (e.g. "@lt;span@nbsp;style@eqlt;..."), so decode
   the placeholders back to real HTML then strip tags
   to get plain, displayable text.
   ══════════════════════════════════════════════ */
const NOTE_COLORS = ["#7367f0", "#28c76f", "#ff9f43", "#ea5455", "#1e9ff2"];

const decodeNoteEntities = (str) => {
  if (!str) return "";
  return str
    .replace(/@lt;/g, "<")
    .replace(/@gt;/g, ">")
    .replace(/@quot;/g, '"')
    .replace(/@eqlt;/g, "=")
    .replace(/@nbsp;/g, " ");
};

const stripHtml = (html) => {
  if (!html) return "";
  if (typeof window === "undefined" || typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
};

const mapCustomerNotes = (rd) => {
  if (!rd || !rd.length) return null;
  return rd.map((item, i) => ({
    id: i,
    by: item.DisplayName,
    note: stripHtml(decodeNoteEntities(item.Note)),
    color: NOTE_COLORS[i % NOTE_COLORS.length],
  }));
};

/* ══════════════════════════════════════════════
   CallLogs -> "Next Follow Up" replaced with a
   call-log list + quick "log a call" entry.
   CallStatus: 1 = Incoming (received), 2 = Outgoing
   ══════════════════════════════════════════════ */
const mapCallLogs = (rd) => {
  if (!rd || !rd.length) return null;
  return rd
    .slice()
    .sort((a, b) => new Date(b.EntryDate) - new Date(a.EntryDate))
    .map((item, i) => ({
      id: i,
      date: item.EntryDate,
      status: item.CallStatus,
      note: item.SpecialNote,
      name: item.CustomerName,
    }));
};

const CircularStat = ({ count, total, label, subtitle, color = "#7367f0", size = 76, icon }) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total ? Math.min(count / total, 1) : 0;
  const dash = circumference * pct;

  return (
    <Box className="crm_ring_wrap">
      <Box className="crm_ring_svg_box" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ede9f8" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <Box className="crm_ring_center">
          {icon && <Box className="crm_ring_icon" style={{ color }}>{icon}</Box>}
          <Typography className="crm_ring_count" style={{ color }}>{count}</Typography>
        </Box>
      </Box>
      <Typography className="crm_ring_label">{label}</Typography>
      {subtitle && <Typography className="crm_ring_sub">{subtitle}</Typography>}
    </Box>
  );
};


/* ══════════════════════════════════════════════
   Quick Counts — ring grid
   ══════════════════════════════════════════════ */
const QuickCounts = ({ quickCount }) => (
  <Paper elevation={0} className="crm_card crm_quickcount_card">
    <CardTitle title="Quick Counts" icon={<Zap size={14} />} />
    <Divider sx={{ mb: 1.25 }} />
    <Box className="crm_ring_grid">
      {quickCount?.map((item, i) => {
        const isBlocked = item?.label === "Visits" || item?.label === "Follow Ups";
        const canNavigate = !isBlocked && !!item?.redirectUrl;
        return (
          <Box
            key={i}
            onClick={() => {
              if (!canNavigate) return;
              if (window?.parent?.postMessage) {
                window.parent.postMessage(
                  {
                    type: "ADD_TAB",
                    evt: "DynamicReport",
                    payload: {
                      TabName: item?.PageName,
                      TabUrl: item?.redirectUrl,
                    },
                  },
                  "*"
                );
              }
            }}
            style={{ cursor: canNavigate ? "pointer" : "default" }}
          >
            <CircularStat
              count={item?.count}
              total={item?.total}
              label={item?.label}
              subtitle={item?.subtitle}
              color={item?.color}
            />
          </Box>
        );
      })}
    </Box>
  </Paper>
);


const CrmReport = () => {
  const [activeMenu, setActiveMenu] = useState();
  const [activeSection, setActiveSection] = useState();
  const [view, setView] = useState("search");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const clientIpAddress = sessionStorage.getItem("clientIpAddress");

  // Live report data (fetched on "View Detail" click). Each is null until its
  // API call resolves, so the UI can fall back to the sample data meanwhile.
  const [reportLoading, setReportLoading] = useState(false);
  const [apiCustomerInfo, setApiCustomerInfo] = useState(null);
  const [apiQuickCounts, setApiQuickCounts] = useState(null);
  const [apiTopCategories, setApiTopCategories] = useState(null);
  const [apiRecentActivity, setApiRecentActivity] = useState(null);
  const [apiLastInvoices, setApiLastInvoices] = useState(null);
  const [apiOutstandingMarks, setApiOutstandingMarks] = useState(null);
  const [apiMonthlySales, setApiMonthlySales] = useState(null);
  const [apiMonitorSale, setApiMonitorSale] = useState(null);
  const [apiSideMenu, setApiSideMenu] = useState(null);
  const [apiPaymentBehaviour, setApiPaymentBehaviour] = useState(null);
  const [apiCustomerNotes, setApiCustomerNotes] = useState(null);
  const [apiCallLogs, setApiCallLogs] = useState(null);

  // Call Logs — quick entry state
  const [callLogNote, setCallLogNote] = useState("");
  const [callLogSaving, setCallLogSaving] = useState(false);

  // Modal (iframe) state for side-menu actions whose DisplayOrder is in MODAL_ORDERS
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalSize, setModalSize] = useState(DEFAULT_MODAL_SIZE);

  // Evo Remarks modal
  const [evoRemarksOpen, setEvoRemarksOpen] = useState(false);
  const [evoRemarksLoading, setEvoRemarksLoading] = useState(false);
  const [evoRemarksData, setEvoRemarksData] = useState(null);

  const customerInfo = {
    ...(apiCustomerInfo || {}),
    id: selectedCustomer?.customercode,
    name: selectedCustomer?.customername,
    mobile: selectedCustomer?.mobileno,
    email: selectedCustomer?.email1,
    category: selectedCustomer?.firmname
  }

  const displayQuickCount = apiQuickCounts;
  const displayTopCategories = apiTopCategories;
  const displayRecentActivity = apiRecentActivity;
  const displayLastInvoices = apiLastInvoices;
  const displayOutstandingMarks = apiOutstandingMarks;
  const displayMonthlySales = apiMonthlySales;
  const displayMonitorSale = apiMonitorSale;
  const displaySideMenu = apiSideMenu;
  const visibleSideMenu = displaySideMenu?.filter((item) => item.order !== 2);
  const familyStaffMenuItem = displaySideMenu?.find((item) => item.order === 2);
  const displayPaymentBehaviour = apiPaymentBehaviour;
  const displayCustomerNotes = apiCustomerNotes;
  const displayCallLogs = apiCallLogs;

  /* ══════════════════════════════════════════════
     API CALL — CustomerSearch (sp=215)
     ══════════════════════════════════════════════ */
  const handleSearch = async () => {
    const q = query.trim();
    setSearchTouched(true);
    if (!q) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams") || "{}");
      const body = {
        con: JSON.stringify({
          id: "",
          mode: "CustomerSearch",
          appuserid: AllData?.uid,
          IPAddress: clientIpAddress
        }),
        p: JSON.stringify({ SearchValue: q }),
        f: "DynamicAdvanceCRM",
      };

      const res = await CommonAPI(body);

      if (res?.Data?.rd) {
        setResults(res?.Data?.rd);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("CustomerSearch API error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════
   EvoRemarks -> grouped by SalesRepName
   ══════════════════════════════════════════════ */
  const mapEvoRemarks = (rd) => {
    if (!rd || !rd.length) return null;
    return rd.map((item) => ({
      date: item.entrydate,
      repName: item.SalesRepName,
      appName: item.AppName,
      remarkType: item.RemarkType,
      remark: item.Remark,
    }));
  };

  const groupEvoRemarksByRep = (list) => {
    if (!list || !list.length) return [];
    const map = {};
    const order = [];
    list.forEach((item) => {
      const key = item.repName || "Unknown";
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(item);
    });
    return order.map((repName) => ({
      repName,
      remarks: map[repName].sort((a, b) => new Date(b.date) - new Date(a.date)),
    }));
  };

  useEffect(() => {
    const getDataremark = async () => {
      if (!selectedCustomer?.customercode) return;
      try {
        const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams") || "{}");
        const body = {
          con: JSON.stringify({
            id: "",
            mode: "EvoRemarks",
            appuserid: AllData?.uid,
            IPAddress: clientIpAddress,
          }),
          p: JSON.stringify({ CustomerCode: selectedCustomer.customercode }),
          f: "DynamicAdvanceCRM",
        };
        const res = await CommonAPI(body);
        setEvoRemarksData(mapEvoRemarks(res?.Data?.rd));
      } catch (err) {
        console.error("EvoRemarks API error:", err);
        setEvoRemarksData(null);
      } finally {
        setEvoRemarksLoading(false);
      }
    };

    getDataremark();
  }, [selectedCustomer])



  const handleOpenEvoRemarks = async () => {
    setEvoRemarksOpen(true);
  };


  const handleCloseEvoRemarks = () => {
    setEvoRemarksOpen(false);
    setEvoRemarksData(null);
  };

  const remarkTypeColor = (type) => {
    if (type === "Special Remark") return { bg: "#fff0f0", color: "#ea5455" };
    if (type === "Family Remark") return { bg: "#e8f5e9", color: "#28c76f" };
    return { bg: "#eaf2ff", color: "#1e9ff2" }; // Person Remark / default
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  /* ══════════════════════════════════════════════
     API CALLS — CustomerOverview / QuickCounts /
     TopDealingCategories / RecentActivity / SideMenuURL /
     PaymentBehaviour / CustomerNotes / CallLogs / ...
     Fired together on "View Detail" click, keyed by
     the selected customer's CustomerCode.
     ══════════════════════════════════════════════ */
  const handleViewDetail = async (record) => {
    setSelectedCustomer(record);
    setView("report");

    // Reset any previously-loaded report data and show the loader
    // while the fresh customer's data is fetched.
    setApiCustomerInfo(null);
    setApiQuickCounts(null);
    setApiTopCategories(null);
    setApiRecentActivity(null);
    setApiLastInvoices(null);
    setApiOutstandingMarks(null);
    setApiMonthlySales(null);
    setApiMonitorSale(null);
    setApiSideMenu(null);
    setApiPaymentBehaviour(null);
    setApiCustomerNotes(null);
    setApiCallLogs(null);
    setCallLogNote("");
    setReportLoading(true);

    const customerCode = record.customercode;

    try {
      const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams") || "{}");
      const buildBody = (mode) => ({
        con: JSON.stringify({
          id: "",
          mode,
          appuserid: AllData?.uid,
          IPAddress: clientIpAddress,
        }),
        p: JSON.stringify({ CustomerCode: customerCode }),
        f: "DynamicAdvanceCRM",
      });

      const [
        overviewRes, quickCountRes, categoriesRes, activityRes,
        invoicesRes, outstandingRes, monthlySalesRes, monitorSaleRes,
        sideMenuRes, paymentBehaviourRes, customerNotesRes, callLogsRes,
      ] = await Promise.allSettled([
        CommonAPI(buildBody("CustomerOverview")),
        CommonAPI(buildBody("QuickCounts")),
        CommonAPI(buildBody("TopDealingCategories")),
        CommonAPI(buildBody("RecentActivity")),
        CommonAPI(buildBody("LastFiveInvoices")),
        CommonAPI(buildBody("OutstandingMarks")),
        CommonAPI(buildBody("LastSixMonthsQuotationsSales")),
        CommonAPI(buildBody("LastSixMonthsSalesAndReturns")),
        CommonAPI(buildBody("SideMenuURL")),
        CommonAPI(buildBody("PaymentBehaviour")),
        CommonAPI(buildBody("CustomerNotes")),
        CommonAPI(buildBody("CallLogs")),
      ]);
      console.log('overviewRes: ', overviewRes);

      if (overviewRes.status === "fulfilled") {
        setApiCustomerInfo(mapCustomerOverview(overviewRes.value?.Data?.rd?.[0]));
      } else {
        console.error("CustomerOverview API error:", overviewRes.reason);
      }

      if (quickCountRes.status === "fulfilled") {
        setApiQuickCounts(mapQuickCounts(quickCountRes.value?.Data?.rd));
      } else {
        console.error("QuickCounts API error:", quickCountRes.reason);
      }

      if (categoriesRes.status === "fulfilled") {
        setApiTopCategories(mapTopCategories(categoriesRes.value?.Data?.rd));
      } else {
        console.error("TopDealingCategories API error:", categoriesRes.reason);
      }

      if (activityRes.status === "fulfilled") {
        setApiRecentActivity(mapRecentActivity(activityRes.value?.Data?.rd));
      } else {
        console.error("RecentActivity API error:", activityRes.reason);
      }

      if (invoicesRes.status === "fulfilled") {
        setApiLastInvoices(mapLastInvoices(invoicesRes.value?.Data?.rd));
      } else {
        console.error("LastFiveInvoices API error:", invoicesRes.reason);
      }

      if (outstandingRes.status === "fulfilled") {
        setApiOutstandingMarks(mapOutstandingMarks(outstandingRes.value?.Data?.rd));
      } else {
        console.error("OutstandingMarks API error:", outstandingRes.reason);
      }

      if (monthlySalesRes.status === "fulfilled") {
        setApiMonthlySales(
          mapMonthlySales(monthlySalesRes.value?.Data?.rd, monthlySalesRes.value?.Data?.rd1)
        );
      } else {
        console.error("LastSixMonthsQuotationsSales API error:", monthlySalesRes.reason);
      }

      if (monitorSaleRes.status === "fulfilled") {
        setApiMonitorSale(mapMonitorSale(monitorSaleRes.value?.Data?.rd));
      } else {
        console.error("LastSixMonthsSalesAndReturns API error:", monitorSaleRes.reason);
      }

      if (sideMenuRes.status === "fulfilled") {
        setApiSideMenu(mapSideMenu(sideMenuRes.value?.Data?.rd));
      } else {
        console.error("SideMenuURL API error:", sideMenuRes.reason);
      }

      if (paymentBehaviourRes.status === "fulfilled") {
        setApiPaymentBehaviour(mapPaymentBehaviour(paymentBehaviourRes.value?.Data?.rd));
      } else {
        console.error("PaymentBehaviour API error:", paymentBehaviourRes.reason);
      }

      if (customerNotesRes.status === "fulfilled") {
        setApiCustomerNotes(mapCustomerNotes(customerNotesRes.value?.Data?.rd));
      } else {
        console.error("CustomerNotes API error:", customerNotesRes.reason);
      }

      if (callLogsRes.status === "fulfilled") {
        setApiCallLogs(mapCallLogs(callLogsRes.value?.Data?.rd));
      } else {
        console.error("CallLogs API error:", callLogsRes.reason);
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleEditCustomer = () => {
    setView("search");
    setSelectedCustomer(null);
    setQuery("");
    setSearchTouched(false);
    setResults([]);
    setApiCustomerInfo(null);
    setApiQuickCounts(null);
    setApiTopCategories(null);
    setApiRecentActivity(null);
    setApiLastInvoices(null);
    setApiOutstandingMarks(null);
    setApiMonthlySales(null);
    setApiMonitorSale(null);
    setApiSideMenu(null);
    setApiPaymentBehaviour(null);
    setApiCustomerNotes(null);
    setApiCallLogs(null);
    setCallLogNote("");
    setReportLoading(false);
  };

  /* ══════════════════════════════════════════════
     Left panel action click — DisplayOrder decides
     whether the link opens in a new tab or a modal
     ══════════════════════════════════════════════ */
  const handleMenuClick = (item, i) => {
    if (!item?.url) return;
    setActiveMenu(i);
    if (MODAL_ORDERS.includes(item.order)) {
      setModalTitle(item.label);
      setModalUrl(item.url);
      setModalSize(MODAL_SIZE_BY_ORDER[item.order] || DEFAULT_MODAL_SIZE);
      setModalOpen(true);
    } else {
      if (window?.parent?.postMessage) {
        window.parent.postMessage(
          {
            type: "ADD_TAB",
            evt: "DynamicReport",
            payload: {
              TabName: item?.PageName,
              TabUrl: item?.url,
            },
          },
          "*"
        );
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalUrl("");
    setModalTitle("");
    setModalSize(DEFAULT_MODAL_SIZE);
  };

  /* ══════════════════════════════════════════════
     Call Logs — quick "log a call" entry.
     CustomerCode comes from the selected customer and
     EntryDate is stamped server-side, so the only input
     needed here is the note; clicking Incoming/Outgoing
     saves immediately (no separate submit button).
     ══════════════════════════════════════════════ */
  const handleSaveCallLog = async (status) => {
    if (!selectedCustomer?.customercode || callLogSaving) return;
    if (!callLogNote.trim()) return; // require a note before saving
    setCallLogSaving(true);
    try {
      const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams") || "{}");
      const buildBody = (mode, p) => ({
        con: JSON.stringify({
          id: "",
          mode,
          appuserid: AllData?.uid,
          IPAddress: clientIpAddress,
        }),
        p: JSON.stringify(p),
        f: "DynamicAdvanceCRM",
      });

      const saveRes = await CommonAPI(
        buildBody("SaveCallLog", {
          CustomerCode: selectedCustomer.customercode,
          CallStatus: status,
          SpecialNote: callLogNote.trim(),
        })
      );

      if (saveRes?.Data?.rd1?.[0]?.IsSuccess === 1) {
        setCallLogNote("");
        const listRes = await CommonAPI(
          buildBody("CallLogs", { CustomerCode: selectedCustomer.customercode })
        );
        setApiCallLogs(mapCallLogs(listRes?.Data?.rd));
      } else {
        console.error("SaveCallLog failed:", saveRes?.Data?.rd1?.[0]?.ResponseMessage);
      }
    } catch (err) {
      console.error("SaveCallLog API error:", err);
    } finally {
      setCallLogSaving(false);
    }
  };

  const priorityStyle = (p) => {
    if (p === "High") return { bg: "#fff0f0", color: "#ea5455" };
    if (p === "Medium") return { bg: "#fff3e0", color: "#ff9f43" };
    return { bg: "#e8f5e9", color: "#28c76f" };
  };

  const sectionTabs = [
    { icon: <Users size={11} />, label: "Family/Staff Info" },
    { icon: <Activity size={11} />, label: "Customer Activity" },
  ];

  /* ══════════════════════════════════════════════
     SEARCH VIEW (full page)
     ══════════════════════════════════════════════ */
  if (view === "search") {
    return (
      <Box className="crm_search_page">
        <Paper elevation={6} className="crm_search_card">
          <Box className="crm_search_header">
            <Box className="crm_search_header_icon"><Search size={20} /></Box>
            <Box>
              <Typography className="crm_search_title">Find Customer</Typography>
              <Typography className="crm_search_sub">
                Search by name, customer ID, or mobile number to open their report
              </Typography>
            </Box>
          </Box>

          <Box className="crm_search_input_row">
            <input
              className="crm_search_input"
              placeholder="I'm looking for.."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchTouched) setSearchTouched(false);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className="crm_search_btn" onClick={handleSearch} disabled={loading}>
              {loading ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Search size={15} />}
              {loading ? "Searching" : "Search"}
            </button>
          </Box>

          {searchTouched && !loading && results.length === 0 && (
            <Typography className="crm_search_error">
              No customer matched “{query}”. Try their name, ID, or mobile number.
            </Typography>
          )}
        </Paper>

        {results.length > 0 && (
          <Box className="crm_results_wrap">
            <Typography className="crm_results_hd">
              {results.length} customer{results.length > 1 ? "s" : ""} found
            </Typography>
            <Box className="crm_results_grid">
              {results.map((r, i) => (
                <Paper key={i} elevation={0} className="crm_result_card">
                  <Box className="crm_result_top">
                    <Avatar className="crm_result_avatar">{(r.customername || "?").charAt(0)}</Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography className="crm_result_name" noWrap>{r.customername}</Typography>
                      <Typography className="crm_result_code">{r.customercode}</Typography>
                    </Box>
                  </Box>

                  <Box className="crm_result_detail_row">
                    <Building2 size={12} />
                    <Typography noWrap>{r.firmname || "—"}</Typography>
                  </Box>
                  <Box className="crm_result_detail_row">
                    <Phone size={12} />
                    <Typography noWrap>{r.mobileno || "—"}</Typography>
                  </Box>
                  <Box className="crm_result_detail_row">
                    <Mail size={12} />
                    <Typography noWrap>{r.email1 || "—"}</Typography>
                  </Box>

                  <button className="crm_show_report_btn crm_result_btn" onClick={() => handleViewDetail(r)}>
                    View Detail
                    <ChevronRight size={15} />
                  </button>
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  /* ══════════════════════════════════════════════
     REPORT VIEW (full page)
     ══════════════════════════════════════════════ */
  return (
    <Box className="CrmReport_main">

      {/* ══════════ TOP HEADER BAR ══════════ */}
      <Box className="crm_topbar">

        {/* Row 1: Customer Info + Action Buttons */}
        <Box className="crm_topbar_row1">
          <Box className="crm_topbar_left">
            <MuiTooltip title="Back to search" placement="top" arrow>
              <Box className="crm_back_btn" onClick={handleEditCustomer}>
                <ArrowLeft size={16} />
              </Box>
            </MuiTooltip>
            <Avatar className="crm_topbar_avatar">{customerInfo.name.charAt(0)}</Avatar>
            <Box>
              <Box className="crm_topbar_id_row">
                <Typography className="crm_topbar_id">{customerInfo.id}</Typography>
                <Box className="crm_cat_badge">{customerInfo.category}</Box>
              </Box>
              <Typography className="crm_topbar_name">{customerInfo.name}</Typography>
              <Box className="crm_topbar_meta">
                {customerInfo?.mobile && (
                  <>
                    <Phone size={11} />
                    <span>{customerInfo.mobile}</span>
                  </>
                )}
                {customerInfo?.email && (
                  <>
                    <Mail size={11} />
                    <span>{customerInfo.email}</span>
                  </>
                )}
                {customerInfo?.address && (
                  <>
                    <MapPin size={11} />
                    <span>{customerInfo.address}</span>
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {/* Right: at-a-glance stat chips */}
          <Box className="crm_topbar_stats">
            <Box className="crm_stat_chip crm_stat_info">
              <Box className="crm_stat_ico"><IndianRupee size={14} /></Box>
              <Box className="crm_stat_txt">
                <Typography className="crm_overview_val">{formatCurrency(customerInfo.outstanding)}</Typography>
                <Typography className="crm_overview_lbl">Outstanding</Typography>
              </Box>
            </Box>
            <Box className="crm_stat_chip crm_stat_info">
              <Box className="crm_stat_ico"><GiMetalBar size={14} /></Box>
              <Box className="crm_stat_txt">
                <Typography className="crm_overview_val">{customerInfo?.Metal} gm</Typography>
                <Typography className="crm_overview_lbl">Metal Balance</Typography>
              </Box>
            </Box>
            <Box className="crm_stat_chip crm_stat_info">
              <Box className="crm_stat_ico"><Gem size={14} /></Box>
              <Box className="crm_stat_txt">
                <Typography className="crm_overview_val">{customerInfo?.Diamond} ctw</Typography>
                <Typography className="crm_overview_lbl">Diamond Balance</Typography>
              </Box>
            </Box>
            {(() => {
              const isHealthy = Number(customerInfo.creditLimit) >= Number(customerInfo.outstanding);
              const creditColor = isHealthy
                ? { bg: "#e8f5e9", color: "#28c76f" }   // green
                : { bg: "#fff0f0", color: "#ea5455" };  // red

              return (
                <>
                  <Box className="crm_stat_chip crm_stat_success">
                    <Box className="crm_overview_icon" style={{ background: creditColor.bg, color: creditColor.color }}>
                      <CreditCard size={16} />
                    </Box>
                    <Box className="crm_overview_text">
                      <p
                        className="crm_overview_val_n"
                        style={{ margin: "0px", color: creditColor.color }}
                      >
                        {formatCurrency(customerInfo.creditLimit)}
                      </p>
                      <Typography className="crm_overview_lbl">Credit Limit</Typography>
                    </Box>
                  </Box>
                </>
              );
            })()}
            <Box className="crm_stat_chip crm_stat_success">
              <Box className="crm_stat_ico"><TrendingUp size={14} /></Box>
              <Box className="crm_stat_txt">
                <Typography className="crm_overview_val">{formatCurrency(customerInfo.lifetimeSales)}</Typography>
                <Typography className="crm_overview_lbl">Lifetime Sales</Typography>
              </Box>
            </Box>
            <Box className="crm_stat_chip crm_stat_primary">
              <Box className="crm_stat_ico"><ShoppingBag size={14} /></Box>
              <Box className="crm_stat_txt">
                <Typography className="crm_overview_val">{customerInfo.totalOrders}</Typography>
                <Typography className="crm_overview_lbl">Total Orders</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box className="crm_section_tabs_row">
          {sectionTabs.map((tab, i) => (
            <Box
              key={i}
              className={`crm_sec_tab`}
              onClick={() => {
                setActiveSection(i);
                if (tab.label === "Family/Staff Info" && familyStaffMenuItem?.url) {
                  setModalTitle(familyStaffMenuItem.label);
                  setModalUrl(familyStaffMenuItem.url);
                  setModalSize(MODAL_SIZE_BY_ORDER[2] || DEFAULT_MODAL_SIZE);
                  setModalOpen(true);
                }

                if (tab.label === "Customer Activity") {
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                  }, 100);
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Box>
          ))}


          <Box
            className={`crm_sec_tab`}
            onClick={() => {
              setActiveMenu("evoRemarks");
              handleOpenEvoRemarks();
            }}
          >
            <MessageCircle size={14} />
            <span>Evo Remarks</span>
          </Box>
        </Box>
      </Box>

      <Box className="crm_body" style={{ position: "relative" }}>
        {reportLoading && (
          <Box className="crm_report_loading_overlay">
            <CircularProgress size={34} sx={{ color: "#7367f0" }} />
            <Typography className="crm_report_loading_text">Loading customer report…</Typography>
          </Box>
        )}

        {/* ── LEFT SIDEBAR ── */}
        {/* ── LEFT SIDEBAR ── */}
        <Box className="crm_left_panel">
          {visibleSideMenu?.map((item, i) => (
            <Box
              key={i}
              className={`crm_menu_item${activeMenu === i ? " active" : ""}`}
              onClick={() => handleMenuClick(item, i)}
            >
              <Box
                className="crm_menu_icon_box"
                style={{ background: activeMenu === i ? item.color : item.color + "18", color: activeMenu === i ? "#fff" : item.color }}
              >
                {item.icon}
              </Box>
              <Typography className="crm_menu_label">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── CENTER DASHBOARD ── */}
        <Box className="crm_center_panel">
          <QuickCounts quickCount={displayQuickCount} />

          <Box className="crm_half_row">
            <Paper elevation={0} className="crm_card crm_card_flex">
              <CardTitle title="Top Dealing Categories" icon={<ShoppingBag size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ResponsiveContainer width="52%" height={175}>
                  <PieChart>
                    <Pie
                      data={displayTopCategories?.filter((item) => Number(item.amount) > 0) || []}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={76}
                      paddingAngle={3} dataKey="value"
                    >
                      {displayTopCategories
                        ?.filter((item) => Number(item.amount) > 0)
                        ?.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ flex: 1 }}>
                  {displayTopCategories
                    ?.filter((item) => Number(item.amount) > 0)
                    ?.map((item, i) => (
                      <Box key={i} className="crm_legend_row">
                        <Box className="crm_legend_dot" style={{ background: item.color }} />
                        <Typography className="crm_legend_name">{item.name}</Typography>
                        <Typography className="crm_legend_pct" style={{ color: item.color }}>{item.value}%</Typography>
                        <Typography className="crm_legend_amt">{formatShort(item.amount)}</Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} className="crm_card crm_card_flex">
              <CardTitle title="Payment Behaviour" icon={<TrendingUp size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <Chip
                  label={displayPaymentBehaviour?.type || "-"}
                  size="small"
                  sx={{ background: "#e8f5e9", color: "#2e7d32", fontSize: 10, fontWeight: 700, height: 20 }}
                />
                <Typography sx={{ fontSize: 10, color: "#888" }}>
                  Higher: {formatShort(displayPaymentBehaviour?.higherPayment)} &nbsp;|&nbsp; Lower: {formatShort(displayPaymentBehaviour?.lowerPayment)}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={152}>
                <BarChart data={displayPaymentBehaviour?.data || []} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="crmPayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: "rgba(79,70,229,0.06)" }} contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "Poppins" }} />
                  <Bar dataKey="payment" fill="url(#crmPayGrad)" radius={[6, 6, 0, 0]} name="Payment" maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          <Box className="crm_half_row">
            <Paper elevation={0} className="crm_right_card" style={{ width: '50%' }}>
              <CardTitle title="Recent Activity" icon={<Clock size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Type", "Date", "Amount", "Status"].map((h) => (
                        <TableCell key={h} className="crm_th">{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayRecentActivity?.map((row, i) => {
                      const sc = statusColor(row.status);
                      return (
                        <TableRow key={i} className="crm_tr">
                          <TableCell className="crm_td">{row.type}</TableCell>
                          <TableCell className="crm_td">{row.date}</TableCell>
                          <TableCell className="crm_td crm_td_bold">{formatCurrency(row.amount)}</TableCell>
                          <TableCell className="crm_td">
                            <Chip label={row.status} size="small" sx={{ background: sc.bg, color: sc.color, fontSize: 9, fontWeight: 700, height: 18 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper elevation={0} className="crm_right_card crm_invoices_card" style={{ width: '25%' }}>
              <CardTitle title="Last Invoices" icon={<FileText size={14} />} />
              <Divider sx={{ mb: 1 }} />
              {displayLastInvoices?.map((inv, i) => {
                const sc = statusColor(inv.status);
                return (
                  <Box key={i} className="crm_inv_item">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className="crm_inv_no" noWrap>{inv.invoiceNo}</Typography>
                      <Typography className="crm_inv_date">{inv.date}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography className="crm_inv_amt">{formatCurrency(inv.amount)}</Typography>
                      <Chip label={inv.status} size="small" sx={{ background: sc.bg, color: sc.color, fontSize: 9, fontWeight: 700, height: 18, fontFamily: "Poppins" }} />
                    </Box>
                  </Box>
                );
              })}
            </Paper>

            <Paper elevation={0} className="crm_right_card" style={{ width: '25%' }}>
              <CardTitle title="Outstanding Marks" icon={<CreditCard size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <Box style={{ display: 'flex' }}>
                <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <PieChart width={160} height={155}>
                    <Pie
                      data={displayOutstandingMarks?.breakdown || []}
                      cx={80} cy={75}
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3} dataKey="value"
                    >
                      {displayOutstandingMarks?.breakdown?.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                  <Box className="crm_donut_center_box">
                    <Typography className="crm_donut_val">{formatShort(displayOutstandingMarks?.total)}</Typography>
                    <Typography className="crm_donut_sub">Total</Typography>
                  </Box>
                </Box>
                <Box>
                  {displayOutstandingMarks?.breakdown?.map((item, i) => (
                    <Box key={i} className="crm_out_row">
                      <Box className="crm_out_dot" style={{ background: item.color }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography className="crm_out_lbl">{item.label}</Typography>
                        <Typography className="crm_out_amt">{formatCurrency(item.amount)}</Typography>
                      </Box>
                      <Typography className="crm_out_pct" style={{ color: item.color }}>{item.value}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>

          <Box className="crm_half_row">
            <Paper elevation={0} className="crm_card">
              <CardTitle title="6 Months Quote & Sales Overview" icon={<TrendingUp size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={displayMonthlySales || []} margin={{ top: 0, right: 10, left: -10, bottom: 0 }} barGap={4}>
                  <defs>
                    <linearGradient id="crmQuoteGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="crmSaleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: "rgba(124,58,237,0.06)" }} contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "Poppins" }} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Poppins" }} />
                  <Bar dataKey="quote" name="Quotation" fill="url(#crmQuoteGrad)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="sale" name="Sale" fill="url(#crmSaleGrad)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            <Paper elevation={0} className="crm_card">
              <CardTitle title="Monitor Sale Report" icon={<ShoppingBag size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={displayMonitorSale || []} margin={{ top: 0, right: 10, left: -10, bottom: 0 }} barGap={3}>
                  <defs>
                    <linearGradient id="crmMsAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="crmMsUnits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="crmMsRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip
                    formatter={(v, n) => (n === "Sale Amount" ? formatCurrency(v) : v)}
                    cursor={{ fill: "rgba(37,99,235,0.06)" }}
                    contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "Poppins" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Poppins" }} />
                  <Bar dataKey="amount" name="Sale Amount" fill="url(#crmMsAmt)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="units" name="Units" fill="url(#crmMsUnits)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="returns" name="Returns" fill="url(#crmMsRet)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        </Box>

        {/* ── RIGHT SIDEBAR ── */}
        <Box className="crm_right_panel">
          <Paper elevation={0} className="crm_right_card">
            <CardTitle title="Customer Notes" icon={<MessageSquare size={14} />} />
            <Divider sx={{ mb: 1 }} />
            {(displayCustomerNotes || []).map((note) => (
              <Box key={note.id} className="crm_note_item" style={{ borderLeftColor: note.color }}>
                <Box className="crm_note_header">
                  <Box className="crm_note_avatar" style={{ background: note.color }}>
                    {(note.by || "?").charAt(0)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className="crm_note_by" noWrap>{note.by}</Typography>
                  </Box>
                </Box>
                <Typography className="crm_note_text">{note.note}</Typography>
              </Box>
            ))}
            {(!displayCustomerNotes || !displayCustomerNotes.length) && (
              <Typography sx={{ fontSize: 11, color: "#9e9e9e", fontFamily: "Poppins" }}>No notes yet.</Typography>
            )}
          </Paper>

          {/* ══ CALL LOGS (replaces "Next Follow Up") ══ */}
          <Paper elevation={0} className="crm_right_card">
            <CardTitle title="Call Logs" icon={<PhoneCall size={14} />} />
            <Divider sx={{ mb: 1 }} />

            {/* Quick entry — CustomerCode + EntryDate are filled server-side.
                Typing a note is optional; clicking Incoming/Outgoing saves
                immediately, there is no separate submit button. */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.25 }}>
              <input
                value={callLogNote}
                onChange={(e) => setCallLogNote(e.target.value)}
                placeholder="Type a note, then tap Incoming/Outgoing…"
                disabled={callLogSaving}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 8,
                  border: "1.5px solid #ede9f8",
                  background: "#fafbff",
                  fontSize: 11,
                  fontFamily: "Poppins, sans-serif",
                  outline: "none",
                }}
              />
              <Box sx={{ display: "flex", gap: 0.75 }}>
                <Box
                  component="button"
                  onClick={() => handleSaveCallLog(1)}
                  disabled={callLogSaving || !callLogNote.trim()}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    height: 30,
                    border: "1px solid #cdeedd",
                    borderRadius: "8px",
                    background: "#e8f8f0",
                    color: "#28c76f",
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: "Poppins, sans-serif",
                    cursor: callLogSaving || !callLogNote.trim() ? "default" : "pointer",
                    opacity: callLogSaving || !callLogNote.trim() ? 0.45 : 1,
                  }}
                >
                  <PhoneIncoming size={13} />
                  Add Incoming
                </Box>
                <Box
                  component="button"
                  onClick={() => handleSaveCallLog(2)}
                  disabled={callLogSaving || !callLogNote.trim()}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    height: 30,
                    border: "1px solid #d6e4fb",
                    borderRadius: "8px",
                    background: "#eaf2ff",
                    color: "#1e9ff2",
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: "Poppins, sans-serif",
                    cursor: callLogSaving || !callLogNote.trim() ? "default" : "pointer",
                    opacity: callLogSaving || !callLogNote.trim() ? 0.45 : 1,
                  }}
                >
                  <PhoneOutgoing size={13} />
                  Add Outgoing
                </Box>
              </Box>
            </Box>

            {/* List */}
            <Box sx={{ maxHeight: 700, overflowY: "auto" }}>
              {(displayCallLogs || []).map((log) => {
                const isIncoming = log.status === 1;
                const color = isIncoming ? "#28c76f" : "#1e9ff2";
                const bg = isIncoming ? "#e8f8f0" : "#eaf2ff";
                return (
                  <Box
                    key={log.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.875,
                      py: 0.75,
                      borderBottom: "1px solid #f5f3ff",
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: bg,
                        color,
                      }}
                    >
                      {isIncoming ? <PhoneIncoming size={13} /> : <PhoneOutgoing size={13} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: "Poppins", color: "#3a3541" }} noWrap>
                          {log.name}
                        </Typography>
                        <Chip
                          label={isIncoming ? "Incoming" : "Outgoing"}
                          size="small"
                          sx={{ background: bg, color, fontSize: 8.5, fontWeight: 700, height: 16, fontFamily: "Poppins" }}
                        />
                      </Box>
                      {log.note && (
                        <Typography sx={{ fontSize: 10.5, fontFamily: "Poppins", color: "#4a4554", lineHeight: 1.4 }}>
                          {log.note}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: 9, fontFamily: "Poppins", color: "#9e9e9e", mt: 0.25 }}>
                        {formatDateTime(log.date)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              {(!displayCallLogs || !displayCallLogs.length) && (
                <Typography sx={{ fontSize: 11, color: "#9e9e9e", fontFamily: "Poppins" }}>No calls logged yet.</Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* ══════════ MODAL for Evo Remarks ══════════ */}
      <Dialog
        open={evoRemarksOpen}
        onClose={handleCloseEvoRemarks}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { maxHeight: "80vh" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: "1px solid #ede9f8" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MessageCircle size={16} color="#7367f0" />
            <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "Poppins" }}>Evo Remarks</Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseEvoRemarks}>
            <X size={16} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2 }}>
          {evoRemarksLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
              <CircularProgress size={28} sx={{ color: "#7367f0" }} />
            </Box>
          ) : evoRemarksData && evoRemarksData.length > 0 ? (
            groupEvoRemarksByRep(evoRemarksData).map((group, gi) => (
              <Box key={gi} sx={{ mb: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 26, height: 26, fontSize: 12, bgcolor: "#7367f0" }}>
                    {(group.repName || "?").charAt(0)}
                  </Avatar>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, fontFamily: "Poppins", color: "#3a3541" }}>
                    {group.repName}
                  </Typography>
                </Box>

                <Box sx={{ pl: 4.25, display: "flex", flexDirection: "column", gap: 1 }}>
                  {group.remarks.map((r, ri) => {
                    const rc = remarkTypeColor(r.remarkType);
                    return (
                      <Box
                        key={ri}
                        sx={{
                          borderLeft: `3px solid ${rc.color}`,
                          background: "#fafbff",
                          borderRadius: "6px",
                          p: 1,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                          <Chip
                            label={r.remarkType}
                            size="small"
                            sx={{ background: rc.bg, color: rc.color, fontSize: 9.5, fontWeight: 700, height: 18, fontFamily: "Poppins" }}
                          />
                          <Typography sx={{ fontSize: 9.5, color: "#9e9e9e", fontFamily: "Poppins" }}>
                            {r.date}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 11.5, fontFamily: "Poppins", color: "#4a4554", lineHeight: 1.4 }}>
                          {r.remark}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {gi < groupEvoRemarksByRep(evoRemarksData).length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))
          ) : (
            <Typography sx={{ fontSize: 11.5, color: "#9e9e9e", fontFamily: "Poppins", textAlign: "center", py: 4 }}>
              No remarks found for this customer.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════ MODAL for side-menu actions whose DisplayOrder is in MODAL_ORDERS ══════════ */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: modalSize.width,
            height: modalSize.height,
            maxWidth: modalSize.width,
            maxHeight: "90vh",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #ede9f8" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "Poppins" }}>{modalTitle}</Typography>
          <IconButton size="small" onClick={handleCloseModal}>
            <X size={16} />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, height: "100%" }}>
          {modalUrl && (
            <iframe
              src={modalUrl}
              title={modalTitle}
              style={{ width: "100%", height: "98%", border: "none" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CrmReport;