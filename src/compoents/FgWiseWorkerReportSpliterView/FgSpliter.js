// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18276

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import "./Spliter.scss";
import { Button, CircularProgress, Paper, Typography } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { IoRefreshCircle } from "react-icons/io5";
import AllEmployeeDataReport from "./AllEmployeeDataReport/AllEmployeeDataReport";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import masterData from "../FgWiseWorkerReportSpliterView/AllEmployeeDataReport/AllEmployeeData.json";

const formatToMMDDYYYY = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export default function FgSpliter() {
  const [showWithouLocationData, setShowWithouLocationData] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [paneWidths, setPaneWidths] = useState(["18%", "18%", "74%"]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [status500, setStatus500] = useState(false);
  const [showDepartment, setShowDepartment] = useState(true);
  const [searchParams] = useSearchParams();
  const [selectedMetalType, setSelectedMetalType] = useState("GOLD");
  const containerRef = useRef();

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

  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [allEmployeeDataMain, setAllEmployeeDataMain] = useState([]);
  const [allEmployeeData, setAllEmployeeData] = useState([]);
  const [locationSummaryData, setLocationSummaryData] = useState([]);
  const [groupedDepartments, setGroupedDepartments] = useState([]);
  const [groupedEmployeeData, setGroupedEmployeeData] = useState([]);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [AllFinalData, setFinalData] = useState();
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });

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
    }, 100); // wait 100ms after popover opens
  }, []);

  const firstTimeLoadedRef = useRef(false);

  useEffect(() => {
    const now = new Date();
    const formattedDate = formatToMMDDYYYY(now);
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    // fetchData(formattedDate, formattedDate);
    setFilterState({
      dateRange: {
        startDate: now,
        endDate: now,
      },
    });
    setTimeout(() => {
      firstTimeLoadedRef.current = true;
    }, 0);
  }, []);

  useEffect(() => {
    if (!firstTimeLoadedRef.current) return;
    const { startDate: s, endDate: e } = filterState.dateRange;
    if (s && e) {
      const formattedStart = formatToMMDDYYYY(new Date(s));
      const formattedEnd = formatToMMDDYYYY(new Date(e));

      setStartDate(formattedStart);
      setEndDate(formattedEnd);
      fetchData(formattedStart, formattedEnd);
    }
  }, [filterState.dateRange]);

  const fetchData = async (stat, end) => {
    console.log("filterStatefilterState", filterState);
    const sp = searchParams.get("sp");
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    setIsLoading(true);

    const body = {
      con: `{"id":"","mode":"fgworkerwithoutfinding","appuserid":"${AllData?.uid}"}`,
      p: `{"fdate":"${stat}","tdate":"${end}"}`,
      f: "Task Management (taskmaster)",
    };

    try {
      const fetchedData = await GetWorkerData(body, sp);
      const { rd, rd1 } = fetchedData?.Data || {};
      if (rd1?.length != 0) {
        setFinalData(fetchedData?.Data);
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

          setAllEmployeeDataMain(mergedData);
          const metalFilteredData = mergedData?.filter(
            (item) =>
              item.metaltypename?.toLowerCase() ==
              selectedMetalType?.toLowerCase()
          );
          setAllEmployeeData(metalFilteredData);
          GetTotlaData(metalFilteredData);
        } else if (rd[0]?.stat == 0) {
          setIsLoading(false);
        }
      } else {
        setAllEmployeeDataMain([]);
        setAllEmployeeData();
        GetTotlaData();
        if (rd?.length != 0) {
          setFinalData(fetchedData?.Data);
        } else {
          setFinalData([]);
        }
        setIsLoading(false);
      }
    } catch (error) {
      if (error?.status == 500) {
        setStatus500(true);
      }
      setAllEmployeeData();
      GetTotlaData();
      setFinalData();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (allEmployeeData?.length > 0) {
      const metalFilteredData = allEmployeeDataMain.filter(
        (item) => item.metaltypename === selectedMetalType
      );
      GetTotlaData(metalFilteredData);
    }
  }, [selectedMetalType, allEmployeeData]);

  const handleToggleNew = () => {
    const metalFilteredData = allEmployeeData?.filter(
      (item) => item.metaltypename === selectedMetalType
    );
    if (showWithouLocationData) {
      handleSelecEmployee("", metalFilteredData, true);
      handleSelectLocation("", metalFilteredData, true);
    } else {
      GetTotlaData(metalFilteredData, selectedLocation);
    }

    setShowDepartment(!showDepartment);
  };

  const showWithoutLocationData = () => {
    if (allEmployeeData?.length > 0) {
      const metalFilteredData = allEmployeeDataMain.filter(
        (item) => item.metaltypename === selectedMetalType
      );
      handleSelectLocation("", metalFilteredData, true);
    }
  };

  const GetTotlaData = (allEmployeeData, selectedL) => {
    if (allEmployeeData?.length === 0) return;
    const summaryMap = new Map();
    allEmployeeData?.forEach((item) => {
      const {
        location,
        locationdisplayorder,
        netretunwt,
        netissuewt,
        losswt,
        lossper,
        deptid,
      } = item;

      if (!summaryMap.has(location)) {
        summaryMap.set(location, {
          location,
          locationdisplayorder,
          deptid,
          totalIssue: 0,
          totalReturn: 0,
          netretunwt: 0,
          totalLoss: 0,
          lossperSum: 0,
          _count: 0,
        });
      }

      const existing = summaryMap.get(location);
      existing.totalIssue += netissuewt || 0;
      existing.netretunwt += netretunwt || 0;
      existing.totalLoss += losswt || 0;
      existing.lossperSum += lossper || 0;
      existing._count += 1;
    });

    const locationSummary = Array.from(summaryMap.values()).map((loc) => ({
      location: loc.location,
      locationdisplayorder: loc.locationdisplayorder, // ✅ You are keeping it now
      deptid: loc.deptid,
      netissuewt: Number(loc.totalIssue),
      netretunwt: Number(loc.netretunwt),
      losswt: Number(loc.totalLoss),
      lossper:
        loc.netretunwt !== 0
          ? Number(((loc.totalLoss / loc.netretunwt) * 100).toFixed(2))
          : 0,
    }));

    const sortedLocationSummary = [...locationSummary].sort(
      (a, b) => a.locationdisplayorder - b.locationdisplayorder
    );

    const firstLocation = selectedL ?? sortedLocationSummary[0]?.location;
    if (sortedLocationSummary?.length == 0) {
      setLocationSummaryData([]);
      setGroupedDepartments([]);
      setGroupedEmployeeData([]);
    } else {
      setLocationSummaryData(sortedLocationSummary);
      handleSelecEmployee(
        firstLocation,
        allEmployeeData,
        masterData?.rd?.ignoreFirstSpliter ? showWithouLocationData : false
      );
      handleSelectLocation(
        firstLocation,
        allEmployeeData,
        masterData?.rd?.ignoreFirstSpliter ? showWithouLocationData : false
      );
    }
  };

  const handleSelectLocation = (
    location,
    allEmployeeData,
    showData = false
  ) => {
    if (!showData) {
      setSelectedLocation(location);
    }

    const FilterDataTemp =
      Array.isArray(allEmployeeDataMain) && allEmployeeDataMain.length > 0
        ? allEmployeeDataMain
        : allEmployeeData;

    const filtered = showData
      ? FilterDataTemp?.filter(
          (emp) =>
            emp.metaltypename?.toLowerCase() == selectedMetalType?.toLowerCase()
        )
      : FilterDataTemp?.filter(
          (emp) =>
            emp.location === location &&
            emp.metaltypename?.toLowerCase() == selectedMetalType?.toLowerCase()
        );

    const deptMap = new Map();

    filtered?.forEach((item) => {
      const {
        deptid,
        deptname,
        deptdisplayorder,
        netretunwt,
        netissuewt,
        losswt,
        lossper,
      } = item;

      if (!deptMap.has(deptid)) {
        deptMap.set(deptid, {
          deptid,
          deptname,
          deptdisplayorder,
          totalIssue: 0,
          netretunwt: 0,
          totalLoss: 0,
          lossperSum: 0,
          _count: 0,
        });
      }

      const existing = deptMap.get(deptid);
      existing.totalIssue += netissuewt || 0;
      existing.netretunwt += netretunwt || 0;
      existing.totalLoss += losswt || 0;
      existing.lossperSum += lossper || 0;
      existing._count += 1;
    });

    const grouped = Array.from(deptMap.values()).map((dept) => ({
      deptid: dept.deptid,
      deptname: dept.deptname,
      deptdisplayorder: dept.deptdisplayorder,
      netissuewt: Number(dept.totalIssue),
      netretunwt: Number(dept.netretunwt),
      losswt: Number(dept.totalLoss),
      lossper:
        dept.netretunwt !== 0
          ? Number(((dept.totalLoss / dept.netretunwt) * 100).toFixed(2))
          : 0,
    }));

    const sortedDepartmentSummary = [...grouped].sort(
      (a, b) => a.deptdisplayorder - b.deptdisplayorder
    );
    const firstDepartment = sortedDepartmentSummary[0]?.deptname ?? "";
    console.log("sortedDepartmentSummary", sortedDepartmentSummary);

    setGroupedDepartments(sortedDepartmentSummary);
    setSelectedDepartment(firstDepartment);
    if (!showData) {
      setExpandedEmployee(location);
    }
    setIsLoading(false);
  };

  const handleSelecEmployee = (location, allEmployeeData, showData) => {
    if (!showData) {
      setSelectedLocation(location);
    }

    const FilterDataTemp =
      Array.isArray(allEmployeeDataMain) && allEmployeeDataMain.length > 0
        ? allEmployeeDataMain
        : allEmployeeData;

    const filtered = showData
      ? FilterDataTemp?.filter(
          (emp) =>
            emp.metaltypename?.toLowerCase() == selectedMetalType?.toLowerCase()
        )
      : FilterDataTemp?.filter(
          (emp) =>
            emp.location === location &&
            emp.metaltypename?.toLowerCase() == selectedMetalType?.toLowerCase()
        );

    const employeeMap = new Map();

    filtered?.forEach((item) => {
      const { employeename, netretunwt, netissuewt, losswt, lossper } = item;

      if (!employeeMap.has(employeename)) {
        employeeMap.set(employeename, {
          employeename,
          totalIssue: 0,
          netretunwt: 0,
          totalLoss: 0,
          lossperSum: 0,
          _count: 0,
        });
      }

      const existing = employeeMap.get(employeename);

      existing.totalIssue += netissuewt || 0;
      existing.netretunwt += netretunwt || 0;
      existing.totalLoss += losswt || 0;
      existing.lossperSum += lossper || 0;
      existing._count += 1;
    });

    const grouped = Array?.from(employeeMap?.values()).map((dept) => ({
      ...dept,
      netissuewt: Number(dept.totalIssue),
      netretunwt: Number(dept.netretunwt),
      losswt: Number(dept.totalLoss),
      lossper:
        dept.netretunwt !== 0
          ? Number(((dept.totalLoss / dept.netretunwt) * 100).toFixed(2))
          : 0,
    }));

    setGroupedEmployeeData(grouped);
    setSelectedEmployee(grouped[0]?.employeename);
    if (!showData) {
      setExpandedEmployee(location);
    }
    setIsLoading(false);
  };

  const handleToggle = (location) => {
    setExpandedEmployee((prev) => (prev === location ? null : location));
  };

  const [isRefreshEnabled, setIsRefreshEnabled] = useState(false);
  const startEnableTimer = () => {
    setIsRefreshEnabled(false); // disable right away
    setTimeout(() => {
      setIsRefreshEnabled(true); // enable after 2 mins
    }, 2 * 60 * 1000); // 2 minutes in ms
  };

  useEffect(() => {
    startEnableTimer();
  }, []);

  const handleRefresh = () => {
    if (!isRefreshEnabled) return;
    window.location.reload();
    startEnableTimer();
  };

  const uniqueMetalTypes = [
    ...new Set(allEmployeeDataMain?.map((item) => item.metaltypename)),
  ];

  const Location_TotalLoss = locationSummaryData.reduce(
    (sum, item) => sum + item.losswt,
    0
  );
  const Location_TotalReturnWt = locationSummaryData.reduce(
    (sum, item) => sum + item.netretunwt,
    0
  );
  const Location_TotalIssueWt = locationSummaryData.reduce(
    (sum, item) => sum + item.netissuewt,
    0
  );

  const Location_TotalPer = (Location_TotalLoss / Location_TotalReturnWt) * 100;

  const department_TotalLoss = showDepartment
    ? groupedDepartments.reduce((sum, item) => sum + item.losswt, 0)
    : groupedEmployeeData.reduce((sum, item) => sum + item.losswt, 0);
  const department_TotalReturnWt = showDepartment
    ? groupedDepartments.reduce((sum, item) => sum + item.netretunwt, 0)
    : groupedEmployeeData.reduce((sum, item) => sum + item.netretunwt, 0);
  const department_TotalIssueWt = showDepartment
    ? groupedDepartments.reduce((sum, item) => sum + item.netissuewt, 0)
    : groupedEmployeeData.reduce((sum, item) => sum + item.netissuewt, 0);

  return (
    <div className="Fgreport_sliperViewMain_top">
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
                  height: "10vh",
                  padding: "8px 8px 0px 8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <DualDatePicker
                    filterState={filterState}
                    setFilterState={setFilterState}
                    validDay={92}
                    validMonth={3}
                  />

                  {uniqueMetalTypes?.length !== 0 && (
                    <select
                      value={selectedMetalType}
                      onChange={(e) => setSelectedMetalType(e.target.value)}
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
                <div style={{ display: "flex", height: "100%" }}>
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
              {locationSummaryData?.length > 1 && (
                <div style={{ margin: "0px 10px" }}>
                  <div
                    className={
                      showWithouLocationData
                        ? "employee_card_selected"
                        : "employee-card"
                    }
                  >
                    <div
                      className="employee-header"
                      onClick={() => {
                        handleToggle("All");
                        showWithoutLocationData();
                        setShowWithouLocationData(true);
                        handleSelecEmployee(null, allEmployeeData, true);
                        setSelectedLocation(null);
                      }}
                    >
                      <div className="location_first">
                        <span
                          className={
                            showWithouLocationData && "location_top_name"
                          }
                        >
                          ALL
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
                            showWithouLocationData
                              ? "employee_detail_title"
                              : "employee_detail"
                          }
                          style={{ width: "50%" }}
                        >
                          Loss : <b> {Location_TotalLoss?.toFixed(3)} gm</b>
                        </p>
                        <p
                          className={
                            showWithouLocationData
                              ? "employee_detail_title"
                              : "employee_detail"
                          }
                          style={{ width: "50%" }}
                        >
                          Loss% :<b> {Location_TotalPer?.toFixed(2)} %</b>
                        </p>
                      </div>
                    </div>

                    <div
                      className={`employee-details ${
                        showWithouLocationData ? "expanded" : ""
                      }`}
                    >
                      {showWithouLocationData && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                            }}
                          >
                            <p
                              className={
                                showWithouLocationData
                                  ? "employee_detail_title"
                                  : "employee_detail"
                              }
                              style={{ width: "50%" }}
                            >
                              Issue Wt :{" "}
                              <b>{Location_TotalIssueWt?.toFixed(3)}</b>
                            </p>
                            <p
                              className={
                                showWithouLocationData
                                  ? "employee_detail_title"
                                  : "employee_detail"
                              }
                              style={{ width: "50%" }}
                            >
                              Return Wt :{" "}
                              <b>{Location_TotalReturnWt?.toFixed(3)} </b>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div
                className="employee-list"
                style={{ padding: "0px 8px 0px 8px" }}
              >
                {locationSummaryData?.length != 0
                  ? locationSummaryData
                      ?.sort(
                        (a, b) =>
                          a.locationdisplayorder - b.locationdisplayorder
                      )
                      .map((emp) => {
                        const isExpanded = expandedEmployee === emp.location;
                        return (
                          <div
                            key={emp.location}
                            className={
                              selectedLocation == emp.location
                                ? "employee_card_selected"
                                : "employee-card"
                            }
                          >
                            <div
                              className="employee-header"
                              onClick={() => {
                                handleToggle(emp.location);
                                handleSelectLocation(
                                  emp.location,
                                  allEmployeeData
                                );
                                setShowWithouLocationData(false);
                                handleSelecEmployee(
                                  emp.location,
                                  allEmployeeData,
                                  false
                                );
                              }}
                            >
                              <div className="location_first">
                                <span
                                  className={
                                    selectedLocation == emp.location &&
                                    "location_top_name"
                                  }
                                >
                                  {emp.location}
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "15px",
                                    alignItems: "center",
                                  }}
                                >
                                  {/* <Button
                            className="location_select_button"
                            onClick={() => handleSelectLocation(emp.location)}
                          >
                            Select
                          </Button> */}
                                  {/* <span className="arrow-icon">
                                {isExpanded ? (
                                  <FaChevronUp
                                    style={{
                                      color:
                                        selectedLocation == emp.location &&
                                        "white",
                                    }}
                                  />
                                ) : (
                                  <FaChevronDown
                                    style={{
                                      color:
                                        selectedLocation == emp.location &&
                                        "white",
                                    }}
                                  />
                                )}
                              </span> */}
                                </div>
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
                                    selectedLocation == emp.location
                                      ? "employee_detail_title"
                                      : "employee_detail"
                                  }
                                  style={{ width: "50%" }}
                                >
                                  Loss : <b>{emp?.losswt?.toFixed(3)} gm</b>
                                </p>
                                <p
                                  className={
                                    selectedLocation == emp.location
                                      ? "employee_detail_title"
                                      : "employee_detail"
                                  }
                                  style={{ width: "50%" }}
                                >
                                  Loss% : <b>{emp?.lossper?.toFixed(2)} %</b>
                                </p>
                              </div>
                            </div>

                            <div
                              className={`employee-details ${
                                isExpanded ? "expanded" : ""
                              }`}
                            >
                              {isExpanded && (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "15px",
                                    }}
                                  >
                                    <p
                                      className={
                                        selectedLocation == emp.location
                                          ? "employee_detail_title"
                                          : "employee_detail"
                                      }
                                      style={{ width: "50%" }}
                                    >
                                      Issue Wt :{" "}
                                      <b>{emp?.netissuewt?.toFixed(3)}</b>
                                    </p>
                                    <p
                                      className={
                                        selectedLocation == emp.location
                                          ? "employee_detail_title"
                                          : "employee_detail"
                                      }
                                      style={{ width: "50%" }}
                                    >
                                      Return Wt :{" "}
                                      <b>{emp?.netretunwt?.toFixed(3)}</b>
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                  : !isLoading && (
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
                          No Location Available
                        </p>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#7a7676",
                            margin: "0px",
                          }}
                        >
                          Select Month & Year
                        </p>
                      </div>
                    )}
              </div>
              {/* {locationSummaryData?.length != 0 && (
                <div
                  style={{
                    margin: "5px",
                  }}
                >
                  <div className="bottomTotla_main">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div className="bottomTotal_box_main">
                        <p className="bottomTotal_box_title">T. Loss</p>
                        <p className="bottomTotal_box_title">
                          {Location_TotalLoss?.toFixed(3)}{" "}
                        </p>
                      </div>
                      <div className="bottomTotal_box_main">
                        <p className="bottomTotal_box_title">T. Issue Wt</p>
                        <p className="bottomTotal_box_title">
                          {Location_TotalIssueWt?.toFixed(3)}
                        </p>
                      </div>
                      <div className="bottomTotal_box_main">
                        <p className="bottomTotal_box_title">T. Return Wt</p>
                        <p className="bottomTotal_box_title">
                          {Location_TotalReturnWt?.toFixed(3)}{" "}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        )}

        {!status500 && paneWidths[1] !== "0%" && (
          <>
            <div className="splitter" onMouseDown={(e) => handleDrag(0, e)} />
            <div className="pane" style={{ width: paneWidths[1] }}>
              <div style={{ height: "99vh" }}>
                <div
                  style={{
                    margin: "8px 8px 0px 8px",
                    height: "4vh",
                  }}
                >
                  <div className="toggle-wrapper">
                    {!isLoading && (
                      <div
                        className="slider-container"
                        onClick={handleToggleNew}
                      >
                        <div
                          className={`active-indicator ${
                            showDepartment ? "left" : "right"
                          }`}
                        ></div>
                        <div className={`panel department-panel`}>
                          <p>Department</p>
                        </div>
                        <div className={`panel employee-panel`}>
                          <p>Employee</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="employee-list"
                  style={{ padding: "0px 8px 0px 8px", height: "82vh" }}
                >
                  {showDepartment ? (
                    <>
                      {groupedDepartments?.length != 0
                        ? groupedDepartments
                            ?.sort(
                              (a, b) => a.deptdisplayorder - b.deptdisplayorder
                            )
                            .map((emp) => {
                              const isExpanded =
                                expandedEmployee === emp.deptname;
                              return (
                                <div
                                  key={emp.location}
                                  className={
                                    selectedDepartment == emp.deptname
                                      ? "employee_card_selected"
                                      : "employee-card"
                                  }
                                >
                                  <div
                                    className="employee-header"
                                    onClick={() => {
                                      handleToggle(emp.deptname);
                                      setSelectedDepartment(emp.deptname);
                                    }}
                                  >
                                    <div className="location_first">
                                      <span
                                        className={
                                          selectedDepartment == emp.deptname &&
                                          "location_top_name"
                                        }
                                      >
                                        {emp.deptname}
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
                                          selectedDepartment == emp.deptname
                                            ? "employee_detail_title"
                                            : "employee_detail"
                                        }
                                        style={{ width: "50%" }}
                                      >
                                        Loss :{" "}
                                        <b>{emp?.losswt?.toFixed(3)} gm</b>
                                      </p>
                                      <p
                                        className={
                                          selectedDepartment == emp.deptname
                                            ? "employee_detail_title"
                                            : "employee_detail"
                                        }
                                        style={{ width: "50%" }}
                                      >
                                        Loss% :{" "}
                                        <b>{emp?.lossper?.toFixed(2)} %</b>
                                      </p>
                                    </div>
                                  </div>
                                  <div
                                    className={`employee-details ${
                                      isExpanded ? "expanded" : ""
                                    }`}
                                  >
                                    {isExpanded && (
                                      <>
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: "15px",
                                          }}
                                        >
                                          <p
                                            className={
                                              selectedDepartment == emp.deptname
                                                ? "employee_detail_title"
                                                : "employee_detail"
                                            }
                                            style={{ width: "50%" }}
                                          >
                                            Issue Wt :{" "}
                                            <b>{emp?.netissuewt?.toFixed(3)}</b>
                                          </p>
                                          <p
                                            className={
                                              selectedDepartment == emp.deptname
                                                ? "employee_detail_title"
                                                : "employee_detail"
                                            }
                                            style={{ width: "50%" }}
                                          >
                                            Return Wt :{" "}
                                            <b>{emp?.netretunwt?.toFixed(3)}</b>
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        : !isLoading && (
                            <div
                              style={{
                                height: "62vh",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <p style={{ fontWeight: 600 }}>
                                No Department Available
                              </p>
                            </div>
                          )}
                    </>
                  ) : (
                    <>
                      {groupedEmployeeData?.length != 0
                        ? groupedEmployeeData.map((emp) => {
                            const isExpanded =
                              expandedEmployee === emp.employeename;
                            return (
                              <div
                                key={emp.employeename}
                                className={
                                  selectedEmployee == emp.employeename
                                    ? "employee_card_selected"
                                    : "employee-card"
                                }
                              >
                                <div
                                  className="employee-header"
                                  onClick={() => {
                                    handleToggle(emp.employeename);
                                    setSelectedEmployee(emp.employeename);
                                  }}
                                >
                                  <div className="location_first">
                                    <span
                                      className={
                                        selectedEmployee == emp.employeename &&
                                        "location_top_name"
                                      }
                                    >
                                      {emp.employeename}
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
                                        selectedEmployee == emp.employeename
                                          ? "employee_detail_title"
                                          : "employee_detail"
                                      }
                                      style={{ width: "50%" }}
                                    >
                                      Loss : <b>{emp?.losswt?.toFixed(3)} gm</b>
                                    </p>
                                    <p
                                      className={
                                        selectedEmployee == emp.employeename
                                          ? "employee_detail_title"
                                          : "employee_detail"
                                      }
                                      style={{ width: "50%" }}
                                    >
                                      Loss% :{" "}
                                      <b>{emp?.lossper?.toFixed(2)} %</b>
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`employee-details ${
                                    isExpanded ? "expanded" : ""
                                  }`}
                                >
                                  {isExpanded && (
                                    <>
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: "15px",
                                        }}
                                      >
                                        <p
                                          className={
                                            selectedEmployee == emp.employeename
                                              ? "employee_detail_title"
                                              : "employee_detail"
                                          }
                                          style={{ width: "50%" }}
                                        >
                                          Issue Wt :{" "}
                                          <b>{emp?.netissuewt?.toFixed(3)}</b>
                                        </p>
                                        <p
                                          className={
                                            selectedEmployee == emp.employeename
                                              ? "employee_detail_title"
                                              : "employee_detail"
                                          }
                                          style={{ width: "50%" }}
                                        >
                                          Return Wt :{" "}
                                          <b>{emp?.netretunwt?.toFixed(3)}</b>
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        : !isLoading && (
                            <div
                              style={{
                                height: "62vh",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <p style={{ fontWeight: 600 }}>
                                No Employee Available
                              </p>
                            </div>
                          )}
                    </>
                  )}
                </div>

                {locationSummaryData?.length != 0 && (
                  <div
                    style={{
                      margin: "5px",
                    }}
                  >
                    <div className="bottomTotla_main">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div className="bottomTotal_box_main">
                          <p className="bottomTotal_box_title">T. Loss</p>
                          <p className="bottomTotal_box_title">
                            {department_TotalLoss?.toFixed(3)}{" "}
                          </p>
                        </div>
                        <div className="bottomTotal_box_main">
                          <p className="bottomTotal_box_title">T. Issue Wt</p>
                          <p className="bottomTotal_box_title">
                            {department_TotalIssueWt?.toFixed(3)}
                          </p>
                        </div>
                        <div className="bottomTotal_box_main">
                          <p className="bottomTotal_box_title">T. Return Wt</p>
                          <p className="bottomTotal_box_title">
                            {department_TotalReturnWt?.toFixed(3)}{" "}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {
          // selectedEmployee &&
          //   selectedDepartment &&
          //   selectedMetalType &&
          AllFinalData && paneWidths[2] !== "0%" && (
            <>
              <div className="splitter" onMouseDown={(e) => handleDrag(1, e)} />
              <div className="pane" style={{ width: paneWidths[2] }}>
                <AllEmployeeDataReport
                  selectedLocation={selectedLocation}
                  selectedDepartment={selectedDepartment}
                  AllFinalData={AllFinalData}
                  endDate={endDate}
                  startDate={startDate}
                  selectedEmployee={selectedEmployee}
                  showDepartment={showDepartment}
                  selectedMetalType={selectedMetalType}
                  showWithouLocationData={showWithouLocationData}
                />
              </div>
            </>
          )
        }

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
