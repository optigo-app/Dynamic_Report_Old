import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import "./AllEmployeeDataReport.scss";
import DatePicker from "react-datepicker";
import mainButton from "../../images/Mail_32.png";
import printButton from "../../images/print.png";
import gridView from "../../images/GriedView.png";
import imageView from "../../images/ImageView2.png";
import { RiFullscreenLine } from "react-icons/ri";
import "react-datepicker/dist/react-datepicker.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Slide,
  TextField,
  Typography,
} from "@mui/material";
import emailjs from "emailjs-com";
import { MdDelete, MdExpandMore, MdOpenInFull } from "react-icons/md";
import CustomTextField from "../../text-field/index";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AiFillSetting } from "react-icons/ai";
import OtherKeyData from "./AllEmployeeData.json";
import OtherKeyDataAdmin from "./AdminApp.json";
import OtherKeyDataSales from "./SalesRep.json";
import OtherKeyDataExpress from "./ExpressApp.json";
import OtherKeyDataIcate from "./IcateApp.json";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SingleEmployeeWiseData from "./SingleEmployeeWiseData/SingleEmployeeWiseData";
import { GetWorkerData } from "../../../API/GetWorkerData/GetWorkerData";
import { useSearchParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import CustomerBind from "./CustomerBind.json";
import { deviceOnorOff } from "../../../Recoil/atom";
import { useDeviceStatus } from "../../../DeviceStatusContext";
import { IoMdLogOut } from "react-icons/io";
import { MdFormatClear } from "react-icons/md";
import { MdOutlineFilterAlt } from "react-icons/md";
import { MdOutlineFilterAltOff } from "react-icons/md";
import LoadingBackdrop from "../../../Utils/LoadingBackdrop";
import { showToast } from "../../../Utils/Tostify/ToastManager";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  ChevronsLeft,
  ChevronsRight,
  CircleX,
  TriangleAlert,
} from "lucide-react";
import { IoRefreshCircle } from "react-icons/io5";

let popperPlacement = "bottom-start";
const ItemType = {
  COLUMN: "COLUMN",
};
const EXCEL_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const DraggableColumn = ({ col, index, checkedColumns, setCheckedColumns }) => {
  return (
    <Draggable draggableId={col.field.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px",
            border: "1px solid lightgray",
            marginBottom: "15px",
            height: "55px",
            background: snapshot.isDragging ? "#e0e0e0" : "rgb(234, 234, 234)",
            borderRadius: "4px",
            cursor: "grab",
            opacity: snapshot.isDragging ? 0.5 : 1,
            transition: "opacity 0.2s ease",
            ...provided.draggableProps.style,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={checkedColumns[col.field]}
                onChange={() =>
                  setCheckedColumns((prev) => ({
                    ...prev,
                    [col.field]: !prev[col.field],
                  }))
                }
              />
            }
            label={col.headerName}
          />
        </div>
      )}
    </Draggable>
  );
};

export default function AllEmployeeDataReport({
  selectedFilterCategory,
  selectedFileter,
  AllFinalData,
  ref,
  onClosePane,
  onOpenPane,
  isPaneCollapsed,
  setCustomerBindeChnaged,
  handleRefresh,
}) {
  const [commonSearch, setCommonSearch] = React.useState("");
  const [toDate, setToDate] = React.useState(null);
  const [fromDate, setFromDate] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const gridContainerRef = React.useRef(null);
  const [showImageView, setShowImageView] = React.useState(false);
  const [selectedColors, setSelectedColors] = React.useState([]);
  const [openPopup, setOpenPopup] = React.useState(false);
  const [openDefaultPin, setOpenDefaultpin] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [openPDate, setOpenPDate] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedRd3Name, setSelectedRd3Name] = React.useState("");

  const [masterKeyData, setMasterKeyData] = React.useState();
  const [allColumIdWiseName, setAllColumIdWiseName] = React.useState();
  const [allColumData, setAllColumData] = React.useState();
  const [allRowData, setAllRowData] = React.useState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [lodingRecakulate, setLodingRecakulate] = React.useState(false);
  const [checkedColumns, setCheckedColumns] = React.useState({});
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState();
  const [selectedEmployeeCode, setSelectedEmployeeCode] = React.useState();
  const [selectedEmployeeName, setSelectedEmployeeName] = React.useState();
  const [searchParams] = useSearchParams();
  const [logoutRow, setLogoutRow] = React.useState(null);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [openCustomerBideModel, setOpenCustomerBideModel] =
    React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isDeleteModel, setIsDeleteMode] = React.useState(false);
  const { setDeviceStatus } = useDeviceStatus();
  const [selectedRowId, setSelectedRowId] = React.useState();
  const [selectedRowIdApi, setSelectedRowIdApi] = React.useState();

  const [selectedEmployeeBarCode, setSelectedEmployeeBarCode] =
    React.useState();
  const [customerBindAllData, setCustomerBindAllData] = React.useState();
  const [customerBindIsloading, setCustomerBindIsLoading] = React.useState();
  const [lastUpdated, setLastUpdated] = React.useState(false);
  const gridRef = React.useRef(null);

  //selecino.... main

  const useDeviceSummary = (AllFinalData) => {
    const [summary, setSummary] = React.useState({
      totalDevices: 0,
      activeDevices: 0,
      deactiveDevices: 0,
      upcomingExpiryDevices: 0,
      enableCount: 0,
      disableCount: 0,
    });

    React.useImperativeHandle(ref, () => ({
      handleClearFilter,
    }));

    React.useEffect(() => {
      const records = AllFinalData || [];
      const now = new Date();
      const fifteenDaysLater = new Date(now);
      fifteenDaysLater.setDate(now.getDate() + 15);

      let activeCount = 0;
      let deactiveCount = 0;
      let upcomingExpiryCount = 0;
      let enable = 0;
      let disable = 0;

      for (const record of records) {
        const status = record["Status"];
        const access = record["Access"]; // fixed here
        const expiryDateStr = record["Expirydate"]; // fixed here

        if (status === "Active") activeCount++;
        if (status === "DeActive") deactiveCount++;

        if (access === 1) enable++;
        if (access === 0) disable++;

        if (expiryDateStr) {
          const expiryDate = new Date(expiryDateStr);
          if (expiryDate >= now && expiryDate <= fifteenDaysLater) {
            upcomingExpiryCount++;
          }
        }
      }

      setSummary({
        totalDevices: records.length,
        activeDevices: activeCount,
        deactiveDevices: deactiveCount,
        upcomingExpiryDevices: upcomingExpiryCount,
        enableCount: enable,
        disableCount: disable,
      });
    }, [AllFinalData]);

    return summary;
  };


  console.log('selectedFileter', selectedFilterCategory);
  
  const records = AllFinalData?.rd1 || [];
  const employeeSummary = {
    connectedDevices: records.filter((r) => r["4"]).length,
    activeDevices: records.filter((r) => r["5"] === "Active").length,
    deactiveDevices: records.filter((r) => r["5"] === "DeActive").length,
    packages: [...new Set(records.map((r) => r["9"]).filter(Boolean))],
    appNames: [...new Set(records.map((r) => r["1"]).filter(Boolean))],
  };

  const deviceSummary = {
    activeDevices: records.filter((r) => r["5"] === "Active").length,
    deactiveDevices: records.filter((r) => r["5"] === "DeActive").length,
    connectedDevices: records.filter((r) => r["4"]).length,
    timeLeft: [...new Set(records.map((r) => r["15"]).filter(Boolean))].join(
      ", "
    ),
    connectedApps: [
      ...new Set(records.map((r) => r["1"]).filter(Boolean)),
    ].join(", "),
  };

  /*
{
  totalDevices: 3,
  activeDevices: 1,
  deactiveDevices: 2,
  upcomingExpiryDevices: 3,
  enableCount: 3,
  disableCount: 0
}
*/

  const APICall = () => {
    setIsLoading(true);
    const { rd, rd1 } = AllFinalData || {};
    if (!rd || !rd1) {
      console.warn("Invalid data format");
      return;
    }

    let filteredData = [];
    let filteredDataColumKey = [];

    switch (selectedFileter) {
      case "App":
        filteredData = rd1.filter(
          (entry) => entry["1"] === selectedFilterCategory
        );
        if (selectedFilterCategory === "Admin app") {
          filteredDataColumKey = OtherKeyDataAdmin?.rd1;
        } else if (selectedFilterCategory === "Sales rep app") {
          filteredDataColumKey = OtherKeyDataSales?.rd1;
        } else if (selectedFilterCategory === "ExpressApp") {
          filteredDataColumKey = OtherKeyDataExpress?.rd1;
        } else {
          filteredDataColumKey = OtherKeyDataIcate?.rd1;
        }
        break;
      case "Employee":
        filteredData = rd1.filter(
          (entry) => entry["10"] === selectedFilterCategory
        );
        filteredDataColumKey = OtherKeyData?.rd1;
        break;

      case "Device":
        filteredData = rd1.filter(
          (entry) => entry["3"] === selectedFilterCategory
        );
        filteredDataColumKey = OtherKeyData?.rd1;
        break;

      default:
        console.warn("Unknown filter type");
    }

    setMasterKeyData(OtherKeyData?.rd);
    setAllColumData(filteredDataColumKey);
    setAllColumIdWiseName(AllFinalData?.rd);
    setAllRowData(filteredData);
    setIsLoading(false);
  };

  React.useEffect(() => {
    APICall();
  }, [selectedFileter, selectedFilterCategory, AllFinalData]);

  React.useEffect(() => {
    if (allColumData) {
      const initialCheckedColumns = {};
      Object?.values(allColumData)?.forEach((col) => {
        initialCheckedColumns[col.field] = col.ColumShow;
      });
      setCheckedColumns(initialCheckedColumns);
    }
  }, [allColumData]);

  const originalRows =
    allColumIdWiseName &&
    allRowData?.map((row, index) => {
      const formattedRow = {};
      Object.keys(row).forEach((key) => {
        formattedRow[allColumIdWiseName[0][key]] = row[key];
      });
      return { id: index, ...formattedRow };
    });

  const [pageSize, setPageSize] = React.useState(10);
  const [filteredRows, setFilteredRows] = React.useState(originalRows);
  const [filters, setFilters] = React.useState({});
  const summary = useDeviceSummary(filteredRows);

  const summaryArray =
    selectedFileter === "App"
      ? [
          {
            field: "totalDevices",
            Title: summary.totalDevices,
            summaryTitle: "Total Devices",
          },
          {
            field: "activeDevices",
            Title: summary.activeDevices,
            summaryTitle: "Active Devices",
          },
          {
            field: "deactiveDevices",
            Title: summary.deactiveDevices,
            summaryTitle: "Deactive Devices",
          },
          {
            field: "upcomingExpiryDevices",
            Title: summary.upcomingExpiryDevices,
            summaryTitle: "Expiring Soon",
          },
          {
            field: "enableCount",
            Title: summary.enableCount,
            summaryTitle: "Enabled",
          },
          {
            field: "disableCount",
            Title: summary.disableCount,
            summaryTitle: "Disabled",
          },
        ]
      : selectedFileter === "Employee"
      ? [
          {
            field: "connectedDevices",
            Title: employeeSummary.connectedDevices,
            summaryTitle: "Connected Devices",
          },
          {
            field: "activeDevices",
            Title: employeeSummary.activeDevices,
            summaryTitle: "Active Devices",
          },
          {
            field: "deactiveDevices",
            Title: employeeSummary.deactiveDevices,
            summaryTitle: "Deactive Devices",
          },
          // ,
          // {
          //   field: "packages",
          //   Title: employeeSummary.packages.join(", "),
          //   summaryTitle: "Packages",
          // },
          {
            field: "appNames",
            Title: employeeSummary.appNames.join(", "),
            summaryTitle: "Apps",
          },
        ]
      : selectedFileter === "Device"
      ? [
          {
            field: "activeDevices",
            Title: deviceSummary.activeDevices,
            summaryTitle: "Active Devices",
          },
          {
            field: "deactiveDevices",
            Title: deviceSummary.deactiveDevices,
            summaryTitle: "Deactive Devices",
          },
          {
            field: "connectedDevices",
            Title: deviceSummary.connectedDevices,
            summaryTitle: "Connected Devices",
          },
          {
            field: "timeLeft",
            Title: deviceSummary.timeLeft,
            summaryTitle: "Time Left",
          },
          {
            field: "connectedApps",
            Title: deviceSummary.connectedApps,
            summaryTitle: "App Names",
          },
        ]
      : [];

  React.useEffect(() => {
    if (!allColumData) return;
    const columnData = Object?.values(allColumData)
      ?.filter((col) => col.ColumShow)
      ?.map((col, index) => {
        const isPriorityFilter = col.proiorityFilter === true;
        return {
          field: col.field,
          headerName: col.headerName,
          width: col.Width,
          align: col.ColumAlign || "left",
          headerAlign: col.Align,
          filterable: col.ColumFilter,
          suggestionFilter: col.suggestionFilter,
          hrefLink: col.HrefLink,
          summuryValueKey: col.summuryValueKey,
          summaryTitle: col.summaryTitle,
          ToFixedValue: col.ToFixedValue,
          filterTypes: [
            col.NormalFilter && "NormalFilter",
            col.DateRangeFilter && "DateRangeFilter",
            col.MultiSelection && "MultiSelection",
            col.RangeFilter && "RangeFilter",
            col.SuggestionFilter && "suggestionFilter",
            col.selectDropdownFilter && "selectDropdownFilter",
          ].filter(Boolean),

          renderCell: (params) => {
            if (col.ToFixedValue) {
              return (
                <p
                  style={{
                    fontSize: col.FontSize || "inherit",
                  }}
                >
                  {params.value?.toFixed(col.ToFixedValue)}
                </p>
              );
            } else if (col.field == "ActionDelete") {
              return (
                <div
                  style={{
                    fontSize: col.FontSize || "inherit",
                  }}
                >
                  <Button
                    className="row_delete_button"
                    onClick={() => {
                      setLogoutRow(params.row);
                      setShowLogoutModal(true);
                      setIsDeleteMode(true);
                    }}
                  >
                    <MdDelete
                      style={{ color: "rgb(238, 37, 37)", fontSize: "25px" }}
                    />
                  </Button>
                </div>
              );
            } else if (col.field == "ActionLogout") {
              return (
                <div
                  style={{
                    fontSize: col.FontSize || "inherit",
                  }}
                >
                  <Button
                    className="row_logout_button"
                    onClick={() => {
                      setLogoutRow(params.row);
                      setShowLogoutModal(true);
                      setIsDeleteMode(false);
                    }}
                  >
                    <IoMdLogOut
                      style={{ color: "rgb(238, 37, 37)", fontSize: "25px" }}
                    />
                  </Button>
                </div>
              );
            } else if (col.dateColumn == true) {
              const date = new Date(params.value);
              const formattedDate = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              return (
                <span
                  style={{
                    fontSize: col.FontSize || "inherit",
                  }}
                >
                  {formattedDate}
                </span>
              );
            } else if (col.hrefLink) {
              return (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "blue",
                    textDecoration: "underline",
                    fontSize: col.FontSize || "inherit",
                    padding: "5px 20px",
                    cursor: "pointer",
                    width: "120px",
                    fontSize: col.FontSize || "inherit",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                  onClick={() => handleCellClick(params)}
                >
                  {params.value}
                </a>
              );
            } else {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "5px 0px",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {params.value}
                </span>
              );
            }
          },
        };
      });
    setColumns(columnData);
  }, [allColumData]);

  React.useEffect(() => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.field === "Access") {
          return {
            ...col,
            renderCell: (params) => (
              <Checkbox
                checked={params.row.Access == 1}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleAccessChange(e, params.row)}
              />
            ),
          };
        } else if (col.field === "customerBind") {
          return {
            ...col,
            renderCell: (params) => (
              <div>
                {selectedFilterCategory === "ExpressApp" ? (
                  <p
                    style={{
                      color: "blue",
                      backgroundColor: col.BackgroundColor || "inherit",
                      fontSize: col.FontSize || "inherit",
                      textTransform: col.ColumTitleCapital
                        ? "uppercase"
                        : "none",
                      padding: "5px 0px",
                      borderRadius: col.BorderRadius,
                      margin: "0px",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setOpenCustomerBideModel(true);
                      handleGetCustomerBindData(params.row);
                    }}
                  >
                    {params?.row?.CntBindCust == 0
                      ? "Customer Bind"
                      : "View List"}
                  </p>
                ) : (
                  <Select
                    value={params.row.customerBind ?? ""}
                    onChange={(e) =>
                      handleCustomerBindChange(e.target.value, params.row)
                    }
                    size="small"
                    fullWidth
                    className="MenuSelectItem"
                  >
                    {CustomerBind.map((item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                        className="MenuSelectItem_select"
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </div>
            ),
          };
        }
        return col;
      })
    );
  }, [allColumData, allRowData]);

  const handleCellClick = (params) => {
    setSelectedEmployeeName(params?.row?.employeename);
    setSelectedEmployeeBarCode(params?.row?.barcode);
    setSelectedDepartmentId(params?.row?.deptid);
    setSelectedEmployeeCode(params?.row?.employeecode);
    setOpen(true);
  };

  // React.useEffect(() => {
  //   const hasActiveFilters = Object.values(filters).some(
  //     (val) => val && (Array.isArray(val) ? val.length > 0 : val !== "")
  //   );
  //   if (!hasActiveFilters) {
  //     setFilteredRows(originalRows);
  //   }
  // }, [originalRows, filters]);

  React.useEffect(() => {
    const newFilteredRows = originalRows?.filter((row) => {
      let isMatch = true;
      for (const filterField of Object.keys(filters)) {
        const filterValue = filters[filterField];
        if (!filterValue || filterValue.length === 0) continue;

        if (filterField.includes("_min") || filterField.includes("_max")) {
          const baseField = filterField.replace("_min", "").replace("_max", "");
          const rowValue = parseFloat(row[baseField]);
          if (isNaN(rowValue)) {
            isMatch = false;
            break;
          }
          if (
            filterField.includes("_min") &&
            parseFloat(filterValue) > rowValue
          ) {
            isMatch = false;
            break;
          }
          if (
            filterField.includes("_max") &&
            parseFloat(filterValue) < rowValue
          ) {
            isMatch = false;
            break;
          }
        } else if (Array.isArray(filterValue)) {
          if (!filterValue.includes(row[filterField])) {
            isMatch = false;
            break;
          }
        } else {
          const rowValue = row[filterField]?.toString().toLowerCase() || "";
          if (!rowValue.includes(filterValue.toLowerCase())) {
            isMatch = false;
            break;
          }
        }
      }
      if (isMatch && selectedColors.length > 0 && row.PriorityId) {
        if (!selectedColors.includes(row.PriorityId)) {
          isMatch = false;
        }
      }
      if (isMatch && fromDate && toDate) {
        const dateColumn = columns.find(
          (col) =>
            col.filterTypes && col.filterTypes.includes("DateRangeFilter")
        );
        if (dateColumn) {
          const rowDate = new Date(row[dateColumn.field]);
          if (
            isNaN(rowDate.getTime()) ||
            rowDate < fromDate ||
            rowDate > toDate
          ) {
            isMatch = false;
          }
        }
      }
      if (isMatch && commonSearch) {
        const searchText = commonSearch.toLowerCase();
        const hasMatch = Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchText)
        );
        if (!hasMatch) {
          isMatch = false;
        }
      }
      return isMatch;
    });
    const rowsWithSrNo = newFilteredRows?.map((row, index) => ({
      ...row,
      srNo: index + 1,
    }));
    setFilteredRows(rowsWithSrNo);
  }, [filters, commonSearch, fromDate, toDate, columns, selectedColors]);

  const handleLogoutDevice = async (Row) => {
    const sp = searchParams.get("sp");

    const mode = isDeleteModel ? "DeviceDelete" : "DeviceForceLogOut";
    const soketMode = isDeleteModel ? "AccountDeleted" : "ForceLogout";

    const body = {
      con: `{"id":"","mode":"${mode}","appuserid":"amrut@eg.com"}`,
      p: `{\"AppDevRowId\":${Row?.Id}}`,
      f: "Task Management (taskmaster)",
    };
    try {
      const response = await GetWorkerData(body, sp);
      if (response?.Data?.rd[0]?.msg === "Success") {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
        setDeviceStatus({
          type: soketMode,
          timestamp: Date.now(),
          uniqueId: Row?.UniqueID,
        });
        if (isDeleteModel) {
          setFilteredRows((prevRows) =>
            prevRows.filter((r) => r.Id !== Row.Id)
          );
        }
      }
    } catch (err) {
      console.error("Error updating customer bind:", err);
    }
  };

  const handleCustomerBindChange = async (newBindId, row) => {
    const body = {
      con: '{"id":"","mode":"DeviceCustomerBind","appuserid":"amrut@eg.com"}',
      p: `{\"AppDevRowId\":${row.Id},\"CustomerBindTypeId\":${newBindId}}`,
      f: "Task Management (taskmaster)",
    };
    const sp = searchParams.get("sp");
    try {
      const response = await GetWorkerData(body, sp);
      if (response?.Data?.rd[0]?.msg === "Success") {
        setAllRowData((prevData) => {
          return prevData.map((r) => {
            if (r["19"] === row.Id) {
              return {
                ...r,
                11: newBindId,
              };
            }
            return r;
          });
        });
        setDeviceStatus({
          type: "CustomerBindChanged",
          timestamp: Date.now(),
          uniqueId: row?.UniqueID,
        });
      }
    } catch (err) {
      console.error("Error updating customer bind:", err);
    }
  };

  const handleAccessChange = async (event, row) => {
    const isChecked = event.target.checked;
    const body = {
      con: '{"id":"","mode":"DeviceEnbDcb","appuserid":"amrut@eg.com"}',
      p: `{"AppDevRowId":${row?.Id},"IsEnable":${isChecked ? 1 : 0}}`,
      f: "Task Management (taskmaster)",
    };

    const sp = searchParams.get("sp");
    try {
      const fetchedData = await GetWorkerData(body, sp);

      if (fetchedData?.Data.rd[0]?.msg === "Success") {
        setAllRowData((prevData) => {
          return prevData.map((r) => {
            if (r["19"] === row.Id) {
              return {
                ...r,
                6: isChecked ? 1 : 0,
              };
            }
            return r;
          });
        });

        let isCheckedVal = isChecked ? "deviceEnabled" : "deviceDisabled";
        setDeviceStatus({
          type: isCheckedVal,
          timestamp: Date.now(),
          uniqueId: row?.UniqueID,
        });

        setAllColumData((prev) => [...prev]); // If needed to refresh columns
      }
    } catch (error) {
      console.error("Failed to update Access:", error);
    }
  };

  const handleFilterChange = (field, value, filterType) => {
    setFilters((prevFilters) => {
      if (filterType === "MultiSelection") {
        const selectedValues = prevFilters[field] || [];
        let newValues;

        if (value.checked) {
          newValues = [...selectedValues, value.value];
        } else {
          newValues = selectedValues.filter((v) => v !== value.value);
        }

        return {
          ...prevFilters,
          [field]: newValues,
        };
      }
      return {
        ...prevFilters,
        [field]: value,
      };
    });
  };

  const renderFilter = (col) => {
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;

    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "NormalFilter":
          return (
            <div style={{ width: "100%", margin: "10px 20px" }}>
              <CustomTextField
                key={`filter-${col.field}-NormalFilter`}
                type="text"
                placeholder={`Filter by ${col.headerName}`}
                value={filters[col.field] || ""}
                onChange={(e) => handleFilterChange(col.field, e.target.value)}
                className="filter_column_box"
              />
            </div>
          );
        case "suggestionFilter": {
          const uniqueValues = [
            ...new Set(originalRows.map((row) => row[col.field])),
          ];

          return (
            <div
              key={`filter-${col.field}-suggestionFilter`}
              style={{ width: "100%", margin: "10px 20px" }}
            >
              <CustomTextField
                fullWidth
                placeholder={`Search ${col.headerName}`}
                value={filters[col.field] || ""}
                onChange={(e) => handleFilterChange(col.field, e.target.value)}
                InputProps={{
                  inputProps: {
                    list: `suggestions-${col.field}`,
                  },
                }}
                customBorderColor="rgba(47, 43, 61, 0.2)"
                borderoutlinedColor="#00CFE8"
                customTextColor="#2F2B3DC7"
                customFontSize="0.8125rem"
                size="small"
                variant="filled"
              />
              <datalist id={`suggestions-${col.field}`}>
                {uniqueValues.map((value) => (
                  <option
                    key={`suggestion-${col.field}-${value}`}
                    value={value}
                  />
                ))}
              </datalist>
            </div>
          );
        }

        default:
          return null;
      }
    });
  };

  const renderDateFilter = (col) => {
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;

    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "DateRangeFilter":
          return (
            <DatePicker
              key={`filter-${col.field}-DateRangeFilter`}
              selectsRange
              showYearDropdown
              showMonthDropdown
              monthsShown={2}
              endDate={toDate}
              selected={fromDate}
              startDate={fromDate}
              shouldCloseOnSelect={false}
              id="date-range-picker-months"
              onChange={handleOnChangeRange}
              customInput={
                <CustomTextField
                  customBorderColor="rgba(47, 43, 61, 0.2)"
                  borderoutlinedColor="#00CFE8"
                  customTextColor="#2F2B3DC7"
                  customFontSize="0.8125rem"
                  label="Specific Date Range"
                />
              }
              popperPlacement={popperPlacement}
              dateFormat="dd-MM-yyyy"
              placeholderText={"dd-mm-yyyy dd-mm-yyyy"}
              className="rangeDatePicker"
            />
          );
        default:
          return null;
      }
    });
  };

  const renderFilterDropDown = (col) => {
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;

    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "selectDropdownFilter": {
          const uniqueValues = [
            ...new Set(originalRows.map((row) => row[col.field])),
          ];
          return (
            <div
              key={`filter-${col.field}-selectDropdownFilter`}
              style={{ width: "100%", margin: "20px" }}
            >
              <CustomTextField
                select
                fullWidth
                label={`Select ${col.headerName}`}
                value={filters[col.field] || ""}
                onChange={(e) => handleFilterChange(col.field, e.target.value)}
                customBorderColor="rgba(47, 43, 61, 0.2)"
                borderoutlinedColor="#00CFE8"
                customTextColor="#2F2B3DC7"
                customFontSize="0.8125rem"
                size="small"
                className="selectDropDownMain"
                variant="filled"
              >
                <MenuItem value="">
                  <em>{`Select Employee`}</em>
                </MenuItem>
                {uniqueValues.map((value) => (
                  <MenuItem key={`select-${col.field}-${value}`} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </CustomTextField>
            </div>
          );
        }
        default:
          return null;
      }
    });
  };

  const renderFilterRange = (col) => {
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;
    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "RangeFilter":
          return (
            <div key={`filter-${col.field}-RangeFilter`}>
              <div>
                <Typography>{col.headerName} :</Typography>
              </div>
              <CustomTextField
                type="number"
                className="minTexBox"
                customBorderColor="rgba(47, 43, 61, 0.2)"
                placeholder="Min"
                value={filters[`${col.field}_min`] || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseFloat(e.target.value)
                    : "";
                  setFilters((prev) => ({
                    ...prev,
                    [`${col.field}_min`]: value,
                  }));
                }}
                InputLabelProps={{ shrink: true }}
              />

              <CustomTextField
                type="number"
                placeholder="Max"
                className="minTexBox"
                customBorderColor="rgba(47, 43, 61, 0.2)"
                value={filters[`${col.field}_max`] || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseFloat(e.target.value)
                    : "";
                  setFilters((prev) => ({
                    ...prev,
                    [`${col.field}_max`]: value,
                  }));
                }}
                InputLabelProps={{ shrink: true }}
                style={{ marginLeft: "10px" }}
              />
            </div>
          );
        default:
          return null;
      }
    });
  };

  const renderFilterMulti = (col) => {
    if (!col.filterTypes || !col.filterTypes.includes("MultiSelection"))
      return null;

    const uniqueValues = [
      ...new Set(originalRows.map((row) => row[col.field])),
    ];

    return (
      <div key={col.field}>
        <Accordion>
          <AccordionSummary
            expandIcon={<MdExpandMore />}
            aria-controls={`${col.field}-content`}
            id={`${col.field}-header`}
          >
            <Typography>{col.headerName}</Typography>
          </AccordionSummary>
          <AccordionDetails className="gridMetalComboMain">
            {uniqueValues.map((value) => (
              <label key={value}>
                <input
                  type="checkbox"
                  value={value}
                  checked={(filters[col.field] || []).includes(value)}
                  onChange={(e) =>
                    handleFilterChange(
                      col.field,
                      { value, checked: e.target.checked },
                      "MultiSelection"
                    )
                  }
                />
                {value}
              </label>
            ))}
          </AccordionDetails>
        </Accordion>
      </div>
    );
  };

  const handleOnChangeRange = (dates) => {
    const [start, end] = dates;
    setFromDate(start);
    setToDate(end);
  };

  const handleClose = () => setOpen(false);

  const [sideFilterOpen, setSideFilterOpen] = React.useState(false);
  const toggleDrawer = (newOpen) => () => {
    setSideFilterOpen(newOpen);
  };

  const renderSummary = () => {
    return (
      <div className="summaryBox">
        {summaryArray?.map((col) => {
          return (
            <div className="summaryItem" key={col.field}>
              <div className="AllEmploe_boxViewTotal">
                <div>
                  <p className="AllEmplo_boxViewTotalValue">{col?.Title}</p>
                  <p className="boxViewTotalTitle">{col.summaryTitle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // const renderSummary = () => {
  //   const summaryColumns = columns.filter((col) => {
  //     const columnData = Object.values(allColumData).find(
  //       (data) => data.field === col.field
  //     );
  //     return columnData?.summary;
  //   });

  //   return (
  //     <div className="summaryBox">
  //       {summaryColumns.map((col) => (
  //         <div className="summaryItem">
  //           <div key={col.field} className="AllEmploe_boxViewTotal">
  //             <div>
  //               <p className="AllEmplo_boxViewTotalValue">
  //                 {filteredRows
  //                   ?.reduce(
  //                     (sum, row) => sum + (parseFloat(row[col.field]) || 0),
  //                     0
  //                   )
  //                   .toFixed(col?.summuryValueKey)}
  //                 {/* {col.field === "jobCount"
  //                   ? filteredRows?.reduce(
  //                       (sum, row) => sum + (parseInt(row[col.field], 10) || 0),
  //                       0
  //                     )
  //                   : filteredRows?.length} */}
  //               </p>
  //               <p className="boxViewTotalTitle">{col.summaryTitle}</p>
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (gridContainerRef.current.requestFullscreen) {
        gridContainerRef.current.requestFullscreen();
      } else if (gridContainerRef.current.mozRequestFullScreen) {
        gridContainerRef.current.mozRequestFullScreen();
      } else if (gridContainerRef.current.webkitRequestFullscreen) {
        gridContainerRef.current.webkitRequestFullscreen();
      } else if (gridContainerRef.current.msRequestFullscreen) {
        gridContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(data, "data.xlsx");
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setCommonSearch("");
    setFilters({});
  };

  const handleSendEmail = () => {
    const templateParams = {
      to_name: "Recipient",
      from_name: "Sender",
      message: "Your message content here",
    };
    emailjs
      .send(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        templateParams,
        "YOUR_USER_ID"
      )
      .then(
        (response) => {
          console.log("Email sent successfully", response);
        },
        (error) => {
          console.log("Error sending email", error);
        }
      );
  };

  const handlePrint = () => {};

  const handleImg = () => {
    setShowImageView((prevState) => !prevState);
  };

  const toggleColorSelection = (colorId) => {
    setSelectedColors((prevSelected) => {
      if (prevSelected.includes(colorId)) {
        return prevSelected.filter((id) => id !== colorId);
      } else {
        return [...prevSelected, colorId];
      }
    });
  };

  const moveColumn = (fromIndex, toIndex) => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setColumns(newColumns);
  };

  const handleClickOpenPoup = () => {
    setOpenPopup(true);
  };
  const handleClickOpenPopupDeafiltPin = () => {
    setOpenDefaultpin(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };
  const handleClosePopupPin = () => {
    setOpenDefaultpin(false);
  };

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const handleSave = () => {
    console.log("Saving data...");
    console.log("Selected Date:", selectedDate);
    console.log("Selected Rd3 Name:", selectedRd3Name);
  };

  const onDragEnd = () => {};
  const handleRecalculate = async () => {
    try {
      setLodingRecakulate(true);
      const sp = searchParams.get("sp");

      const modeSetting =  selectedFilterCategory == 'Icatalog' ? "IcatStockCalCulate" : "EvoStockCalCulate";
      let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
      const body = {
        con: `{"id":"","mode":"${modeSetting}","appuserid":"${AllData?.uid}"}`,
        p: "",
        f: "Task Management (taskmaster)",
      };
      const fetchedData = await GetWorkerData(body, sp);
      if (fetchedData?.Data?.rd[0]?.msg == "Success") {
        showToast({
          message: "Recalculate Successfully",
          bgColor: "#3bab3b",
          fontColor: "#fff",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLodingRecakulate(false);
    }
  };

  const handleGetCustomerBindData = async (data) => {
    setSelectedRowId(data?.UniqueID);
    setSelectedRowIdApi(data?.Id);
    setCustomerBindIsLoading(true);
    const sp = searchParams.get("sp");
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const body = {
      con: `{"id":"","mode":"CustomerBindGrid","appuserid":"${AllData?.uid}"}`,
      p: "",
      p: `{\"AppDevRowId\":${data?.Id}}`,
      f: "Task Management (taskmaster)",
    };

    const fetchedData = await GetWorkerData(body, sp);
    setLastUpdated(false);
    if (fetchedData?.Data?.rd) {
      setCustomerBindAllData(fetchedData?.Data?.rd);
      setIsLoading(false);
    }
  };

  const [filterType, setFilterType] = React.useState("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortModel, setSortModel] = React.useState([]);
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // Build columns
  const columnsCustomerBind = [
    { field: "customercode", headerName: "Customer Code", width: 150, flex: 1 },
    { field: "firstname", headerName: "First Name", width: 150, flex: 1 },
    { field: "lastname", headerName: "Last Name", width: 150, flex: 1 },
  ];

  // Rows with filter
  const rows = React.useMemo(() => {
    if (!customerBindAllData) return [];
    let data = customerBindAllData;
    if (filterType === "bound")
      data = data.filter((r) => r.IsBindCustomer === 1);
    if (filterType === "unbound")
      data = data.filter((r) => r.IsBindCustomer === 0);
    if (searchTerm.trim().length > 0) {
      const s = searchTerm.toLowerCase();
      data = data.filter(
        (r) =>
          r.customercode.toLowerCase().includes(s) ||
          r.firstname.toLowerCase().includes(s) ||
          r.lastname.toLowerCase().includes(s)
      );
    }
    return data.map((r, idx) => ({
      ...r,
      id: r.id ?? idx, // ensure unique id
    }));
  }, [customerBindAllData, filterType, searchTerm]);

  // current page ids
  const currentPageRowIds = React.useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return rows.slice(start, end).map((r) => r.id);
  }, [rows, paginationModel]);

  const columnsCustomer = React.useMemo(() => {
    const checkboxColumn = {
      field: "__checkbox__",
      width: 70,
      headerName: (
        <Checkbox
          checked={
            currentPageRowIds.length > 0 &&
            currentPageRowIds.every((id) => selectedIds.has(id))
          }
          indeterminate={
            currentPageRowIds.some((id) => selectedIds.has(id)) &&
            !currentPageRowIds.every((id) => selectedIds.has(id))
          }
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedIds((prev) => {
              const next = new Set(prev);
              currentPageRowIds.forEach((id) =>
                checked ? next.add(id) : next.delete(id)
              );
              return new Set(next);
            });
          }}
        />
      ),
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Checkbox
          checked={selectedIds.has(params.row.id)}
          onChange={() => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.has(params.row.id)
                ? next.delete(params.row.id)
                : next.add(params.row.id);
              return new Set(next);
            });
          }}
        />
      ),
    };

    const srColumn = {
      field: "sr",
      headerName: "Sr#",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const indexOnPage = params.api.getRowIndexRelativeToVisibleRows(
          params.id
        );
        return (
          paginationModel.page * paginationModel.pageSize + indexOnPage + 1
        );
      },
    };

    return [checkboxColumn, srColumn, ...columnsCustomerBind];
  }, [selectedIds, sortModel, paginationModel, currentPageRowIds]);

  const handleBindToggle = async (shouldBind) => {
    const idsArray = Array.from(selectedIds);
    if (!idsArray.length) return;
    const selectedCustomers = customerBindAllData.filter((item) =>
      idsArray.includes(item.id)
    );
    const allAlreadyBound = selectedCustomers.every(
      (i) => i.IsBindCustomer === 1
    );
    const allAlreadyUnbound = selectedCustomers.every(
      (i) => i.IsBindCustomer === 0
    );
    if (shouldBind && allAlreadyBound) {
      showToast({
        message: "Customers Already Binded",
        bgColor: "#f39c12",
        fontColor: "#fff",
        duration: 4000,
      });
      return;
    }
    if (!shouldBind && allAlreadyUnbound) {
      showToast({
        message: "Customers Already Unbinded",
        bgColor: "#f39c12",
        fontColor: "#fff",
        duration: 4000,
      });
      return;
    }
    const sp = new URLSearchParams(window.location.search).get("sp");
    const allData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const body = {
      con: JSON.stringify({
        id: "",
        mode: shouldBind
          ? "CustomerBindWithDevice"
          : "CustomerUnBindWithDevice",
        appuserid: allData?.uid || "",
      }),
      p: JSON.stringify({
        AppDevRowId: selectedRowIdApi,
        CustomerIdList: idsArray.join(","),
      }),
      f: "Task Management (taskmaster)",
    };
    try {
      const fetchedData = await GetWorkerData(body, sp);
      if (fetchedData?.Data?.rd[0]?.msg === "Success") {
        const updated = customerBindAllData.map((item) =>
          idsArray.includes(item.id)
            ? { ...item, IsBindCustomer: shouldBind ? 1 : 0 }
            : item
        );
        setCustomerBindAllData(updated);
        setDeviceStatus({
          type: "CustomerBindChanged",
          timestamp: Date.now(),
          uniqueId: selectedRowId,
        });
        showToast({
          message: shouldBind
            ? "Customer Bind Successfully"
            : "Customer Unbind Successfully",
          bgColor: "#3bab3b",
          fontColor: "#fff",
          duration: 4000,
        });
        setLastUpdated(true);
        setSelectedIds(new Set());
      } else {
        showToast({
          message: "Cannot bind/unbind more than 50 customers",
          bgColor: "red",
          fontColor: "#fff",
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("API error:", err);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <LoadingBackdrop isLoading={lodingRecakulate} />

      <Modal
        open={openCustomerBideModel}
        onClose={() => {
          setOpenCustomerBideModel(false);
          setFilterType("all");
          lastUpdated && setCustomerBindeChnaged(true);
        }}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px 20px",
            width: "45%",
            height: "60%",
            borderRadius: 10,
            position: "relative",
            boxShadow: "0 0 20px rgba(0,0,0,0.1)",
          }}
        >
          <CircleX
            onClick={() => {
              setOpenCustomerBideModel(false);
              setFilterType("all");
              lastUpdated && setCustomerBindeChnaged(true);
            }}
            style={{
              position: "absolute",
              right: 20,
              top: 15,
              cursor: "pointer",
            }}
          />
          <p
            style={{ margin: 0, fontWeight: 600, fontSize: 20, color: "gray" }}
          >
            Bind Customer
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              gap: 12,
            }}
          >
            <TextField
              select
              size="small"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All Customers</MenuItem>
              <MenuItem value="bound">Bind Customers</MenuItem>
              <MenuItem value="unbound">Unbind Customers</MenuItem>
            </TextField>
            <TextField
              placeholder="Search…"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm("")} edge="end">
                      <CircleX size={20} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <Button
              variant="contained"
              color="success"
              disabled={!selectedIds.size}
              onClick={() => handleBindToggle(true)}
            >
              Bind
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={!selectedIds.size}
              onClick={() => handleBindToggle(false)}
            >
              Unbind
            </Button>
          </div>

          <div style={{ height: "80%", marginTop: 20 }}>
            <DataGrid
              rows={rows}
              columns={columnsCustomer}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 20, 50, 100]}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                    page: 0,
                  },
                },
              }}
              getRowClassName={(params) =>
                params.row.IsBindCustomer === 1
                  ? "bound-customer-row"
                  : "unbound-customer-row"
              }
              sx={{
                "& .MuiDataGrid-menuIcon": { display: "none" },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                  borderColor: "rgba(224,224,224,1)",
                },

                "& .bound-customer-row": {
                  backgroundColor: "#e0ffe0",
                },
                "& .MuiDataGrid-menuIcon": {
                  display: "none",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                  borderColor: "rgba(224, 224, 224, 1)",
                },
              }}
            />
          </div>
        </div>
      </Modal>
      <div
        className="DeviceAllData_mainGridView"
        sx={{ width: "100vw", display: "flex", flexDirection: "column" }}
        ref={gridContainerRef}
      >
        {isLoading && (
          <div className="loader-overlay">
            {/* <CircularProgress className="loadingBarManage" /> */}
          </div>
        )}
        {showSuccess && (
          <div className="success-message">
            {" "}
            {isDeleteModel ? "Delete" : "Logout"} successful!
          </div>
        )}

        <Modal
          open={showLogoutModal}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "0px",
            outline: "0px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px 20px",
              width: "22%",
              borderRadius: "10px",
              position: "relative",
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ position: "absolute", right: "20px", top: "15px" }}>
              <CircleX
                onClick={() => setShowLogoutModal(false)}
                style={{ color: "gray", cursor: "pointer", fontSize: "20px" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "15px",
              }}
            >
              <TriangleAlert
                style={{
                  backgroundColor: "#f3cbca",
                  color: "red",
                  padding: "10px",
                  fontSize: "30px",
                  borderRadius: "50%",
                }}
              />
            </div>

            <p
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "10px",
              }}
            >
              {/* ⚠️ */}
              Confirm {isDeleteModel ? "Deletion" : "Force Logout"}
            </p>

            <p
              style={{
                textAlign: "center",
                fontSize: "15px",
                color: "#716b6b",
                fontWeight: 500,
                margin: "3px",
              }}
            >
              Are you sure you want to proceed?
            </p>
            <p
              style={{
                textAlign: "center",
                fontSize: "15px",
                color: "#716b6b",
                fontWeight: 500,
                margin: "0px",
              }}
            >
              This action will disconnect and{" "}
              <b>permanently remove all app data.</b>
            </p>
            <p
              style={{
                textAlign: "center",
                fontSize: "15px",
                color: "#716b6b",
                fontWeight: 500,
                marginBottom: "15px",
                marginTop: "3px",
              }}
            >
              Once {isDeleteModel ? "deleted" : "logged out"}, the data{" "}
              <b>cannot be recovered.</b>
            </p>

            {/* Buttons */}
            <div
              style={{ display: "flex", justifyContent: "center", gap: "10px" }}
            >
              <Button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  height: "35px",
                  width: "100px",
                  backgroundColor: "#e73838",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "5px",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleLogoutDevice(logoutRow); // Your action
                  setShowLogoutModal(false);
                }}
                style={{
                  height: "35px",
                  width: "160px",
                  backgroundColor: "#7568fb",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "5px",
                }}
              >
                {isDeleteModel ? "Confirm Delete" : "Confirm Logout"}
              </Button>
            </div>
          </div>
        </Modal>

        <Dialog open={openPopup} onClose={handleClosePopup}>
          <div className="ConversionMain">
            <div className="filterDrawer">
              <p className="dataGridPopupColumSetting">Column Settings</p>
              <Droppable droppableId="columns-list" type="COLUMN">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {columns.map((col, index) => (
                      <DraggableColumn
                        key={col.field}
                        col={col}
                        index={index}
                        checkedColumns={checkedColumns}
                        setCheckedColumns={setCheckedColumns}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <Button>Save</Button>
            </div>
          </div>
        </Dialog>

        <Dialog open={openDefaultPin} onClose={handleClosePopupPin}>
          <div className="Deafult_Pin_main">
            <p style={{ fontWeight: 600 }}>Enter Default Pin</p>
            <CustomTextField type="text" />
            <Button onClick={handleClosePopupPin} className="Save_btn">
              Save
            </Button>
          </div>
        </Dialog>
        <Drawer
          open={sideFilterOpen}
          onClose={toggleDrawer(false)}
          className="drawerMain"
        >
          <p style={{ margin: "20px 20px 0px 20px", fontSize: "25px" }}>
            Filter
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {columns
              .filter(
                (col) =>
                  col.filterable && col.filterTypes?.includes("MultiSelection")
              )
              .map((col) => renderFilterMulti(col))}
          </div>

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field}>{renderFilterRange(col)}</div>
            ))}

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                {renderFilterDropDown(col)}
              </div>
            ))}

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                {renderFilter(col)}
              </div>
            ))}
        </Drawer>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          <div style={{ height: "30px" }}>
            {!isPaneCollapsed && (
              <p
                onClick={onClosePane}
                style={{ cursor: "pointer", color: "red", margin: "10px" }}
              >
                <ChevronsLeft />
              </p>
            )}

            {isPaneCollapsed && (
              <p
                onClick={onOpenPane}
                style={{ cursor: "pointer", color: "green", margin: "10px" }}
              >
                <ChevronsRight />
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {renderSummary()}

            {masterKeyData?.ColumnSettingPopup && (
              <div className="topSettingBtnPopup" onClick={handleClickOpenPoup}>
                <AiFillSetting style={{ height: "25px", width: "25px" }} />
              </div>
            )}
            {masterKeyData?.fullScreenGridButton && (
              <button className="fullScreenButton" onClick={toggleFullScreen}>
                <RiFullscreenLine
                  style={{ marginInline: "5px", fontSize: "30px" }}
                />
              </button>
            )}

            <Button
              style={{
                display: "flex",
                height: "100%",
                margin: "-20px 30px 0px 0px",
                backgroundColor: "#7468f0",
                minWidth: "40px",
              }}
            >
              <IoRefreshCircle
                onClick={handleRefresh}
                style={{
                  color: "white",
                  fontSize: "29px",
                  cursor: "pointer",
                  opacity: 1,
                }}
              />
            </Button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <Button onClick={toggleDrawer(true)} className="FiletrBtnOpen">
                <MdOutlineFilterAlt style={{ fontSize: "25px" }} />
                Filter
              </Button>
              <button onClick={handleClearFilter} className="ClearFilterButton">
                <MdOutlineFilterAltOff style={{ fontSize: "25px" }} />
                Clear
              </button>

              {/* <p
                style={{ fontWeight: 600, color: "#696262", fontSize: "17px" }}
              >
                {" "}
                Last Updated :- {lastUpdated}
              </p> */}
            </div>
            {columns
              .filter((col) => col.filterable)
              .map((col) => (
                <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                  {renderDateFilter(col)}
                </div>
              ))}

            <div
              className="date-selector"
              style={{ display: "flex", gap: "10px" }}
            >
              {masterKeyData?.progressFilter && (
                <button
                  className="FiletrBtnOpen"
                  onClick={() => setOpenPDate(!openPDate)}
                >
                  Set P.Date
                </button>
              )}
              <div
                className={`transition-container ${
                  openPDate ? "open" : "closed"
                }`}
                style={{
                  transition: "0.5s ease",
                  opacity: openPDate ? 1 : 0,
                  maxHeight: openPDate ? "300px" : "0",
                  overflow: "hidden",
                  display: openPDate ? "flex" : "none",
                  gap: "10px",
                }}
              >
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd-MM-yyyy"
                  customInput={
                    <CustomTextField
                      customBorderColor="rgba(47, 43, 61, 0.2)"
                      borderoutlinedColor="#00CFE8"
                      customTextColor="#2F2B3DC7"
                      customFontSize="0.8125rem"
                      style={{ Width: "100px" }}
                    />
                  }
                  placeholderText="Select Date"
                />

                <button
                  onClick={handleSave}
                  variant="contained"
                  className="FiletrBtnOpen"
                  sx={{ marginTop: 2 }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: "10px" }}>
            {masterKeyData?.mailButton && (
              <img
                src={mainButton}
                style={{ cursor: "pointer" }}
                onClick={handleSendEmail}
              />
            )}

            {masterKeyData?.PrintButton && (
              <img
                src={printButton}
                style={{ cursor: "pointer", height: "40px", width: "40px" }}
                onClick={handlePrint}
              />
            )}

            {masterKeyData?.imageView && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showImageView ? (
                  <img
                    src={gridView}
                    className="imageViewImgGrid"
                    onClick={handleImg}
                  />
                ) : (
                  <img
                    src={imageView}
                    className="imageViewImg"
                    onClick={handleImg}
                  />
                )}
              </div>
            )}

            {selectedFilterCategory != "ExpressApp" && (
              <Button
                className="SetDefault_pin"
                onClick={handleClickOpenPopupDeafiltPin}
              >
                Set Default Pin
              </Button>
            )}
            {selectedFilterCategory != "ExpressApp" && (
              <Button
                className="Re_CalculateButton"
                onClick={handleRecalculate}
              >
                Recalculate
              </Button>
            )}

            <CustomTextField
              type="text"
              placeholder="Common Search..."
              value={commonSearch}
              customBorderColor="rgba(47, 43, 61, 0.2)"
              onChange={(e) => setCommonSearch(e.target.value)}
            />

            {masterKeyData?.ExcelExport && (
              <button onClick={exportToExcel} className="All_exportButton">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 384 512"
                  height="2em"
                  width="2em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          ref={gridRef}
          style={{ height: "calc(100vh - 305px)", margin: "5px" }}
        >
          {showImageView ? (
            <div>
              <img
                className="imageViewImgage"
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVXLW1j3zO3UP6dIu96A3IpZihTe3fVRsm9g&s"
              />
              <img
                className="imageViewImgage"
                src="https://help.earthsoft.com/ent-data_grid_widget-sample.png"
              />
              <img
                className="imageViewImgage"
                src="https://i0.wp.com/thewwwmagazine.com/wp-content/uploads/2020/07/Screenshot-2020-07-09-at-7.36.56-PM.png?resize=1404%2C1058&ssl=1"
              />
              <img
                className="imageViewImgage"
                src="https://docs.devexpress.com/WPF/images/wpf-data-grid.png"
              />
              <img
                className="imageViewImgage"
                src="https://www.infragistics.com/products/ignite-ui-web-components/web-components/images/general/landing-grid-page.png"
              />
              <img
                className="imageViewImgage"
                src="https://i0.wp.com/angularscript.com/wp-content/uploads/2020/04/Angular-Data-Grid-For-The-Enterprise-nGrid.png?fit=1245%2C620&ssl=1"
              />
              <img
                className="imageViewImgage"
                src="https://angularscript.com/wp-content/uploads/2015/12/ng-bootstrap-grid-370x297.jpg"
              />
            </div>
          ) : (
            <DataGrid
              rows={filteredRows ?? []}
              columns={columns ?? []}
              pageSize={pageSize}
              autoHeight={false}
              checkboxSelection
              columnBuffer={17}
              localeText={{ noRowsLabel: "No Data" }}
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    status: false,
                    traderName: false,
                  },
                },
              }}
              loading={isLoading}
              components={{
                Toolbar: () => null,
                LoadingOverlay: () => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    {/* Loading... */}
                    <CircularProgress className="loadingBarManage" />
                  </div>
                ),
              }}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[5, 10, 15, 25, 50]}
              onCellClick={(params, event) => {
                event.stopPropagation();
              }}
              onRowClick={(params, event) => {
                event.stopPropagation();
              }}
              className="simpleGridView"
              pagination
              sx={{
                "& .MuiDataGrid-cell:focus": {
                  outline: "none", // removes default blue outline
                  borderTop: "1px solid #d3d3d3cf !important",
                },
                "& .MuiDataGrid-cell:focus-within": {
                  outline: "none", // ensures keyboard/tab focus is also hidden
                  borderTop: "1px solid #d3d3d3cf !important",
                },
                "& .MuiDataGrid-menuIcon": {
                  display: "none",
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "inherit !important",
                },
              }}
              componentsProps={{
                pagination: {
                  SelectProps: {
                    MenuProps: {
                      anchorOrigin: {
                        vertical: "top",
                        horizontal: "left",
                      },
                      transformOrigin: {
                        vertical: "bottom",
                        horizontal: "left",
                      },
                      disablePortal: true,
                      marginThreshold: 0,
                    },
                  },
                },
              }}
            />
          )}
        </div>
      </div>

      {/* <Modal
        open={open}
        // onClose={handleClose}
        disableEnforceFocus
        disableAutoFocus
        hideBackdrop
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "0px",
          outline: "0px",
          pointerEvents: "none",
        }}
      >
        <Slide in={open} direction="down" timeout={500}>
          <Box
            sx={{
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 2,
              width: "97%",
              maxHeight: "95vh",
              overflowY: "auto",
              border: "none",
              outline: "none",
              pointerEvents: "auto",
            }}
          >
            <SingleEmployeeWiseData
              selectedDepartmentId={selectedDepartmentId}
              selectedEmployeeCode={selectedEmployeeCode}
              // currentLocation={selectedLocation}
              startDate={startDate}
              endDate={endDate}
              handleClose={handleClose}
              selectedEmployeeBarCode={selectedEmployeeBarCode}
              selectedEmployeeName={selectedEmployeeName}
              selectedMetalType={selectedMetalType}
            />
          </Box>
        </Slide>
      </Modal> */}
    </DragDropContext>
  );
}
