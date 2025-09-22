// http://localhost:3000/testreport/?sp=15&ifid=ToolsReport&pid=18233

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import "./DeviceSpliter.scss";
import { Button, CircularProgress, Paper, Typography } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { IoRefreshCircle } from "react-icons/io5";
import AllEmployeeDataReport from "./AllEmployeeDataReport/AllEmployeeDataReport";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import APICALLRES from "./APICALLRES.json";

const formatToMMDDYYYY = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export default function DeviceSpliter({ isLoadingNew }) {
  const [selectedLocation, setSelectedLocation] = useState("HO");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [paneWidths, setPaneWidths] = useState(["15%", "15%", "70%"]);
  const [isLoading, setIsLoading] = React.useState(isLoadingNew);
  const [status500, setStatus500] = useState(false);
  const [selectedFileter, setSelectedFilter] = useState("App");
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
  const [allEmployeeData, setSideFilterData] = useState([]);
  const [locationSummaryData, setLocationSummaryData] = useState([
    {
      location: "HO",
    },
  ]);
  const [groupedDepartments, setGroupedDepartments] = useState([]);
  const [groupedEmployeeData, setGroupedEmployeeData] = useState([]);
  const [AllFinalData, setFinalData] = useState();
  const [searchParams] = useSearchParams();
  const [customerBindeChnaged, setCustomerBindeChnaged] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedFileter]);

  useEffect(() => {
    if (customerBindeChnaged) {
      fetchData();
    }
  }, [customerBindeChnaged]);

  const fetchData = async (stat, end) => {
    try {
      setIsLoading(true);
      const sp = searchParams.get("sp");
      let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));

      const body = {
        con: `{"id":"","mode":"AppGrid","appuserid":"${AllData?.uid}"}`,
        p: "",
        f: "Task Management (taskmaster)",
      };
      const fetchedData = await GetWorkerData(body, sp);
      const { rd, rd1, rd2 } = fetchedData?.Data || {};
      setFinalData(fetchedData?.Data);
      sessionStorage.setItem("soketVariable", JSON.stringify(rd2));
      if (!Array.isArray(rd) || !Array.isArray(rd1) || rd1.length === 0) {
        setIsLoading(false);
        return;
      }
      const keyMap = Object.entries(rd[0] || {}).reduce(
        (acc, [numKey, name]) => {
          acc[numKey] = name.toLowerCase();
          return acc;
        },
        {}
      );
      const mergedData = rd1.map((record) => {
        const mapped = {};
        for (const [key, value] of Object.entries(record)) {
          const newKey = keyMap[key] || key;
          mapped[newKey] = value;
        }
        return mapped;
      });

      // Filter based on selectedFilter
      let filtered = [];
      if (selectedFileter === "App") {
        filtered = [
          ...new Map(mergedData.map((item) => [item.app, item])).values(),
        ];
      } else if (selectedFileter === "Employee") {
        filtered = [
          ...new Map(mergedData.map((item) => [item.employee, item])).values(),
        ];
      } else if (selectedFileter === "Device") {
        filtered = [
          ...new Map(
            mergedData.map((item) => [item.devicename, item])
          ).values(),
        ];
      }

      const filteredData = filtered.map((item) => ({
        app:
          selectedFileter === "App"
            ? item.app
            : selectedFileter === "Employee"
            ? item.employee
            : item.devicename,
        deptdisplayorder: 1,
        netissuewt: parseFloat(item.issuewt || 0),
        netretunwt: parseFloat(item.returnwt || 0),
        location: item.location,
        department: item.department,
      }));

      const nonEmptyAppData = filteredData?.filter(
        (item) => item.app && item.app.trim() !== ""
      );

      setSideFilterData(filtered);
      setGroupedDepartments(nonEmptyAppData);

      if (customerBindeChnaged) {
        const expressAppEntry = filteredData?.find(
          (item) => item.app === "ExpressApp"
        );
        if (expressAppEntry) {
          setSelectedDepartment(expressAppEntry?.app);
          setCustomerBindeChnaged(false);
        } else {
          setSelectedDepartment(filteredData[0]?.app || "");
          setCustomerBindeChnaged(false);
        }
      } else {
        setSelectedDepartment(filteredData[0]?.app || "");
        console.log("calllllllllll else main");
        setCustomerBindeChnaged(false);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
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

  const subRef = useRef();

  const handleRefresh = () => {
    // if (!isRefreshEnabled) return;
    fetchData();
    if (subRef.current) {
      subRef.current.handleClearFilter();
    }
    // window.location.reload();
    // startEnableTimer();
  };

  // Add this inside DeviceSpliter before return()
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);

  const handleClose = () => {
    setIsPaneCollapsed(true);
    setPaneWidths(["0%", "0%", "100%"]);
  };

  const handleOpen = () => {
    setIsPaneCollapsed(false);
    setPaneWidths(["15%", "15%", "70%"]);
  };

  return (
    <div className="DeviceSpliter_top">
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
            <div style={{ height: "95vh" }}>
              <div
                style={{
                  height: "4vh",
                  margin: "10px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <div className="Location_department_title_div">
                  <p style={{ margin: "0px", lineHeight: "0px" }}>Location</p>
                </div>

              </div>
              <div
                className="employee-list"
                style={{ padding: "0px 8px 0px 8px" }}
              >
                {locationSummaryData?.length != 0
                  ? locationSummaryData?.map((emp) => {
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
                          <div className="employee-header">
                            <div className="location_first">
                              <span
                                className={
                                  selectedLocation == emp.location &&
                                  "location_top_name"
                                }
                              >
                                {emp.location}
                              </span>
                            </div>
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
                      </div>
                    )}
              </div>
            </div>
          </div>
        )}

        {!status500 && paneWidths[1] !== "0%" && (
          <>
            <div className="splitter" onMouseDown={(e) => handleDrag(0, e)} />
            <div className="pane" style={{ width: paneWidths[1] }}>
              <div style={{ height: "95vh" }}>
                <div style={{ height: "4vh", margin: "10px" }}>
                  <select
                    value={selectedFileter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="dropdownList_metal"
                  >
                    <option value={"App"}>APP</option>
                    <option value={"Employee"}>Employee</option>
                    <option value={"Device"}>Device</option>
                  </select>
                </div>
                <div
                  className="employee-list"
                  style={{ padding: "0px 8px 0px 8px", height: "87vh" }}
                >
                  {groupedDepartments?.length != 0
                    ? groupedDepartments?.map((emp) => {
                        const isExpanded = selectedDepartment === emp.app;
                        return (
                          <div
                            key={emp.location}
                            className={
                              selectedDepartment == emp.app
                                ? "employee_card_selected"
                                : "employee-card"
                            }
                          >
                            <div
                              className="employee-header"
                              onClick={() => {
                                handleToggle(emp.app);
                                setSelectedDepartment(emp.app);
                              }}
                            >
                              <div className="location_first">
                                <span
                                  className={
                                    selectedDepartment == emp.app &&
                                    "location_top_name"
                                  }
                                >
                                  {emp.app}
                                </span>
                              </div>
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
                </div>
              </div>
            </div>
          </>
        )}

        {AllFinalData && subRef && paneWidths[2] !== "0%" && (
          <>
            <div className="splitter" onMouseDown={(e) => handleDrag(1, e)} />
            <div className="pane" style={{ width: paneWidths[2] }}>
              <AllEmployeeDataReport
                selectedFilterCategory={selectedDepartment ?? ""}
                selectedFileter={selectedFileter ?? ""}
                AllFinalData={AllFinalData ?? ""}
                ref={subRef}
                onClosePane={handleClose}
                onOpenPane={handleOpen}
                isPaneCollapsed={isPaneCollapsed}
                setCustomerBindeChnaged={setCustomerBindeChnaged}
                handleRefresh={handleRefresh}
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
