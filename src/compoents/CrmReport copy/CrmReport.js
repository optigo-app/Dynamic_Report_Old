// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18538

import React, { useState } from "react";
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
  X,
  Lock,
  ClipboardList,
} from "lucide-react";
import crmData from "./crmData.json";
import "./CrmReport.scss";

const formatCurrency = (val) =>
  "₹" + Number(val).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatShort = (val) => {
  if (val >= 10000000) return "₹" + (val / 10000000).toFixed(2) + "Cr";
  if (val >= 100000) return "₹" + (val / 100000).toFixed(2) + "L";
  if (val >= 1000) return "₹" + (val / 1000).toFixed(1) + "K";
  return "₹" + val;
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

/* ══════════════════════════════════════════════
   Circular progress "ring" stat — used for both
   the Quick Counts grid and the Health Score gauge
   ══════════════════════════════════════════════ */
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
   Customer Overview strip — Outstanding, Credit
   Limit, Lifetime Sales, Last Order, Health Score,
   Total Orders, laid out like the wireframe
   ══════════════════════════════════════════════ */
const CustomerOverview = ({ customerInfo }) => {
  const healthy = customerInfo.healthScore >= 70;
  return (
    <Paper elevation={0} className="crm_card crm_overview_card">
      <CardTitle title="Customer Overview" icon={<Activity size={14} />} />
      <Divider sx={{ mb: 1.25 }} />
      <Box className="crm_overview_row">
        <Box className="crm_overview_item">
          <Box className="crm_overview_icon" style={{ background: "#fff0f0", color: "#ea5455" }}>
            <IndianRupee size={16} />
          </Box>
          <Box className="crm_overview_text">
            <Typography className="crm_overview_val">{formatCurrency(customerInfo.outstanding)}</Typography>
            <Typography className="crm_overview_lbl">Outstanding</Typography>
            <Typography className="crm_overview_sub">Overdue: {formatCurrency(customerInfo.overdueAmount)}</Typography>
          </Box>
        </Box>

        <Box className="crm_overview_item">
          <Box className="crm_overview_icon" style={{ background: "#e8f5e9", color: "#28c76f" }}>
            <CreditCard size={16} />
          </Box>
          <Box className="crm_overview_text">
            <Typography className="crm_overview_val">{formatCurrency(customerInfo.creditLimit)}</Typography>
            <Typography className="crm_overview_lbl">Credit Limit</Typography>
            <Typography className="crm_overview_sub">Available: {formatCurrency(customerInfo.availableCredit)}</Typography>
          </Box>
        </Box>


        <Box className="crm_overview_item">
          <Box className="crm_overview_icon" style={{ background: "#e3f2fd", color: "#1e9ff2" }}>
            <TrendingUp size={16} />
          </Box>
          <Box className="crm_overview_text">
            <Typography className="crm_overview_val">{formatCurrency(customerInfo.lifetimeSales)}</Typography>
            <Typography className="crm_overview_lbl">Lifetime Sales</Typography>
            <Typography className="crm_overview_sub">Since {customerInfo.customerSince}</Typography>
          </Box>
        </Box>


        <Box className="crm_overview_item">
          <Box className="crm_overview_icon" style={{ background: "#fff3e0", color: "#ff9f43" }}>
            <Calendar size={16} />
          </Box>
          <Box className="crm_overview_text">
            <Typography className="crm_overview_val">{customerInfo.lastOrderDate}</Typography>
            <Typography className="crm_overview_lbl">Last Order</Typography>
            <Typography className="crm_overview_sub">Order No. {customerInfo.lastOrderNo}</Typography>
          </Box>
        </Box>

        <Box className="crm_overview_item">
          <Box className="crm_overview_icon" style={{ background: "#f3e5f5", color: "#7b1fa2" }}>
            <Lock size={16} />
          </Box>
          <Box className="crm_overview_text">
            <Typography className="crm_overview_val">{customerInfo.totalOrders}</Typography>
            <Typography className="crm_overview_lbl">Total Orders</Typography>
            <Typography className="crm_overview_sub">This FY: {customerInfo.totalOrdersFY}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

/* ══════════════════════════════════════════════
   Quick Counts — ring grid, one circle per metric
   ══════════════════════════════════════════════ */
const QuickCounts = ({ quickCount }) => (
  <Paper elevation={0} className="crm_card crm_quickcount_card">
    <CardTitle title="Quick Counts" icon={<Zap size={14} />} />
    <Divider sx={{ mb: 1.25 }} />
    <Box className="crm_ring_grid">
      {quickCount.map((item, i) => (
        <CircularStat
          key={i}
          count={item.count}
          total={item.total}
          label={item.label}
          subtitle={item.subtitle}
          color={item.color}
        />
      ))}
    </Box>
  </Paper>
);

// Animation timing must match the CSS transition duration in CrmReport.scss
const ANIM_MS = 550;

const CrmReport = () => {
  const [activeMenu, setActiveMenu] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  // ── expanded controls the split ──
  // false -> top 50% search panel + bottom 50% report panel (blurred/locked)
  // true  -> search panel collapses away, report panel grows to fill 100%
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [searchTouched, setSearchTouched] = useState(false);

  const {
    customerInfo, gradeAfterInventory, topDealingCategories,
    paymentBehaviour, outstandingMarks, recentActivity,
    monthlyTurnover, monitorSaleReport, lastThreeInvoices,
    quickCount, nextFollowUp, customerNotes,
  } = crmData;

  // ── search logic (matches against the loaded customer record) ──
  const handleSearch = () => {
    setSearchTouched(true);
    const q = query.trim().toLowerCase();
    if (!q) {
      setFoundCustomer(null);
      return;
    }
    const isMatch =
      customerInfo.name.toLowerCase().includes(q) ||
      String(customerInfo.id).toLowerCase().includes(q) ||
      String(customerInfo.mobile).replace(/\s/g, "").includes(q.replace(/\s/g, ""));

    setFoundCustomer(isMatch ? customerInfo : null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // split view -> full report (search panel closes, report grows to 100%)
  const handleShowReport = () => {
    setExpanded(true);
  };

  // full report -> split view (Edit button; report shrinks back to 50%, blurs, search reopens)
  const handleEditCustomer = () => {
    setExpanded(false);
    // wait for the collapse transition to finish before clearing the search state,
    // so the search card doesn't flash empty mid-animation
    setTimeout(() => {
      setFoundCustomer(null);
      setQuery("");
      setSearchTouched(false);
    }, ANIM_MS);
  };

  const followUpTypeIcon = (type) => {
    if (type === "Call") return <PhoneCall size={13} />;
    if (type === "Email") return <Mail size={13} />;
    return <MapPin size={13} />;
  };

  const priorityStyle = (p) => {
    if (p === "High") return { bg: "#fff0f0", color: "#ea5455" };
    if (p === "Medium") return { bg: "#fff3e0", color: "#ff9f43" };
    return { bg: "#e8f5e9", color: "#28c76f" };
  };

  const topButtons = [
    { icon: <Filter size={13} />, label: "Filter" },
    { icon: <Printer size={13} />, label: "Print" },
    { icon: <List size={13} />, label: "List" },
    { icon: <Mail size={13} />, label: "Email" },
    { icon: <Phone size={13} />, label: "Call" },
    { icon: <MessageCircle size={13} />, label: "WhatsApp", color: "#25d366" },
    { icon: <Calendar size={13} />, label: "Schedule" },
    { icon: <Star size={13} />, label: "Remarks" },
    { icon: <Search size={13} />, label: "Search" },
    { icon: <RefreshCw size={13} />, label: "Refresh" },
    { icon: <Bell size={13} />, label: "Alerts" },
    { icon: <User size={13} />, label: "Profile" },
  ];

  const gradeIcons = [
    <History size={14} />,
    <FlaskConical size={14} />,
    <ArrowRightCircle size={14} />,
    <TrendingDown size={14} />,
    <FilePlus size={14} />,
    <Gift size={14} />,
    <RotateCcw size={14} />,
    <PackageX size={14} />,
    <Undo2 size={14} />,
    <Truck size={14} />,
    <Landmark size={14} />,
    <TrendingDown size={14} />,
    <FilePlus size={14} />,
    <Gift size={14} />,
    <RotateCcw size={14} />,
    <PackageX size={14} />,
    <TrendingDown size={14} />,
    <FilePlus size={14} />,
    <Gift size={14} />,
    <RotateCcw size={14} />,
    <PackageX size={14} />,
  ];

  const sectionTabs = [
    { icon: <User size={11} />, label: "Info" },
    { icon: <Users size={11} />, label: "Family" },
    { icon: <Users size={11} />, label: "Staff" },
    { icon: <Activity size={11} />, label: "Activity" },
    { icon: <FileText size={11} />, label: "Documents" },
    { icon: <Info size={11} />, label: "More Info" },
  ];

  // ══════════════════════════════════════════════
  // SINGLE SCREEN, TWO STACKED PANELS
  // Top 50%    -> search card (collapses to 0 when expanded)
  // Bottom 50% -> full report, blurred + locked until expanded,
  //               then grows to fill 100% of the screen
  // ══════════════════════════════════════════════
  return (
    <Box className={`crm_dual_wrapper${expanded ? " expanded" : ""}`}>

      {/* ══════════ TOP: SEARCH PANEL ══════════ */}
      <Box className="crm_search_panel">
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
              placeholder="e.g. E0001"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchTouched) setSearchTouched(false);
              }}
              onKeyDown={handleKeyDown}
              autoFocus={!expanded}
            />
            <button className="crm_search_btn" onClick={handleSearch}>
              <Search size={15} />
              Search
            </button>
          </Box>

          {searchTouched && !foundCustomer && (
            <Typography className="crm_search_error">
              No customer matched “{query}”. Try their name, ID, or mobile number.
            </Typography>
          )}

          {foundCustomer && (
            <Box className="crm_search_result">
              <Avatar className="crm_search_result_avatar">{foundCustomer.name.charAt(0)}</Avatar>
              <Box className="crm_search_result_info">
                <Typography className="crm_search_result_name">{foundCustomer.name}</Typography>
                <Typography className="crm_search_result_meta">
                  {foundCustomer.id} &nbsp;•&nbsp; {foundCustomer.mobile} &nbsp;•&nbsp; {foundCustomer.category}
                </Typography>
              </Box>
              <button className="crm_show_report_btn" onClick={handleShowReport}>
                Show Report
                <ChevronRight size={15} />
              </button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ══════════ BOTTOM: REPORT PANEL ══════════ */}
      <Box className="crm_report_panel">

        {/* Lock overlay — visible only in split view, fades out on expand */}
        <Box className="crm_report_overlay">
          <Box className="crm_report_overlay_inner">
            <Box className="crm_report_overlay_icon"><Search size={22} /></Box>
            <Typography className="crm_overlay_title">Report preview</Typography>
            <Typography className="crm_overlay_sub">Search a customer above, then tap “Show Report”</Typography>
          </Box>
        </Box>

        <Box className="crm_report_content_blur">
          <Box className="CrmReport_main">

            {/* ══════════ TOP HEADER BAR ══════════ */}
            <Box className="crm_topbar">

        {/* Row 1: Customer Info + Action Buttons */}
        <Box className="crm_topbar_row1">
          <Box className="crm_topbar_left">
            <Avatar className="crm_topbar_avatar">{customerInfo.name.charAt(0)}</Avatar>
            <Box>
              <Box className="crm_topbar_id_row">
                <Typography className="crm_topbar_id">No. {customerInfo.id}</Typography>
                <Box className="crm_cat_badge">{customerInfo.category}</Box>
                <MuiTooltip title="Change customer" placement="top" arrow>
                  <Box className="crm_edit_customer_btn" onClick={handleEditCustomer}>
                    <Pencil size={11} />
                    <span>Edit</span>
                  </Box>
                </MuiTooltip>
              </Box>
              <Typography className="crm_topbar_name">{customerInfo.name}</Typography>
              <Box className="crm_topbar_meta">
                <Phone size={11} /><span>{customerInfo.mobile}</span>
                <Mail size={11} /><span>{customerInfo.email}</span>
                <MapPin size={11} /><span>{customerInfo.address}</span>
              </Box>
            </Box>
          </Box>
          <Box className="crm_topbar_actions">
            {topButtons.map((btn, i) => (
              <MuiTooltip key={i} title={btn.label} placement="bottom" arrow>
                <Box className="crm_action_btn" style={btn.color ? { "--btn-accent": btn.color } : {}}>
                  {btn.icon}
                  <span>{btn.label}</span>
                </Box>
              </MuiTooltip>
            ))}
          </Box>
        </Box>

        {/* Row 2: Section Navigation Tabs */}
        <Box className="crm_section_tabs_row">
          {sectionTabs.map((tab, i) => (
            <Box
              key={i}
              className={`crm_sec_tab${activeSection === i ? " active" : ""}`}
              onClick={() => setActiveSection(i)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <ChevronRight size={10} className="crm_sec_tab_arrow" />
            </Box>
          ))}
        </Box>

      </Box>

      {/* ══════════ 3-COLUMN BODY ══════════ */}
      <Box className="crm_body">

        {/* ── LEFT SIDEBAR ── */}
        <Box className="crm_left_panel">
          <Box className="crm_grade_overview_hd">
            <Activity size={11} />
            <span>GRADE OVERVIEW</span>
          </Box>
          {gradeAfterInventory.map((item, i) => (
            <Box
              key={i}
              className={`crm_menu_item${activeMenu === i ? " active" : ""}`}
              onClick={() => setActiveMenu(i)}
            >
              <Box
                className="crm_menu_icon_box"
                style={{ background: activeMenu === i ? item.color : item.color + "18", color: activeMenu === i ? "#fff" : item.color }}
              >
                {gradeIcons[i]}
              </Box>
              <Typography className="crm_menu_label">{item.label}</Typography>
              <ChevronRight size={11} className={`crm_menu_arrow${activeMenu === i ? " visible" : ""}`} style={{ color: item.color }} />
            </Box>
          ))}

        </Box>

        {/* ── CENTER DASHBOARD ── */}
        <Box className="crm_center_panel">

          {/* Customer Overview strip */}
          <CustomerOverview customerInfo={customerInfo} />

          {/* Quick Counts ring grid */}
          <QuickCounts quickCount={quickCount} />

          {/* Top Categories + Payment Behaviour */}
          <Box className="crm_half_row">
            <Paper elevation={0} className="crm_card crm_card_flex">
              <CardTitle title="Top Dealing Categories" icon={<ShoppingBag size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ResponsiveContainer width="52%" height={175}>
                  <PieChart>
                    <Pie
                      data={topDealingCategories}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={76}
                      paddingAngle={3} dataKey="value"
                    >
                      {topDealingCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ flex: 1 }}>
                  {topDealingCategories.map((item, i) => (
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
                  label={paymentBehaviour.type}
                  size="small"
                  sx={{ background: "#e8f5e9", color: "#2e7d32", fontSize: 10, fontWeight: 700, height: 20 }}
                />
                <Typography sx={{ fontSize: 10, color: "#888" }}>
                  Hi: {formatShort(paymentBehaviour.higherPayment)} &nbsp;|&nbsp; Lo: {formatShort(paymentBehaviour.lowerPayment)}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={152}>
                <BarChart data={paymentBehaviour.data} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "Poppins" }} />
                  <Bar dataKey="payment" fill="#7367f0" radius={[3, 3, 0, 0]} name="Payment" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>


          <Box className="crm_half_row">
            {/* Recent Activity Full */}
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
                    {recentActivity.map((row, i) => {
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


            {/* Last 3 Invoices */}
            <Paper elevation={0} className="crm_right_card" style={{ width: '25%' }}>

              <CardTitle title="Last Three Invoices" icon={<FileText size={14} />} />
              <Divider sx={{ mb: 1 }} />
              {lastThreeInvoices.map((inv, i) => {
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

            {/* Outstanding Marks */}
            <Paper elevation={0} className="crm_right_card" style={{ width: '25%' }}>
              <CardTitle title="Outstanding Marks" icon={<CreditCard size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <Box style={{ display: 'flex' }}>
                <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <PieChart width={160} height={155}>
                    <Pie
                      data={outstandingMarks.breakdown}
                      cx={80} cy={75}
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3} dataKey="value"
                    >
                      {outstandingMarks.breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                  <Box className="crm_donut_center_box">
                    <Typography className="crm_donut_val">{formatShort(outstandingMarks.total)}</Typography>
                    <Typography className="crm_donut_sub">Total</Typography>
                  </Box>
                </Box>
                <Box>
                  {outstandingMarks.breakdown.map((item, i) => (
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
            {/* 13 Months Turnover */}
            <Paper elevation={0} className="crm_card">
              <CardTitle title="12 Months Account Statement / Turnover" icon={<TrendingUp size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTurnover} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "Poppins" }} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Poppins" }} />
                  <Bar dataKey="sale" name="Sale" fill="#7367f0" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="purchase" name="Purchase" fill="#28c76f" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            {/* Monitor Sale Report */}
            <Paper elevation={0} className="crm_card">
              <CardTitle title="Monitor Sale Report" icon={<ShoppingBag size={14} />} />
              <Divider sx={{ mb: 1 }} />
              <ResponsiveContainer width="100%" height={155}>
                <BarChart data={monitorSaleReport} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "Poppins" }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip
                    formatter={(v, n) => (n === "Sale Amount" ? formatCurrency(v) : v)}
                    contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "Poppins" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Poppins" }} />
                  <Bar dataKey="amount" name="Sale Amount" fill="#7367f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="units" name="Units" fill="#ff9f43" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returns" name="Returns" fill="#ea5455" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>



        </Box>

        {/* ── RIGHT SIDEBAR ── */}
        <Box className="crm_right_panel">

          {/* ── NEXT FOLLOW UP ── */}
          <Paper elevation={0} className="crm_right_card">
            <CardTitle title="Next Follow Up" icon={<Calendar size={14} />} />
            <Divider sx={{ mb: 1 }} />
            <Box className="crm_followup_card">
              <Box className="crm_followup_header">
                <Box className="crm_followup_type_badge">
                  {followUpTypeIcon(nextFollowUp.type)}
                  <span>{nextFollowUp.type}</span>
                </Box>
                <Chip
                  label={nextFollowUp.priority}
                  size="small"
                  sx={{
                    background: priorityStyle(nextFollowUp.priority).bg,
                    color: priorityStyle(nextFollowUp.priority).color,
                    fontSize: 9, fontWeight: 700, height: 18, fontFamily: "Poppins"
                  }}
                />
              </Box>
              <Box className="crm_followup_date_row">
                <Calendar size={13} style={{ color: "#7367f0", flexShrink: 0 }} />
                <Typography className="crm_followup_date">{nextFollowUp.date}</Typography>
                <Typography className="crm_followup_time">{nextFollowUp.time}</Typography>
              </Box>
              <Typography className="crm_followup_note">{nextFollowUp.note}</Typography>
              <Box className="crm_followup_assigned">
                <User size={11} style={{ color: "#9e9e9e" }} />
                <Typography className="crm_followup_by">{nextFollowUp.assignedTo}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* ── CUSTOMER NOTES ── */}
          <Paper elevation={0} className="crm_right_card">
            <CardTitle title="Customer Notes" icon={<MessageSquare size={14} />} />
            <Divider sx={{ mb: 1 }} />
            {customerNotes.map((note) => (
              <Box key={note.id} className="crm_note_item" style={{ borderLeftColor: note.color }}>
                <Box className="crm_note_header">
                  <Box className="crm_note_avatar" style={{ background: note.color }}>
                    {note.by.charAt(0)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className="crm_note_by" noWrap>{note.by}</Typography>
                    <Typography className="crm_note_date">{note.date}</Typography>
                  </Box>
                </Box>
                <Typography className="crm_note_text">{note.note}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CrmReport;