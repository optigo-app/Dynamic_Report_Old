// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18279

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import "./OSRReportSpliter.scss";
import {
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { IoRefreshCircle } from "react-icons/io5";
import AllEmployeeDataReport from "./AllEmployeeDataReport/AllEmployeeDataReport";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const formatToMMDDYYYY = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export default function OSRReportSpliter() {
  const [selectCustomerCode, setSelectCustomerCode] = useState(null);
  const [totalCount, setTotalCount] = useState();
  const [totalCountWt, setTotalCountWt] = useState();
  const [paneWidths, setPaneWidths] = useState(["25%", "75%"]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [status500, setStatus500] = useState(false);
  const [showSalesRep, setShowSalesRep] = useState(true);
  const [searchParams] = useSearchParams();
  const [selectedSalesRepCode, setSelectedSalesRepCode] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [AllFinalData, setFinalData] = useState();
  const [selectedDateColumn, setSelectedDateColumn] = useState("");
  const [dateColumnOptions, setDateColumnOptions] = useState([]);
  const [isRefreshEnabled, setIsRefreshEnabled] = useState(false);
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });
  const firstTimeLoadedRef = useRef(false);
  const containerRef = useRef();
  const [uniqueMetalTypes, setUniqueMetalTypes] = useState([]);
  const rawDataRef = useRef([]);
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);
  const [salesRepEmployeeData, setSalesRepEmployeeData] = useState([]);
  const [salesRepSummaryData, setSalesRepSummaryData] = useState([]);
  const [regularSummaryData, setRegularSummaryData] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAllSalesrepData, setShowAllSalesrepData] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const items = document.querySelectorAll(
        ".MuiButtonBase-root.MuiListItem-root.MuiListItem-gutters.MuiListItem-padding.MuiListItem-button"
      );
      items.forEach((item) => {
        const textElement = item.querySelector(".MuiListItemText-root");
        if (textElement) {
          const text = textElement.textContent.trim();
          if (text === "Last Year" || text === "This Year") {
            item.style.display = "none";
          }
        }
      });
    }, 100);
  }, []);

  useEffect(() => {
    startEnableTimer();
  }, []);

  useEffect(() => {
    const allColumData = [
      {
        colid: 2,
        headerName: "Order Date",
        field: "entrydate",
        Width: 150,
        hrefLink: "",
        dateColumn: true,
        summaryTitle: "",
        summuryValueKey: 0,
      },
      {
        colid: 3,
        headerName: "Promise Date",
        field: "promisedate",
        Width: 150,
        Align: "center",
        hrefLink: "",
        ColumFilter: true,
        NormalFilter: false,
        EditData: true,
        dateColumn: true,
        summaryTitle: "",
        summuryValueKey: 0,
      },
    ];
    if (allColumData) {
      const dateCols = allColumData.filter((col) => col.dateColumn === true);
      setDateColumnOptions(
        dateCols.map((col) => ({
          field: col.field,
          label: col.headerName,
        }))
      );

      if (dateCols.length > 0) {
        setSelectedDateColumn(dateCols[0].field);
      }
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const formattedDate = formatToMMDDYYYY(now);
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    setFilterState({
      dateRange: {
        startDate: now,
        endDate: now,
      },
    });
  }, []);

  useEffect(() => {
    if (!selectedDateColumn || !filterState?.dateRange?.startDate) return;
    fetchDataOnce();
  }, [selectedDateColumn, filterState.dateRange]);

  const fetchDataOnce = async () => {
    if (firstTimeLoadedRef.current) return;
    firstTimeLoadedRef.current = true;

    const sp = searchParams.get("sp");
    setIsLoading(true);
    const body = {
      con: '{"id":"","mode":"osrreport","appuserid":"amrut@eg.com"}',
      p: "{}",
      f: "Task Management (taskmaster)",
    };

    try {
      const fetchedData = await GetWorkerData(body, sp);
      const { rd, rd1 } = fetchedData?.Data || {};
      if (Array.isArray(rd) && Array.isArray(rd1)) {
        const keyMap = Object.entries(rd[0]).reduce((acc, [numKey, name]) => {
          acc[numKey] = name.toLowerCase();
          return acc;
        }, {});
        const mergedData = rd1.map((record) => {
          const mapped = {};
          for (const [key, value] of Object.entries(record)) {
            const newKey = keyMap[key] || key;
            mapped[newKey] = value;
          }
          return mapped;
        });

        rawDataRef.current = mergedData;
        filterData();
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (error?.status == 500) setStatus500(true);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeDateOnly = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const filterData = () => {
    const { startDate: s, endDate: e } = filterState.dateRange;
    if (!s || !e || !selectedDateColumn) {
      console.warn("Missing filter dates or selected date column");
      return;
    }

    const from = normalizeDateOnly(new Date(s));
    const to = normalizeDateOnly(new Date(e));

    const parseDate = (value) => {
      if (!value) return null;
      if (Object.prototype.toString.call(value) === "[object Date]") {
        return isNaN(value.getTime()) ? null : normalizeDateOnly(value);
      }

      if (typeof value === "string") {
        const parts = value.trim().split(" ");
        if (parts.length !== 3) return null;
        const [day, monthStr, year] = parts;
        const dateStr = `${day} ${monthStr} ${year}`;
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : normalizeDateOnly(parsed);
      }

      return null;
    };

    const dateFiltered = rawDataRef.current.filter((item) => {
      const rawDateValue = item[selectedDateColumn.trim()];
      const itemDate = parseDate(rawDateValue);
      return itemDate && itemDate >= from && itemDate <= to;
    });

    const totalWeight = dateFiltered.reduce((acc, row) => {
      return (
        acc +
        (row.pipwt || 0) +
        (row.wipwt || 0) +
        (row.inqabookwt || 0) +
        (row.instockwt || 0) +
        (row.inmemowt || 0) +
        (row.insalewt || 0) +
        (row.etapendingwt || 0) +
        (row.inmeltwt || 0) +
        (row.incompanywt || 0)
      );
    }, 0);

    const totalCount = dateFiltered.reduce(
      (sum, item) => sum + item.totalcnt,
      0
    );
    setTotalCount(totalCount);
    setTotalCountWt(totalWeight);

    const salesRepData = dateFiltered.filter(
      (item) => item.isdefaultcustomer === 0
    );

    const regularCustomerData = dateFiltered.filter(
      (item) => item.isdefaultcustomer === 1
    );
    setFinalData(dateFiltered);
    setSalesRepEmployeeData(salesRepData);

    GetTotlaData(salesRepData, true);
    GetTotlaData(regularCustomerData, false);

    let uniqueSalesReps = [
      ...new Set(salesRepData.map((item) => item.salesrepcode).filter(Boolean)),
    ];
    if (uniqueSalesReps.length > 1) {
      uniqueSalesReps.unshift("All");
    }
    setUniqueMetalTypes(uniqueSalesReps);
    if (uniqueSalesReps?.length <= 1) {
      setSelectedSalesRepCode(uniqueSalesReps[0]);
    } else {
      setSelectCustomerCode(null);
      setSelectedSalesRepCode("All");
    }
  };

  useEffect(() => {
    if (!salesRepEmployeeData || salesRepEmployeeData?.length === 0) return;
    const filtered =
      selectedSalesRepCode === "All"
        ? salesRepEmployeeData
        : salesRepEmployeeData?.filter(
            (item) =>
              item?.salesrepcode?.toLowerCase() ===
              selectedSalesRepCode?.toLowerCase()
          );

    const summaryMap = new Map();
    filtered.forEach((item) => {
      const { customerfirmname, customercode, totalcnt } = item;
      const key = `${customerfirmname}_${customercode}`;
      const weightFields = [
        item.pipwt,
        item.wipwt,
        item.inqabookwt,
        item.instockwt,
        item.inmemowt,
        item.insalewt,
        item.inmeltwt,
        item.incompanywt,
        item.etapendingwt,
      ];
      const totalWt = weightFields.reduce((sum, val) => sum + (val || 0), 0);

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          customerfirmname,
          customercode,
          totalcnt: 0,
          totalWt: 0,
        });
      }
      const entry = summaryMap.get(key);
      entry.totalWt += totalWt;
      summaryMap.get(key).totalcnt += Number(totalcnt || 0);
    });
    const summaryList = Array.from(summaryMap.values());
    setSalesRepSummaryData(summaryList);
    console.log('selectCustomerCode', selectCustomerCode , summaryList);
    if (summaryList?.length !== 0 && !showAllSalesrepData) {
      setSelectCustomerCode(summaryList[0]?.customercode);
    }
  }, [selectedSalesRepCode, salesRepEmployeeData]);

  useEffect(() => {
    if (firstTimeLoadedRef.current) {
      filterData();
    }
  }, [selectedDateColumn, filterState, showSalesRep]);

  const GetTotlaData = (data, isSalesRep = false) => {
    if (!data?.length) {
      if (isSalesRep) setSalesRepSummaryData([]);
      else setRegularSummaryData([]);
      return;
    }

    const summaryMap = new Map();
    data.forEach((item) => {
      const { customerfirmname, customercode, totalcnt } = item;
      const key = `${customerfirmname}_${customercode}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          customerfirmname,
          customercode,
          totalcnt: 0,
        });
      }
      const existing = summaryMap.get(key);
      existing.totalcnt += Number(totalcnt) || 0;
    });

    const summaryList = Array.from(summaryMap.values());
    if (isSalesRep) {
      setSalesRepSummaryData(summaryList);
      if (summaryList?.length == 1) {
        setSelectCustomerCode(summaryList[0]?.customercode);
      } else {
        setShowAllSalesrepData(true);
      }
    } else {
      setRegularSummaryData(summaryList);
    }
  };

  const handleDrag = (index, e) => {
    const startX = e.clientX;
    const startWidths = [...paneWidths.map((w) => parseFloat(w))];
    const containerWidth = containerRef.current.offsetWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const percentDelta = (delta / containerWidth) * 100;

      const newWidths = [...startWidths];
      newWidths[index] = Math.max(5, startWidths[index] + percentDelta);
      newWidths[index + 1] = Math.max(5, startWidths[index + 1] - percentDelta);
      const total = newWidths.reduce((a, b) => a + b, 0);

      if (total <= 100) {
        setPaneWidths(newWidths.map((w) => `${w}%`));
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleToggle = (location) => {
    setExpandedEmployee((prev) => (prev === location ? null : location));
  };

  const startEnableTimer = () => {
    setIsRefreshEnabled(false); // disable right away
    setTimeout(() => {
      setIsRefreshEnabled(true); // enable after 2 mins
    }, 2 * 60 * 1000); // 2 minutes in ms
  };

  const handleRefresh = () => {
    if (!isRefreshEnabled) return;
    window.location.reload();
    startEnableTimer();
  };

  const handleClose = () => {
    setIsPaneCollapsed(true);
    setPaneWidths(["0%", "100%"]);
  };

  const handleOpen = () => {
    setIsPaneCollapsed(false);
    setPaneWidths(["25%", "75%"]);
  };

  const handleToggleNew = () => {
    setShowSalesRep(!showSalesRep);
  };

  const filteredCustomerData = salesRepSummaryData?.filter((emp) =>
    emp.customerfirmname.toLowerCase().includes(customerSearch.toLowerCase())
  );

  console.log("selectCustomerCode", selectCustomerCode);

  return (
    <div className="OSRReportSpliter_top">
      {isLoading && (
        <div className="loader-overlay">
          <CircularProgress className="loadingBarManage" />
        </div>
      )}
      <Box
        sx={{ height: "100vh", display: "flex", flexDirection: "row" }}
        ref={containerRef}
      >
        {!status500 && (
          <div className="pane" style={{ width: paneWidths[0] }}>
            <div style={{ height: "100vh" }}>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "space-between",
                  padding: "8px 8px 0px 8px",
                }}
              >
                <div
                  style={{
                    width: "93%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControl
                      size="small"
                      sx={{ width: "25%", margin: "0px" }}
                    >
                      <InputLabel>Date Type</InputLabel>
                      <Select
                        label="Date Type"
                        value={selectedDateColumn}
                        onChange={(e) => setSelectedDateColumn(e.target.value)}
                      >
                        {dateColumnOptions.map((col) => (
                          <MenuItem key={col.field} value={col.field}>
                            {col.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <div style={{ width: "50%" }}>
                      <DualDatePicker
                        filterState={filterState}
                        setFilterState={setFilterState}
                        validDay={31}
                        validMonth={1}
                        withountDateFilter={true}
                      />
                    </div>
                    <Button
                      onClick={() =>
                        setFilterState({
                          ...filterState,
                          dateRange: {
                            startDate: new Date("2000-01-01T18:30:00.000Z"),
                            endDate: new Date(), // current date
                          },
                        })
                      }
                      className="FiletrBtnAll"
                    >
                      All
                    </Button>
                  </div>
                </div>
                <div style={{ display: "flex", height: "100%", width: "7%" }}>
                  <IoRefreshCircle
                    onClick={handleRefresh}
                    style={{
                      color: "rebeccapurple",
                      fontSize: "29px",
                      cursor: isRefreshEnabled ? "pointer" : "not-allowed",
                      opacity: isRefreshEnabled ? 1 : 0.5,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  margin: "0px 10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    marginTop: "10px",
                    gap: "10px",
                  }}
                >
                  {!isLoading && uniqueMetalTypes?.length !== 0 && (
                    <p className="osr_salesRepTitle">Select Sales Rep :-</p>
                  )}
                  {uniqueMetalTypes?.length !== 0 && (
                    <select
                      value={selectedSalesRepCode}
                      onChange={(e) => {
                        setSelectedSalesRepCode(e.target.value);
                        if (e.target.value == "All") {
                          setShowAllSalesrepData(true);
                          setSelectCustomerCode(null);
                        } else {
                          setShowAllSalesrepData(false);
                        }
                      }}
                      className="dropdownList_metal"
                    >
                      {uniqueMetalTypes.map((metal) => (
                        <option key={metal} value={metal}>
                          {metal}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* {filteredCustomerData?.length !== 0 && ( */}
                <div
                  className="customer-search-wrapper"
                  style={{
                    marginBottom: "15px",
                    position: "relative",
                    marginTop: "15px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search Customer Code..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="customer-search-input"
                    style={{ outline: "none" }}
                  />
                  {customerSearch && (
                    <span
                      onClick={() => setCustomerSearch("")}
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "40%",
                        fontSize: "25px",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        color: "#999",
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>
                {/*  )} */}
              </div>
              <div
                className="employee-list"
                style={{ padding: "0px 8px", marginTop: "20px" }}
              >
                {filteredCustomerData?.length > 1 &&
                  selectedSalesRepCode == "All" && (
                    <div style={{ margin: "0px" }}>
                      <div
                        className={
                          showAllSalesrepData
                            ? "employee_card_selected"
                            : "employee-card"
                        }
                      >
                        <div
                          className="employee-header"
                          onClick={() => {
                            handleToggle("All");
                            setSelectCustomerCode(null);
                            setShowAllSalesrepData(true);
                          }}
                        >
                          <div className="location_first">
                            <span
                              className={
                                showAllSalesrepData && "location_top_name"
                              }
                            >
                              ALL
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                              marginTop: "10px",
                            }}
                          >
                            <p
                              className={
                                showAllSalesrepData
                                  ? "employee_detail_title"
                                  : "employee_detail"
                              }
                            >
                              Total :
                            </p>
                            <p
                              className={
                                showAllSalesrepData
                                  ? "employee_detail_title"
                                  : "employee_detail"
                              }
                            >
                              <b>
                                {" "}
                                {totalCount} / {totalCountWt?.toFixed(3)} Wt
                              </b>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {regularSummaryData?.length !== 0 &&
                  selectedSalesRepCode == "All" &&
                  regularSummaryData?.map((emp) => {
                    const isExpanded = expandedEmployee === emp.customercode;
                    return (
                      <div
                        key={emp.customercode}
                        className={
                          selectCustomerCode == emp.customercode
                            ? "employee_card_selected"
                            : "employee-card"
                        }
                      >
                        <div
                          className="employee-header"
                          onClick={() => {
                            handleToggle(emp.customercode);
                            setShowAllSalesrepData(false);
                            setSelectCustomerCode(emp.customercode);
                          }}
                        >
                          <div className="location_first">
                            <span
                              className={
                                selectCustomerCode == emp.customercode &&
                                "location_top_name"
                              }
                            >
                              {emp.customerfirmname}({emp.customercode})
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                              marginTop: "10px",
                            }}
                          >
                            <p
                              className={
                                selectCustomerCode == emp.customercode
                                  ? "employee_detail_title"
                                  : "employee_detail"
                              }
                              style={{ width: "50%" }}
                            >
                              Total : <b>{emp.totalcnt}</b>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {filteredCustomerData?.length
                  ? filteredCustomerData.map((emp) => {
                      const isExpanded = expandedEmployee === emp.customercode;
                      return (
                        <div
                          key={emp.customercode}
                          className={
                            selectCustomerCode == emp.customercode
                              ? "employee_card_selected"
                              : "employee-card"
                          }
                        >
                          <div
                            className="employee-header"
                            onClick={() => {
                              handleToggle(emp.customercode);
                              setShowAllSalesrepData(false);
                              setSelectCustomerCode(emp.customercode);
                            }}
                          >
                            <div className="location_first">
                              <span
                                className={
                                  selectCustomerCode == emp.customercode &&
                                  "location_top_name"
                                }
                              >
                                {emp.customerfirmname}({emp.customercode})
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "15px",
                                marginTop: "10px",
                              }}
                            >
                              <p
                                className={
                                  selectCustomerCode == emp.customercode
                                    ? "employee_detail_title"
                                    : "employee_detail"
                                }
                                style={{ width: "50%" }}
                              >
                                Total :{" "}
                                <b>
                                  {emp.totalcnt} / {emp?.totalWt?.toFixed(3)} Wt
                                </b>
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : regularSummaryData?.length !== 0 && (
                      <div
                        style={{
                          height: "60vh",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexDirection: "column",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: "17px",
                            margin: "0px",
                          }}
                        >
                          No Customer Available
                        </p>
                      </div>
                    )}
              </div>
            </div>
          </div>
        )}
        {paneWidths[1] !== "0%" && (
          <>
            <div className="splitter" onMouseDown={(e) => handleDrag(0, e)} />
            <div className="pane" style={{ width: paneWidths[1] }}>
              <AllEmployeeDataReport
                AllFinalData={AllFinalData}
                selectCustomerCode={selectCustomerCode}
                onClosePane={handleClose}
                onOpenPane={handleOpen}
                isPaneCollapsed={isPaneCollapsed}
                showAllSalesrepData={showAllSalesrepData}
              />
            </div>
          </>
        )}

        {status500 && (
          <div
            style={{ display: "flex", width: "100%", justifyContent: "center" }}
          >
            <Box
              minHeight="70vh"
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={2}
            >
              <Paper
                elevation={3}
                sx={{
                  maxWidth: 500,
                  width: "100%",
                  p: 4,
                  borderRadius: "20px",
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  mb={2}
                >
                  <AlertTriangle size={48} color="#f44336" />
                </Box>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Something Went Wrong
                </Typography>

                <Typography variant="body1" color="text.secondary" mb={3}>
                  We're sorry, but an unexpected error has occurred. Please try
                  again later.
                </Typography>

                {/* <Button
                  variant="contained"
                  color="error"
                  sx={{ textTransform: "none", borderRadius: "10px", px: 4 }}
                >
                  Try Again
                </Button> */}
              </Paper>
            </Box>
          </div>
        )}
      </Box>
    </div>
  );
}
