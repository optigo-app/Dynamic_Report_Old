// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18276
import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import "./EmployeeDepartmentReportSpliter.scss";
import { Button, CircularProgress, Paper, Typography } from "@mui/material";
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

export default function EmployeeDepartmentReportSpliter({ isLoadingNew }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [paneWidths, setPaneWidths] = useState(["18%", "18%", "74%"]);
  const [isLoading, setIsLoading] = React.useState(isLoadingNew);
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
  const firstTimeLoadedRef = useRef(false);

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
    console.log('filterStatefilterState', filterState);
    const sp = searchParams.get("sp");
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    setIsLoading(true);
    // if (!AllFinalData?.rd1) {
      const body = {
        con: `{"id":"","mode":"fgworkerwithoutfinding","appuserid":"${AllData?.uid}"}`,
        p: `{"fdate":"${stat}","tdate":"${end}"}`,
        f: "Task Management (taskmaster)",
      };

      try {
        const fetchedData = await GetWorkerData(body, sp);
        const { rd, rd1 } = fetchedData?.Data || {};
        if (Array.isArray(rd) && Array.isArray(rd1)) {
          setFinalData(fetchedData?.Data);
          processAndFilterData(rd, rd1);
        } else {
          setAllEmployeeData([]);
          GetTotlaData([]);
        }
      } catch (error) {
        if (error?.status === 500) {
          setStatus500(true);
        }
        setAllEmployeeData([]);
        GetTotlaData([]);
      } finally {
        setIsLoading(false);
      }
    // } else {
    //   const { rd, rd1 } = AllFinalData;
    //   processAndFilterData(rd, rd1);
    //   setIsLoading(false);
    // }
  };

  const processAndFilterData = (rd, rd1) => {
    setIsLoading(true);
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    const keyMap = Object.entries(rd[0]).reduce((acc, [numKey, name]) => {
      acc[numKey] = name.toLowerCase();
      return acc;
    }, {});
    const filteredByDate = rd1.filter((entry) => {
      const entryDate = new Date(entry["1"]);
      return entryDate >= parsedStartDate && entryDate <= parsedEndDate;
    });
    const mappedData = filteredByDate.map((entry) => {
      const mapped = {};
      for (const [key, value] of Object.entries(entry)) {
        const newKey = keyMap[key] || key;
        mapped[newKey] = value;
      }
      return mapped;
    });
    const finalFiltered = mappedData.filter(
      (item) => item.metaltype === selectedMetalType
    );
    setAllEmployeeDataMain(mappedData);
    setAllEmployeeData(finalFiltered);
    GetTotlaData(finalFiltered);
    setIsLoading(false);
  };

  useEffect(() => {
    if (allEmployeeData?.length > 0) {
      const metalFilteredData = allEmployeeDataMain.filter(
        (item) => item.metaltype === selectedMetalType
      );
      GetTotlaData(metalFilteredData);
    }
  }, [selectedMetalType, allEmployeeData]);

  const GetTotlaData = (allEmployeeData) => {
    if (allEmployeeData?.length === 0) {
      setIsLoading(false);
      return;
    }

    console.log("summaryMap", allEmployeeData);

    const summaryMap = new Map();
    allEmployeeData?.forEach((item) => {
      const {
        locationname,
        locationdisplayorder,
        department_returnwt,
        department_issuewt,
        department_losswt,
        loss_perc,
        deptid,
      } = item;

      if (!summaryMap.has(locationname)) {
        summaryMap.set(locationname, {
          locationname,
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

      const existing = summaryMap.get(locationname);
      existing.totalIssue += department_issuewt || 0;
      existing.netretunwt += department_returnwt || 0;
      existing.totalLoss += department_losswt || 0;
      existing.lossperSum += loss_perc || 0;
      existing._count += 1;
    });

    const locationSummary = Array.from(summaryMap.values()).map((loc) => ({
      location: loc.locationname,
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

    console.log("summaryMap locationSummary", locationSummary);

    // const sortedLocationSummary = [...locationSummary].sort(
    //   (a, b) => a.locationdisplayorder - b.locationdisplayorder
    // );
    const firstLocation = locationSummary[0]?.location;
    setLocationSummaryData(locationSummary);
    handleSelectLocation(firstLocation, allEmployeeData);
    handleSelecEmployee(firstLocation, allEmployeeData);
  };

  const handleSelectLocation = (location, allEmployeeData) => {
    setSelectedLocation(location);

    const filtered = allEmployeeDataMain?.filter(
      (emp) =>
        emp.locationname === location && emp.metaltype == selectedMetalType
    );
    const deptMap = new Map();

    filtered?.forEach((item) => {
      const {
        deptid,
        deptname,
        deptdisplayorder,
        department_returnwt,
        department_issuewt,
        department_losswt,
        loss_perc,
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
      existing.totalIssue += department_issuewt || 0;
      existing.netretunwt += department_returnwt || 0;
      existing.totalLoss += department_losswt || 0;
      existing.lossperSum += loss_perc || 0;
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
    setGroupedDepartments(sortedDepartmentSummary);
    setSelectedDepartment(firstDepartment);
    setExpandedEmployee(location);
    setIsLoading(false);
  };

  const handleSelecEmployee = (location, allEmployeeData) => {
    setSelectedLocation(location);

    const filtered = allEmployeeDataMain?.filter(
      (emp) =>
        emp.locationname === location && emp.metaltype == selectedMetalType
    );

    console.log("filtered", filtered);

    const employeeMap = new Map();

    filtered?.forEach((item) => {
      const {
        empname,
        department_returnwt,
        department_issuewt,
        department_losswt,
        loss_perc,
      } = item;

      if (!employeeMap.has(empname)) {
        employeeMap.set(empname, {
          empname,
          totalIssue: 0,
          department_returnwt: 0,
          totalLoss: 0,
          lossperSum: 0,
          _count: 0,
        });
      }

      const existing = employeeMap.get(empname);

      existing.totalIssue += department_issuewt || 0;
      existing.netretunwt += department_returnwt || 0;
      existing.totalLoss += department_losswt || 0;
      existing.lossperSum += loss_perc || 0;
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

    console.log("filteredfiltered", grouped);
    setGroupedEmployeeData(grouped);
    setSelectedEmployee(grouped[0]?.empname);
    setExpandedEmployee(location);
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

  const handleToggleNew = () => {
    const metalFilteredData = allEmployeeData?.filter(
      (item) => item.metaltype === selectedMetalType
    );
    GetTotlaData(metalFilteredData);
    setShowDepartment(!showDepartment);
  };

  const uniqueMetalTypes = [
    ...new Set(allEmployeeDataMain?.map((item) => item.metaltype)),
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
    <div className="EmployeeDepartmentReportSpliter_top">
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
                    validDay={31}
                    validMonth={1}
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
              <div
                className="employee-list"
                style={{ padding: "0px 8px 0px 8px" }}
              >
                {locationSummaryData?.length != 0
                  ? locationSummaryData
                      ?.sort(
                        (a, b) =>
                          a.locationdisplayorder - b.locationdisplayorder
                      ) // ✨ Added sort
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
                                handleSelecEmployee(
                                  emp.location,
                                  allEmployeeData
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
              )}
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
                            const isExpanded = expandedEmployee === emp.empname;
                            return (
                              <div
                                key={emp.empname}
                                className={
                                  selectedEmployee == emp.empname
                                    ? "employee_card_selected"
                                    : "employee-card"
                                }
                              >
                                <div
                                  className="employee-header"
                                  onClick={() => {
                                    handleToggle(emp.empname);
                                    setSelectedEmployee(emp.empname);
                                  }}
                                >
                                  <div className="location_first">
                                    <span
                                      className={
                                        selectedEmployee == emp.empname &&
                                        "location_top_name"
                                      }
                                    >
                                      {emp.empname}
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
                                        selectedEmployee == emp.empname
                                          ? "employee_detail_title"
                                          : "employee_detail"
                                      }
                                      style={{ width: "50%" }}
                                    >
                                      Loss : <b>{emp?.losswt?.toFixed(3)} gm</b>
                                    </p>
                                    <p
                                      className={
                                        selectedEmployee == emp.empname
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
                                            selectedEmployee == emp.empname
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
                                            selectedEmployee == emp.empname
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

        {selectedLocation &&
          selectedEmployee &&
          selectedDepartment &&
          selectedMetalType &&
          startDate &&
          paneWidths[2] !== "0%" && (
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
