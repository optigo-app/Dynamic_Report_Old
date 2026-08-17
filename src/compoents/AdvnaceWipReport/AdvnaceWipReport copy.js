// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18502

import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import "./AdvnaceWipReport.scss";
import MetalData from "./AdvnaceWipReportMetalData.json";
import PromiseDateData from "./AdvnaceWipReportDatewise.json";
import CategoryData from "./AdvnaceWipReportCategoryWise.json";
import LocationWiseData from "./AdvnaceWipReportLocationWise.json";
import OrderWiseData from "./AdvnaceWipReportOrderWise.json";
import DiamondQuality from "./AdvnaceWipReportDaiQualityWise.json";
import DatePicker from "react-datepicker";
import mainButton from "../images/Mail_32.png";
import printButton from "../images/print.png";
import customerR from "../images/customerR.png";
import gridView from "../images/GriedView.png";
import imageView from "../images/ImageView2.png";
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
  Paper,
  Select,
  Slide,
  Tooltip,
  Typography,
} from "@mui/material";
import emailjs from "emailjs-com";
import {
  MdExpandMore,
  MdOpenInFull,
  MdOutlineFilterAlt,
  MdOutlineFilterAltOff,
} from "react-icons/md";
import CustomTextField from "../text-field/index";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AiFillSetting } from "react-icons/ai";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { CallNewAPI, GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CalendarDays, CircleX, FileSpreadsheet, LayoutGrid, Search } from "lucide-react";
import { IoMdClose } from "react-icons/io";
import Warper from "../WorkerReportSpliterView/AllEmployeeDataReport/warper";

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

const formatToMMDDYYYY = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export default function AdvnaceWipReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [toDate, setToDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [open, setOpen] = useState(false);
  const gridContainerRef = useRef(null);
  const [showImageView, setShowImageView] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [openPopup, setOpenPopup] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [columns, setColumns] = useState([]);
  const [openPDate, setOpenPDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRd3Name, setSelectedRd3Name] = useState("");
  const [masterKeyData, setMasterKeyData] = useState();
  const [allColumIdWiseName, setAllColumIdWiseName] = useState();
  const [allColumData, setAllColumData] = useState();
  const [allRowData, setAllRowData] = useState();
  const [checkedColumns, setCheckedColumns] = useState({});
  const [selectedDepartmentId, setSelectedDepartmentId] = useState();
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState();
  const [lastUpdated, setLastUpdated] = useState("");
  const gridRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [AllFinalData, setFinalData] = useState();
  const [status500, setStatus500] = useState(false);
  const [commonSearch, setCommonSearch] = useState("");
  const [sortModel, setSortModel] = useState([]);
  const [allUserNameList, setAllUserNameList] = useState([]);
  const [selectedDateColumn, setSelectedDateColumn] = useState("ALL Users");
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedDateColumnHyBrid, setSelectedDateColumnHyBrid] =
    useState("ALL");
  const [selectionModel, setSelectionModel] = useState([]);
  const GRID_CONFIGS = [
    { data: MetalData, label: "Metal" },
    { data: PromiseDateData, label: "Promise Date" },
    { data: CategoryData, label: "Category" },
    { data: LocationWiseData, label: "Location" },
    { data: OrderWiseData, label: "Order" },
    { data: DiamondQuality, label: "Diamond Quality" },
  ];
  const [grupEnChekBox, setGrupEnChekBox] = useState({
    designation: true,
    dept: true,
    empname: true,
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });

  const firstTimeLoadedRef = useRef(false);


  const buildColumns = (columData, grupEnChekBox, paginationModel) => {
    if (!columData) return [];
    const columnData = Object.values(columData)
      .filter((col) => col.ColumShow)
      .map((col) => ({
        field: col.field,
        headerName: col.headerName,
        width: col.Width,
        flex: 1,
        // ... rest of your existing column mapping
      }));
    const srColumn = { field: "sr", headerName: "Sr#", width: 40, sortable: false };
    return [srColumn, ...columnData];
  };

  const gridColumns = GRID_CONFIGS.map((config) =>
    buildColumns(config.data?.rd1, grupEnChekBox, paginationModel)
  );

  // ─── The fix: handle missing key mappings + filter undefined keys ───

  const buildRows = (columIdWiseName, rowData) => {
    if (!columIdWiseName || !rowData) return [];

    const keyMap = columIdWiseName[0]; // e.g. { MetalType: "Metal Type", NetWtgm: "Nwt", ... }

    return rowData.map((row, index) => {
      const formattedRow = { id: index };

      Object.keys(row).forEach((key) => {
        const mappedKey = keyMap[key];
        // Only include keys that exist in this grid's column mapping
        if (mappedKey !== undefined && mappedKey !== null && mappedKey !== '') {
          formattedRow[mappedKey] = row[key];
        }
      });

      return formattedRow;
    });
  };

  const gridRows = GRID_CONFIGS.map((config) =>
    buildRows(config.data?.rd1, allRowData)
);

  useEffect(() => {
    const now = new Date();
    const formattedDate = formatToMMDDYYYY(now);
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    fetchData(formattedDate, formattedDate);
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
    const sp = searchParams.get("sp");
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const clientIpAddress = sessionStorage.getItem("clientIpAddress");

    setIsLoading(true);
    const body = {
      "con": `{\"mode\":\"GetFullReportData\",\"appuserid\":\"${AllData?.uid}\",\"IPAddress\":\"${clientIpAddress}\"}`,
      "p": "",
      "f": "GetFullReportData ( data )"
    }

    try {
      const fetchedData = await CallNewAPI(body, 195);
      console.log('fetchedData: ', fetchedData);
      setAllRowData(fetchedData?.Data?.rd);
      setAllUserNameList(fetchedData?.Data?.rd3);
      setAllColumIdWiseName(fetchedData?.Data?.rd);
      setMasterKeyData(MetalData?.rd);
      setAllColumData(MetalData?.rd1);
      setFinalData(fetchedData?.Data);
      setIsLoading(false);
    } catch (error) {
      if (error?.status == 500) {
        setStatus500(true);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const formatNumber = (n) => n.toString().padStart(2, "0");

    const formattedDate = `${formatNumber(now.getDate())}-${formatNumber(
      now.getMonth() + 1
    )}-${now.getFullYear()} ${formatNumber(now.getHours())}:${formatNumber(
      now.getMinutes()
    )}:${formatNumber(now.getSeconds())}`;

    setLastUpdated(formattedDate);
  }, []);

  useEffect(() => {
    if (allColumData) {
      const initialCheckedColumns = {};
      Object?.values(allColumData)?.forEach((col) => {
        initialCheckedColumns[col.field] = col.ColumShow;
      });
      setCheckedColumns(initialCheckedColumns);
    }
  }, [allColumData]);

  useEffect(() => {
    if (!allColumData) return;
    const columnData = Object?.values(allColumData)
      ?.filter((col) => col.ColumShow)
      ?.map((col, index) => {
        const isPriorityFilter = col.proiorityFilter === true;
        return {
          field: col.field,
          headerName: (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {col.GrupChekBox && (
                <Checkbox
                  checked={grupEnChekBox[col.field] ?? true} // 👉 Correct binding to grupEnChekBox
                  onChange={() => handleGrupEnChekBoxChange(col.field)} // 👉 Correct handler
                  size="small"
                  sx={{ p: 0 }}
                />
              )}
              {col.headerName}
            </div>
          ),
          width: col.Width,
          align: col.ColumAlign || "left",
          headerAlign: col.Align,
          filterable: col.ColumFilter,
          suggestionFilter: col.suggestionFilter,
          hrefLink: col.HrefLink,
          summuryValueKey: col.summuryValueKey,
          summaryTitle: col.summaryTitle,
          ToFixedValue: col.ToFixedValue,
          sortable: col.sortable,
          flex: 1,
          filterTypes: [
            col.NormalFilter && "NormalFilter",
            col.DateRangeFilter && "DateRangeFilter",
            col.multiSelection && "multiSelection",
            col.RangeFilter && "RangeFilter",
            col.suggestionFilter && "suggestionFilter",
            col.selectDropdownFilter && "selectDropdownFilter",
          ].filter(Boolean),

          renderCell: (params) => {
            if (col.ToFixedValue) {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "0px",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {params.value?.toFixed(col.ToFixedValue)}
                </span>
              );
            } else if (col.dateColumn == true) {
              const formattedDate =
                params.value && !isNaN(new Date(params.value).getTime())
                  ? new Date(params.value).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  : "";
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "0px",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {formattedDate}
                </span>
              );
            } else if (col.hrefLink) {
              return (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "blue",
                      textDecoration: "underline",
                      fontSize: col.FontSize || "inherit",
                      padding: "0px",
                      cursor: "pointer",
                      fontSize: col.FontSize || "inherit",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      width: "120px",
                    }}
                    onClick={() => handleClick(params)}
                  >
                    {params.value}
                  </a>

                  <img
                    src={customerR}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                    onClick={() => handleClickInvoiceImg(params)}
                  />
                </div>
              );
            } else {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "0px",
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

    const srColumn = {
      field: "sr",
      headerName: "Sr#",
      width: 40,
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
    setColumns([srColumn, ...columnData]);
  }, [allColumData, grupEnChekBox, sortModel, paginationModel]);

  const handleCellClick = (params) => {
    setSelectedDepartmentId(params?.row?.deptid);
    setSelectedEmployeeCode(params?.row?.employeecode);
    setOpen(true);
  };

  const originalRows =
    allColumIdWiseName &&
    allRowData?.map((row, index) => {
      const formattedRow = {};
      Object.keys(row).forEach((key) => {
        formattedRow[allColumIdWiseName[0][key]] = row[key];
      });
      return { id: index, ...formattedRow };
    });

  const [filteredRows, setFilteredRows] = useState(originalRows);
  const [filters, setFilters] = useState({});
  const uniqueCustomers = [
    "All",
    ...Array.from(new Set(originalRows?.map((row) => row?.item))),
  ];

  useEffect(() => {
    const newFilteredRows = originalRows?.filter((row) => {
      let isMatch = true;

      if (
        selectedDateColumnHyBrid === "Hybrid" &&
        parseInt(row.ishybridbill) !== 1
      ) {
        return false;
      }

      if (
        selectedDateColumn !== "ALL Users" &&
        parseInt(selectedDateColumn) !== row.salesrep_id
      ) {
        return false;
      }

      if (isMatch && selectedCustomer !== "All") {
        if (row.item !== selectedCustomer) {
          isMatch = false;
        }
      }

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
  }, [
    filters,
    commonSearch,
    fromDate,
    toDate,
    columns,
    originalRows,
    selectedColors,
    selectedDateColumn,
    selectedDateColumnHyBrid,
    selectedCustomer,
  ]);

  const handleFilterChange = (field, value, filterType) => {
    setFilters((prevFilters) => {
      if (filterType === "multiSelection") {
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
            <div style={{ margin: "10px", width: "100%" }} key={col.field}>
              <CustomTextField
                key={`filter-${col.field}-NormalFilter`}
                type="text"
                placeholder={`${col.field}`}
                value={filters[col.field] || ""}
                onChange={(e) => handleFilterChange(col.field, e.target.value)}
                className="filter_column_box"
              />
            </div>
          );
        default:
          return null;
      }
    });
  };

  const [highlightedIndex, setHighlightedIndex] = useState({});
  const [suggestionVisibility, setSuggestionVisibility] = useState({});
  const suggestionRefs = useRef({});
  useEffect(() => {
    function handleClickOutside(event) {
      for (const field in suggestionRefs.current) {
        if (
          suggestionRefs.current[field] &&
          !suggestionRefs.current[field].contains(event.target)
        ) {
          setSuggestionVisibility((prev) => ({
            ...prev,
            [field]: false,
          }));
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderFilterSuggestionFilter = (col) => {
    if (!col.filterTypes || col.filterTypes.length === 0) return null;

    const filtersToRender = col.filterTypes;

    return filtersToRender.map((filterType) => {
      if (filterType !== "suggestionFilter") return null;

      const field = col.field;
      const inputValue = filters[field]?.toLowerCase() || "";
      const suggestions =
        inputValue.length > 0
          ? [
            ...new Set(
              originalRows
                .map((row) => row[field])
                .filter(
                  (val) =>
                    val && val.toString().toLowerCase().includes(inputValue)
                )
            ),
          ]
          : [];

      const handleInputChange = (value) => {
        handleFilterChange(field, value.trimStart());
        setSuggestionVisibility((prev) => ({ ...prev, [field]: true }));
        setHighlightedIndex((prev) => ({ ...prev, [field]: 0 }));
      };

      const handleSelectSuggestion = (value) => {
        handleFilterChange(field, value);
        setSuggestionVisibility((prev) => ({ ...prev, [field]: false }));
        setHighlightedIndex((prev) => ({ ...prev, [field]: 0 }));
      };

      const handleKeyDown = (e) => {
        if (!suggestionVisibility[field] || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) => ({
            ...prev,
            [field]: Math.min((prev[field] ?? 0) + 1, suggestions.length - 1),
          }));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) => ({
            ...prev,
            [field]: Math.max((prev[field] ?? 0) - 1, 0),
          }));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const current = suggestions[highlightedIndex[field] ?? 0];
          if (current) handleSelectSuggestion(current);
        }
      };

      const refCallback = (node) => {
        if (node) {
          suggestionRefs.current[field] = node;
        }
      };

      return (
        <div
          key={`filter-${field}-suggestionFilter`}
          ref={refCallback}
          style={{ margin: "10px", position: "relative" }}
        >
          <CustomTextField
            fullWidth
            placeholder={field}
            value={filters[field] || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if ((filters[field] || "").trim().length > 0) {
                setSuggestionVisibility((prev) => ({ ...prev, [field]: true }));
              }
            }}
            onKeyDown={handleKeyDown}
            size="small"
            variant="filled"
            autoComplete="off"
          />

          {suggestionVisibility[field] && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                maxHeight: "300px",
                overflowY: "auto",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                zIndex: 10,
                borderRadius: "4px",
              }}
            >
              {suggestions.map((value, index) => (
                <div
                  key={`suggestion-${field}-${value}`}
                  onClick={() => handleSelectSuggestion(value)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    fontSize: "0.8125rem",
                    background:
                      index === highlightedIndex[field]
                        ? "#eee"
                        : "transparent",
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </div>
      );
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
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;
    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "multiSelection":
          const uniqueValues = [
            ...new Set(originalRows?.map((row) => row[col.field])),
          ];
          return (
            <div key={col.field} style={{ width: "100%", margin: "10px" }}>
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
                            "multiSelection"
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

        default:
          return null;
      }
    });
  };

  const handleOnChangeRange = (dates) => {
    const [start, end] = dates;
    setFromDate(start);
    setToDate(end);
  };

  const handleClose = () => setOpen(false);

  const [sideFilterOpen, setSideFilterOpen] = useState(false);
  const toggleDrawer = (newOpen) => () => {
    setSideFilterOpen(newOpen);
  };

  const itemSummaryMap = {
    METAL: "Total Metal Weight",
    DIAMOND: "Total Diamond",
    "COLOR STONE": "Total Color Stone",
    MISC: "Total Misc",
    FINDING: "Total Finding",
    "LAB GROWRN": "Total Lab Grown",
    MOUNT: "Total Mount",
    ALLOY: "Total Alloy",
  };

  const summaryColumns = Object.entries(itemSummaryMap).map(
    ([itemKey, summaryTitle]) => {
      const totalWeight = filteredRows
        ?.filter((row) => row.item?.toUpperCase() === itemKey)
        .reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0);

      return {
        summaryTitle,
        totalWeight,
      };
    }
  );

  const renderSummary = () => {
    return (
      <div className="summaryBox">
        {summaryColumns?.map((col) => (
          <div className="summaryItem" key={col.summaryTitle}>
            <div className="AllEmploe_boxViewTotal">
              <div>
                <p className="AllEmplo_boxViewTotalValue">
                  {col.totalWeight?.toFixed(3)}
                </p>
                <p className="boxViewTotalTitle">{col.summaryTitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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

  function mapRowsToHeaders(columns, rows) {
    const isIsoDateTime = (str) =>
      typeof str === "string" && /^\d{4}-\d{2}-\d{2}T/.test(str);
    const fieldToHeader = {};
    columns?.forEach((col) => {
      let header = "";
      if (typeof col.headerName === "string") {
        header = col.headerName;
      } else if (col.headerNamesingle) {
        header = col.headerNamesingle;
      } else if (
        col.headerName?.props?.children &&
        Array.isArray(col.headerName.props.children)
      ) {
        header = col.headerName.props.children[1];
      }
      fieldToHeader[col.field] = header;
    });
    return rows?.map((row, idx) => {
      const ordered = {};
      columns?.forEach((col) => {
        const header = fieldToHeader[col.field];
        let value = row[col.field] ?? "";
        if (header === "Sr#") {
          value = idx + 1;
        }
        if (col.field === "Venderfgage") {
          let finalDate = 0;
          const fgDateStr = row.fgdate;
          const outsourceDateStr = row.outsourcedate;
          if (fgDateStr && outsourceDateStr) {
            const diff =
              new Date(fgDateStr).getTime() -
              new Date(outsourceDateStr).getTime();
            finalDate = Math.floor(diff / (1000 * 60 * 60 * 24));
          }
          value = finalDate;
        } else if (col.field === "Fgage") {
          let finalDate = 0;
          const fgDateStr = row.fgdate;
          const orderDateStr = row.orderdate;
          if (fgDateStr && orderDateStr) {
            const diff =
              new Date(fgDateStr).getTime() - new Date(orderDateStr).getTime();
            finalDate = Math.floor(diff / (1000 * 60 * 60 * 24));
          }
          value = finalDate;
        }
        if (isIsoDateTime(value)) {
          const dateObj = new Date(value);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          value = `${day}-${month}-${year}`;
        }
        ordered[header] = value;
      });
      return ordered;
    });
  }
  const converted = mapRowsToHeaders(columns, filteredRows);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(converted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], { type: EXCEL_TYPE });

    const now = new Date();
    const dateString = now
      .toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/[/:]/g, "-")
      .replace(/, /g, "_"); // Format: dd-MM-yyyy_HH-mm-ss

    const fileName = `Report_Customer_Receive_${dateString}.xlsx`;

    saveAs(data, fileName);
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

  const handlePrint = () => { };

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

  const handleGrupEnChekBoxChange = (field) => {
    setGrupEnChekBox((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleClickOpenPoup = () => {
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const handleSave = () => {
    console.log("Saving data...");
    console.log("Selected Date:", selectedDate);
    console.log("Selected Rd3 Name:", selectedRd3Name);
  };

  const onDragEnd = () => { };

  const groupRows = (rows, groupCheckBox) => {
    const grouped = {};

    rows?.forEach((row) => {
      const newRow = { ...row };

      const deptChecked = groupCheckBox["dept"];
      const designationChecked = groupCheckBox["designation"];
      const empnameChecked = groupCheckBox["empname"];

      if (!deptChecked) newRow.dept = "-";
      if (!designationChecked) newRow.designation = "-";
      if (!empnameChecked) newRow.empname = "-";

      let keyParts = [];

      // 🔥 Always group by item at least
      if (deptChecked) keyParts.push(newRow.dept);
      if (designationChecked) keyParts.push(newRow.designation);
      if (empnameChecked) keyParts.push(newRow.empname);

      // 👉 Always push item into keyParts even if itemChecked is false
      keyParts.push(newRow.item);

      const groupKey = keyParts.join("|");

      if (!grouped[groupKey]) {
        grouped[groupKey] = { ...newRow };
      } else {
        grouped[groupKey].issqty += newRow.issqty || 0;
        grouped[groupKey].retqty += newRow.retqty || 0;
        grouped[groupKey].remqty += newRow.remqty || 0;
      }
    });

    return Object.values(grouped).map((item, index) => ({
      ...item,
      id: index,
      srNo: index + 1,
    }));
  };

  const handleClick = (params) => {
    let url_optigo = sessionStorage.getItem("url_optigo");
    window.parent.addTab(
      "Customer Receive",
      "icon-InventoryManagement_invoiceSummary",
      url_optigo +
      "mfg/app/InventoryManagement_invoiceList?invoiceof=customer&invoiceno=" +
      btoa(params?.formattedValue) +
      "&IsOldMetal=" +
      0
    );
  };

  const handleClickInvoiceImg = (params) => {
    let url_optigo = sessionStorage.getItem("url_optigo");
    window.parent.addTab(
      "Transaction Log",
      "icon-TransactionLog",
      url_optigo +
      "login/app/LoginManagement_LogHistory?mode=logsearch&sf=" +
      params?.formattedValue
      // +
      // "&-=" +
      // ""
    );
  };

  const handleRowClick = (params) => {
    const id = params.id;
    setSelectionModel(
      (prev) =>
        prev.includes(id)
          ? prev.filter((rowId) => rowId !== id) // unselect if already selected
          : [...prev, id] // add if not selected
    );
  };


  // const summaryStats = [
  //   {
  //     label: "Total Quantity",
  //     value: totalQty?.toLocaleString() ?? "—",
  //     icon: <RefreshCw size={18} color="#7367f0" />,
  //     iconBg: "rgba(115,103,240,0.12)",
  //   },
  //   {
  //     label: "Total Nwt",
  //     value: totalNwt?.toLocaleString(undefined, { minimumFractionDigits: 3 }) ?? "—",
  //     icon: <Gem size={18} color="#28c76f" />,
  //     iconBg: "rgba(40,199,111,0.12)",
  //   },
  //   {
  //     label: "Total Purewt",
  //     value: totalPurewt?.toLocaleString(undefined, { minimumFractionDigits: 3 }) ?? "—",
  //     icon: <Diamond size={18} color="#00cfe8" />,
  //     iconBg: "rgba(0,207,232,0.12)",
  //   },
  //   {
  //     label: "Total Dwt",
  //     value: totalDwt?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—",
  //     icon: <Pencil size={18} color="#ff9f43" />,
  //     iconBg: "rgba(255,159,67,0.12)",
  //   },
  //   {
  //     label: "Total Dpcs",
  //     value: totalDpcs?.toLocaleString() ?? "—",
  //     icon: <Infinity size={18} color="#ea5455" />,
  //     iconBg: "rgba(234,84,85,0.12)",
  //   },
  //   {
  //     label: "Total Swt",
  //     value: totalSwt?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—",
  //     icon: <Scissors size={18} color="#f38cab" />,
  //     iconBg: "rgba(243,140,171,0.12)",
  //   },
  //   {
  //     label: "Total Spc",
  //     value: totalSpc?.toLocaleString() ?? "—",
  //     icon: <PenLine size={18} color="#7367f0" />,
  //     iconBg: "rgba(115,103,240,0.12)",
  //   },
  // ];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="AdvanceWip_root">
        {isLoading && (
          <div className="AdvanceWip_loaderOverlay">
            <CircularProgress className="AdvanceWip_loader" />
          </div>
        )}

        {/* ── Column Settings Dialog ─────────────────────────── */}
        <Dialog open={openPopup} onClose={handleClosePopup}>
          <div className="AdvanceWip_colSettings">
            <p className="AdvanceWip_colSettingsTitle">Column Settings</p>
            <DragDropContext onDragEnd={onDragEnd}>
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
            </DragDropContext>
            <Button>Save</Button>
          </div>
        </Dialog>

        {/* ── Side Filter Drawer ─────────────────────────────── */}
        <Drawer open={sideFilterOpen} onClose={toggleDrawer(false)} className="AdvanceWip_drawer">
          <div className="AdvanceWip_drawerHeader">
            <button onClick={handleClearFilter} className="AdvanceWip_clearBtn">
              <MdOutlineFilterAltOff style={{ fontSize: "20px" }} />
              Clear
            </button>
            <CircleX
              style={{ cursor: "pointer", height: "28px", width: "28px" }}
              onClick={() => setSideFilterOpen(false)}
            />
          </div>
          {columns.filter((col) => col.filterable).map((col) => (
            <div key={col.field} style={{ display: "flex", gap: "10px" }}>{renderFilterMulti(col)}</div>
          ))}
          {columns.filter((col) => col.filterable).map((col) => (
            <div key={col.field}>{renderFilterRange(col)}</div>
          ))}
          {columns.filter((col) => col.filterable).map((col) => (
            <div key={col.field} style={{ display: "flex", gap: "10px" }}>{renderFilterDropDown(col)}</div>
          ))}
          {columns.filter((col) => col.filterable).map((col) => (
            <div key={col.field}>{renderFilterSuggestionFilter(col)}</div>
          ))}
          {columns.filter((col) => col.filterable).map((col) => (
            <div key={col.field} style={{ display: "flex", gap: "10px" }}>{renderFilter(col)}</div>
          ))}
        </Drawer>

        {/* ── Top Bar ────────────────────────────────────────── */}
        <div className="AdvanceWip_topBar">
          {/* Left: Date Range + Apply + Search */}
          <div className="AdvanceWip_topBarLeft">
            <div className="AdvanceWip_dateRangeWrap">
              <CalendarDays size={16} className="AdvanceWip_calIcon" />
              <span className="AdvanceWip_dateLabel">Date Range</span>
              <DualDatePicker
                filterState={filterState}
                setFilterState={setFilterState}
                validDay={186}
                validMonth={6}
              />
            </div>

            <button
              className="AdvanceWip_applyBtn"
              onClick={() =>
                setFilterState({
                  ...filterState,
                  dateRange: {
                    startDate: new Date("2000-01-01T18:30:00.000Z"),
                    endDate: new Date(),
                  },
                })
              }
            >
              Apply
            </button>

            <div className="AdvanceWip_searchWrap">
              <Search size={16} className="AdvanceWip_searchIcon" />
              <input
                className="AdvanceWip_searchInput"
                type="text"
                placeholder="Search..."
                value={commonSearch}
                onChange={(e) => setCommonSearch(e.target.value)}
              />
              {commonSearch && (
                <CircleX
                  size={16}
                  className="AdvanceWip_searchClear"
                  onClick={() => setCommonSearch("")}
                />
              )}
            </div>

            {/* Date column filters (rendered inline) */}
            {columns.filter((col) => col.filterable).map((col) => (
              <div key={col.field}>{renderDateFilter(col)}</div>
            ))}
          </div>

          {/* Right: Excel Export */}
          <div className="AdvanceWip_topBarRight">
            {masterKeyData?.ExcelExport && (
              <button className="AdvanceWip_exportBtn" onClick={exportToExcel}>
                <FileSpreadsheet size={16} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* ── 2×2 Grid of DataGrid Cards ─────────────────────── */}
        <div ref={gridRef} className="AdvanceWip_gridArea" ref={gridContainerRef}>
          <div className="AdvanceWip_cardGrid">
            {GRID_CONFIGS.map((config, i) => (
              <div key={i} className="AdvanceWip_card">
                <div className="AdvanceWip_cardHeader">
                  <LayoutGrid size={16} className="AdvanceWip_cardHeaderIcon" />
                  <span className="AdvanceWip_cardTitle">{config.label}</span>
                </div>

                {/* DataGrid */}
                <Warper>
                  <DataGrid
                    rows={gridRows[i] ?? []}
                    columns={gridColumns[i] ?? []}
                    autoHeight={false}
                    rowHeight={36}
                    headerHeight={38}
                    columnBuffer={17}
                    localeText={{ noRowsLabel: "No Data" }}
                    initialState={{
                      columns: {
                        columnVisibilityModel: { status: false, traderName: false },
                      },
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    sortModel={sortModel}
                    onSortModelChange={(model) => setSortModel(model)}
                    sortingOrder={["asc", "desc"]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20, 50, 100]}
                    className="AdvanceWip_dataGrid"
                    pagination
                    selectionModel={selectionModel}
                    onRowClick={handleRowClick}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                      selectionModel.includes(params.id) ? "Mui-selected" : ""
                    }
                    sx={{
                      border: "none",
                      fontFamily: "'Public Sans', 'Poppins', sans-serif",
                      "& .MuiDataGrid-columnHeader": {
                        backgroundColor: "#f8f7fa",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#555",
                      },
                      "& .MuiDataGrid-cell": {
                        fontSize: "12.5px",
                        borderRight: "1px solid #f0f0f0",
                        borderBottom: "1px solid #f0f0f0",
                      },
                      "& .MuiDataGrid-cell:focus": {
                        outline: "none !important",
                      },
                      "& .MuiDataGrid-menuIcon": { display: "none" },
                      "& .MuiDataGrid-iconButtonContainer": { display: "none" },
                      "& .MuiTablePagination-selectLabel": { margin: 0, padding: 0 },
                      "& .MuiTablePagination-displayedRows": { margin: 0, padding: 0 },
                      "& .MuiTablePagination-actions .MuiButtonBase-root": { padding: 0, margin: 0 },
                      "& .MuiDataGrid-footerContainer": { minHeight: "30px" },
                      "& .MuiTablePagination-toolbar": { minHeight: "30px", fontSize: "12px" },
                      "& .Mui-selected": { backgroundColor: "rgba(115,103,240,0.08) !important" },
                      "& .Mui-selected:hover": { backgroundColor: "rgba(115,103,240,0.14) !important" },
                    }}
                  />
                </Warper>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Summary Strip ───────────────────────────── */}
        {/* <div className="AdvanceWip_summaryBar">
          {summaryStats.map((stat, i) => (
            <div key={i} className="AdvanceWip_summaryChip">
              <div className="AdvanceWip_summaryIconWrap" style={{ background: stat.iconBg }}>
                {stat.icon}
              </div>
              <div className="AdvanceWip_summaryText">
                <span className="AdvanceWip_summaryLabel">{stat.label}</span>
                <span className="AdvanceWip_summaryValue">{stat.value}</span>
              </div>
            </div>
          ))}
        </div> */}

        {/* ── 500 Error State ────────────────────────────────── */}
        {status500 && (
          <div className="AdvanceWip_errorWrap">
            <Box minHeight="70vh" display="flex" alignItems="center" justifyContent="center" p={2}>
              <Paper elevation={3} sx={{ maxWidth: 500, width: "100%", p: 4, borderRadius: "20px", textAlign: "center" }}>
                <Box display="flex" justifyContent="center" mb={2}>
                  <AlertTriangle size={48} color="#f44336" />
                </Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>Something Went Wrong</Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                  We're sorry, but an unexpected error has occurred. Please try again later.
                </Typography>
              </Paper>
            </Box>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}


const FilterIcons = ({ FontSize = 35 }) => {
  return <>
    <svg xmlns="http://www.w3.org/2000/svg" width={FontSize} height={FontSize} viewBox="0 0 24 24"><g fill="none" stroke="#6f53ff" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-3m10 3v-6m0-9V3M7 9V3"></path><path d="M7 18c-.932 0-1.398 0-1.765-.152a2 2 0 0 1-1.083-1.083C4 16.398 4 15.932 4 15s0-1.398.152-1.765a2 2 0 0 1 1.083-1.083C5.602 12 6.068 12 7 12s1.398 0 1.765.152a2 2 0 0 1 1.083 1.083C10 13.602 10 14.068 10 15s0 1.398-.152 1.765a2 2 0 0 1-1.083 1.083C8.398 18 7.932 18 7 18Zm10-6c-.932 0-1.398 0-1.765-.152a2 2 0 0 1-1.083-1.083C14 10.398 14 9.932 14 9s0-1.398.152-1.765a2 2 0 0 1 1.083-1.083C15.602 6 16.068 6 17 6s1.398 0 1.765.152a2 2 0 0 1 1.083 1.083C20 7.602 20 8.068 20 9s0 1.398-.152 1.765a2 2 0 0 1-1.083 1.083C18.398 12 17.932 12 17 12Z"></path></g></svg>
  </>
}