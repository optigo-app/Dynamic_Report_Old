// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18304

import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import "./MaterialPurhcaseReturnReport.scss";
import OtherKeyData from "./MaterialPurhcaseReturnReport.json";
import DatePicker from "react-datepicker";
// import masterData from "./masterData.json";
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
  TextField,
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
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CircleX } from "lucide-react";
import { IoMdClose } from "react-icons/io";
import Warper from "../WorkerReportSpliterView/AllEmployeeDataReport/warper";
import {
  GridPagination,
  useGridApiContext,
  useGridSelector,
  gridPageSelector,
  gridPageCountSelector,
} from "@mui/x-data-grid";
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from "@mui/icons-material";
import { FaRegFileExcel } from "react-icons/fa";

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

function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = apiRef.current.getRowsCount();
  const pageSize = apiRef.current.state.pagination.paginationModel.pageSize;
  const [inputPage, setInputPage] = React.useState(page + 1);

  React.useEffect(() => {
    setInputPage(page + 1);
  }, [page]);

  const handleInputChange = (e) => {
    setInputPage(e.target.value);
  };

  const handleInputBlur = () => {
    let newPage = Number(inputPage);

    if (isNaN(newPage) || newPage < 1) {
      newPage = 1;
    } else if (newPage > pageCount) {
      newPage = pageCount;
    }

    apiRef.current.setPage(newPage - 1);
    setInputPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    apiRef.current.setPageSize(Number(e.target.value));
  };

  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, rowCount);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        width: "100%",
        padding: "0 8px",
        gap: 16,
      }}
    >
      {/* ✅ Page navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>Rows per page:</span>
        <TextField
          select
          size="small"
          value={pageSize}
          onChange={handlePageSizeChange}
          SelectProps={{
            native: true,
          }}
          style={{ width: 60 }}
          sx={{
            "& .MuiNativeSelect-select": {
              padding: "2px 5px!important",
              fontSize: "14px !important",
            },
          }}
        >
          {[20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </TextField>

        <IconButton
          size="small"
          onClick={() => apiRef.current.setPage(0)}
          disabled={page === 0}
        >
          <FirstPage fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => apiRef.current.setPage(page - 1)}
          disabled={page === 0}
        >
          <KeyboardArrowLeft fontSize="small" />
        </IconButton>

        <p>Page</p>
        <TextField
          value={inputPage}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInputBlur();
            }
          }}
          size="small"
          variant="outlined"
          style={{ width: 60 }}
          inputProps={{ style: { textAlign: "center", padding: "2px 4px" } }}
        />
        <span style={{ fontSize: 14 }}>of {pageCount}</span>

        <IconButton
          size="small"
          onClick={() => apiRef.current.setPage(page + 1)}
          disabled={page >= pageCount - 1}
        >
          <KeyboardArrowRight fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => apiRef.current.setPage(pageCount - 1)}
          disabled={page >= pageCount - 1}
        >
          <LastPage fontSize="small" />
        </IconButton>

        <span style={{ fontSize: 14 }}>
          Displaying {rowCount === 0 ? 0 : startItem} to {endItem} of {rowCount}
        </span>
      </div>
    </div>
  );
}

export default function MaterialPurhcaseReturnReport() {
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
  const [selectedDateColumn, setSelectedDateColumn] = useState("INR");
  const [selectedDateColumnHyBrid, setSelectedDateColumnHyBrid] =
    useState("ALL");
  const [selectedMetal, setSelectedMetal] = useState("Select Material");

  const [currencyAdjustedRows, setCurrencyAdjustedRows] = useState([]);
  const [grupEnChekBox, setGrupEnChekBox] = useState({
    designation: true,
    dept: true,
    empname: true,
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [showAllData, setShowAllData] = useState(false);
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });

  const firstTimeLoadedRef = useRef(false);

  useEffect(() => {
    const now = new Date();
    const formattedDate = formatToMMDDYYYY(now);
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    fetchData(formattedDate, formattedDate);
    getMasterData();
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
      getMasterData();
    }
  }, [filterState.dateRange]);

  const getMasterData = async () => {
    const sp = searchParams.get("sp");
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const body = {
      con: `{"id":"","mode":"materialpurchasereturnreport_master","appuserid":"${AllData?.uid}"}`,
      p: "",
      f: "Task Management (taskmaster)",
    };
    try {
      const fetchedData = await GetWorkerData(body, sp);
      setAllUserNameList(fetchedData?.Data?.rd);
    } catch (error) {
      if (error?.status == 500) {
        setStatus500(true);
      }
      setIsLoading(false);
    }
  };

  const fetchData = async (stat, end) => {
    const sp = searchParams.get("sp");
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));

    setIsLoading(true);
    const body = {
      con: `{"id":"","mode":"materialpurchasereturnreport","appuserid":"${AllData?.uid}"}`,
      p: `{"fdate":"${stat}","tdate":"${end}"}`,
      f: "Task Management (taskmaster)",
    };

    try {
      const fetchedData = await GetWorkerData(body, sp);
      if (showAllData) {
        setFilterState({
          ...filterState,
          dateRange: {
            startDate: null,
            endDate: null,
          },
        });
        setShowAllData(false);
      }
      setAllRowData(fetchedData?.Data?.rd1);
      setAllColumIdWiseName(fetchedData?.Data?.rd);
      setMasterKeyData(OtherKeyData?.rd);
      setAllColumData(OtherKeyData?.rd1);
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
          headerNameSub: col?.headerName,
          width: col.Width,
          // minWidth: col.Width,
          flex: col.flex,
          align: col.ColumAlign || "left",
          headerAlign: col.Align,
          filterable: col.ColumFilter,
          suggestionFilter: col.suggestionFilter,
          hrefLink: col.HrefLink,
          summuryValueKey: col.summuryValueKey,
          summaryTitle: col.summaryTitle,
          ToFixedValue: col.ToFixedValue,
          sortable: col.sortable,
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
            } else if (params?.field === "usermanagement_customercode1") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "0px",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p className="osr_mainName">
                    <b>{params.value}</b>
                  </p>
                  <p className="osr_subname">
                    {params?.row?.usermanagement_customercode}
                  </p>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
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
      width: 60,
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
    "Select Material",
    ...Array.from(new Set(originalRows?.map((row) => row?.itemname))),
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

      // if (
      //   selectedDateColumn !== "ALL Users" &&
      //   parseInt(selectedDateColumn) !== row.usermanagement_customer_salesrep_id
      // ) {
      //   return false;
      // }

      if (isMatch && selectedMetal !== "Select Material") {
        if (row.itemname !== selectedMetal) {
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

    const selectedCurrency = allUserNameList?.find(
      (c) => c.Currencycode === selectedDateColumn
    );

    const rate = selectedCurrency?.CurrencyRate || 1;
    const safeRows = Array.isArray(rowsWithSrNo) ? rowsWithSrNo : [];

    const currencyUpdatedRows = safeRows.map((row) => ({
      ...row,
      averagerate: row.averagerate
        ? parseFloat((row.averagerate / rate).toFixed(2))
        : row.averagerate,
      amount: row.amount
        ? parseFloat((row.amount / rate).toFixed(2))
        : row.amount,
    }));

    const sorted = [...currencyUpdatedRows].sort((a, b) => {
      return new Date(b.entrydate) - new Date(a.entrydate);
    });

    setCurrencyAdjustedRows(sorted);
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
    selectedMetal,
    allUserNameList,
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
                placeholder={`${col.headerNameSub}`}
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
            placeholder={col?.headerNameSub}
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

  const renderSummary = () => {
    const summaryConfig = {
      "SELECT MATERIAL": ["averageRate", "totalAmount"],

      METAL: ["totalWeightPure", "averageRate", "totalAmount"],

      DIAMOND: ["totalWeight", "averageRate", "totalAmount"],

      "LAB GROWN": ["totalWeight", "averageRate", "totalAmount"],

      "COLOR STONE": ["totalWeight", "averageRate", "totalAmount"],

      MOUNT: ["totalWeightPure", "averageRate", "totalAmount"],

      FINDING: ["totalWeightPure", "averageRate", "totalAmount"],

      ALLOY: ["totalWeightPure", "averageRate", "totalAmount"],

      MISC: ["totalWeight", "averageRate", "totalAmount"],
    };

    const formatIndianNumber = (value, decimals = 2) => {
      return value?.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    const calcTotalAmount = () =>
      filteredRows?.reduce(
        (sum, row) => sum + (parseFloat(row.amount) || 0),
        0
      );

    const calcTotalWeight = () =>
      filteredRows?.reduce(
        (sum, row) => sum + (parseFloat(row.weight) || 0),
        0
      );

    const calcTotalWeightPure = () =>
      filteredRows?.reduce(
        (sum, row) => sum + (parseFloat(row.purewt) || 0),
        0
      );

    const calcAverageRate = () => {
      const amount = calcTotalAmount();
      const weight = calcTotalWeight();
      return weight > 0 ? amount / weight : 0;
    };

    const calcLabourAmount = () =>
      filteredRows?.reduce(
        (sum, row) => sum + (parseFloat(row.labouramount) || 0),
        0
      );

    const calcMaterialAmount = () => calcTotalAmount() - calcLabourAmount();

    const summaryCalcMap = {
      totalWeight: { label: "Total Weight", fn: calcTotalWeight, decimals: 3 },
      totalWeightPure: {
        label: "Total Weight (Pure)",
        fn: calcTotalWeightPure,
        decimals: 3,
      },
      averageRate: { label: "Average Rate", fn: calcAverageRate, decimals: 2 },
      labourAmount: { label: "L.Amount", fn: calcLabourAmount, decimals: 2 },
      materialAmount: {
        label: "M.Amount",
        fn: calcMaterialAmount,
        decimals: 2,
      },
      totalAmount: { label: "Total Amount", fn: calcTotalAmount, decimals: 2 },
    };
    const itemsToShow = summaryConfig[selectedMetal?.toUpperCase()] || [];
    const weightUnit = ["DIAMOND", "LAB GROWN", "COLOR STONE"].includes(
      selectedMetal?.toUpperCase()
    )
      ? " Ctw"
      : " Gm";

    return (
      <div className="summaryBox">
        {itemsToShow.map((key) => {
          const { label, fn, decimals } = summaryCalcMap[key];
          const value = fn();

          let displayValue;
          if (key === "totalWeight" || key === "totalWeightPure") {
            displayValue = `${value?.toFixed(decimals)}${weightUnit}`;
          } else {
            displayValue = formatIndianNumber(value, decimals);
          }

          return (
            <div className="summaryItem" key={key}>
              <div className="AllEmploe_boxViewTotal">
                <div>
                  <p className="AllEmplo_boxViewTotalValue">{displayValue}</p>
                  <p className="boxViewTotalTitle">{label}</p>
                </div>
              </div>
            </div>
          );
        })}
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
      .replace(/, /g, "_");

    const fileName = `MaterialPurhcase_Return_Report_${dateString}.xlsx`;
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

  const onDragEnd = () => {};

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

  // function openInvoiceList(invoiceno) {
  //           if ($.trim(_hdn_invoiceof) == 'supplier') {
  //               parent.CloseTab('Material Purchase');
  //               parent.CloseTab('Customer Receive');
  //               parent.addTab('Material Purchase', 'icon-InventoryManagement_invoiceSummary', ADPT + 'mfg/app/InventoryManagement_invoiceList?invoiceof=supplier&invoiceno=' + invoiceno + '&IsOldMetal=' + IsOldMetal)
  //           }
  //           else {
  //               parent.CloseTab('Material Purchase');
  //               parent.CloseTab('Customer Receive');
  //               parent.addTab('Customer Receive', 'icon-InventoryManagement_invoiceSummary', ADPT + 'mfg/app/InventoryManagement_invoiceList?invoiceof=customer&invoiceno=' + invoiceno + '&IsOldMetal=' + IsOldMetal)
  //           }
  //       }
  // window.parent.addTab(
  //   "Job Completion Report",
  //   "tabs-icon icon-report",
  //   "http://nzen/R50B3/mfg/app/InventoryManagement_invoiceList?invoiceof=customer&invoiceno=Q1IvMTI3LzIwMjU=-AdQ2EGwrOJI=&IsOldMetal=0&ifid=CustomerReceive&pid=undefined"
  // );

  const handleClick = (params) => {
    let url_optigo = sessionStorage.getItem("url_optigo");
    window?.parent.addTab(
      "Material Purchase Return",
      "icon-MaterialManagement_MaterialPurchase_Return",
      url_optigo +
        "salescrm/app/MaterialManagement_MaterialPurchase_Return?invoiceno=" +
        btoa(params?.formattedValue)
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
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="MaterialPurhcaseReturnReportMain_mainGridView"
        sx={{ width: "100vw", display: "flex", flexDirection: "column" }}
        ref={gridContainerRef}
      >
        {isLoading && (
          <div className="loader-overlay">
            <CircularProgress className="loadingBarManage" />
          </div>
        )}

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
        <Drawer
          open={sideFilterOpen}
          onClose={toggleDrawer(false)}
          className="drawerMain"
        >
          <div
            style={{
              margin: "20px 10px 0px 10px",
              fontSize: "25px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button onClick={handleClearFilter} className="ClearFilterButton">
              <MdOutlineFilterAltOff style={{ fontSize: "25px" }} />
              Clear
            </button>

            <CircleX
              style={{
                cursor: "pointer",
                height: "30px",
                width: "30px",
              }}
              onClick={() => setSideFilterOpen(false)}
            />
          </div>

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                {renderFilterMulti(col)}
              </div>
            ))}

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
              <div key={col.field} style={{ gap: "10px" }}>
                {renderFilterSuggestionFilter(col)}
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
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 5px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={toggleDrawer(true)} className="FiletrBtnOpen">
                <MdOutlineFilterAlt style={{ height: "30px", width: "30px" }} />
              </button>

              <div style={{ display: "flex", gap: "5px" }}>
                <DualDatePicker
                  filterState={filterState}
                  setFilterState={setFilterState}
                  validDay={186}
                  validMonth={6}
                />
                <Button
                  onClick={() => {
                    setFilterState({
                      ...filterState,
                      dateRange: {
                        startDate: new Date("2000-01-01T18:30:00.000Z"),
                        endDate: new Date(),
                      },
                    });
                    setShowAllData(true);
                    setShowAllData(true);
                    setFromDate(null);
                    setToDate(null);
                    setCommonSearch("");
                    setFilters({});
                    setSelectedMetal("Select Material");
                    setSelectedDateColumn("INR");
                  }}
                  className="FiletrBtnAll"
                >
                  All
                </Button>
              </div>

              <FormControl size="small" sx={{ minWidth: 150, margin: "0px" }}>
                <Select
                  value={selectedMetal}
                  onChange={(e) => setSelectedMetal(e.target.value)}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflowY: "auto",
                      },
                    },
                  }}
                  style={{
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  sx={{
                    "& .MuiSelect-select": {
                      padding: "7px !important",
                    },
                  }}
                >
                  {uniqueCustomers?.map((cust, index) => (
                    <MenuItem
                      key={index}
                      value={cust}
                      style={{
                        fontSize: "14px",
                      }}
                    >
                      {cust}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: 150, margin: "0px" }}>
                <Select
                  value={selectedDateColumn}
                  onChange={(e) => setSelectedDateColumn(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflowY: "auto",
                      },
                    },
                  }}
                  style={{
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  sx={{
                    "& .MuiSelect-select": {
                      padding: "7px !important",
                    },
                  }}
                >
                  {allUserNameList?.map((col) => (
                    <MenuItem
                      style={{
                        fontSize: "14px",
                      }}
                      key={col?.id}
                      value={col?.Currencycode}
                    >
                      {col?.Currencycode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {columns
              .filter((col) => col.filterable)
              .map((col) => (
                <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                  {renderDateFilter(col)}
                </div>
              ))}
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

            {masterKeyData?.fullScreenGridButton && (
              <button className="fullScreenButton" onClick={toggleFullScreen}>
                <RiFullscreenLine
                  style={{ marginInline: "5px", fontSize: "30px" }}
                />
              </button>
            )}

            <CustomTextField
              type="text"
              placeholder="Search..."
              value={commonSearch}
              onChange={(e) => setCommonSearch(e.target.value)}
              customBorderColor="rgba(47, 43, 61, 0.2)"
              InputProps={{
                endAdornment: commonSearch && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setCommonSearch("")}
                      aria-label="clear"
                    >
                      <CircleX size={20} color="#888" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              style={{
                width: "200px",
              }}
              sx={{
                "& .MuiInputBase-input": {
                  padding: "4.5px !important",
                },
              }}
            />

            {masterKeyData?.ExcelExport && (
              <button onClick={exportToExcel} className="All_exportButton">
                <FaRegFileExcel
                  style={{
                    marginRight: "5px",
                    fontSize: "20px",
                    color: "green",
                  }}
                />
                Excel
              </button>
            )}
          </div>
        </div>
        <div
          ref={gridRef}
          style={{ height: "calc(100vh - 170px)", margin: "5px" }}
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
            <Warper>
              <DataGrid
                rows={currencyAdjustedRows ?? []}
                columns={columns ?? []}
                autoHeight={false}
                rowHeight={40}
                headerHeight={40}
                columnBuffer={17}
                localeText={{ noRowsLabel: "No Data" }}
                initialState={{
                  columns: {
                    columnVisibilityModel: {
                      status: false,
                      traderName: false,
                    },
                  },
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                      page: 0,
                    },
                  },
                }}
                slots={{
                  pagination: CustomPagination, // ✅ custom pagination
                }}
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
                sortingOrder={["asc", "desc"]} // For Sorting.....
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[20, 30, 50, 100]}
                className="simpleGridView"
                pagination
                sx={{
                  "& .MuiDataGrid-menuIcon": {
                    display: "none",
                  },

                  "& .MuiDataGrid-selectedRowCount": {
                    display: "none",
                  },

                  "& .MuiTablePagination-selectLabel": {
                    margin: "0px",
                    padding: "0px",
                  },

                  "& .MuiTablePagination-displayedRows": {
                    margin: "0px",
                    padding: "0px",
                  },

                  "& .MuiTablePagination-actions .MuiButtonBase-root": {
                    padding: "0px",
                    margin: "0px",
                  },

                  "& .MuiDataGrid-footerContainer": {
                    minHeight: "30px",
                  },

                  "& .MuiTablePagination-toolbar": {
                    minHeight: "30px",
                  },
                  marginLeft: 2,
                  marginRight: 2,
                  marginBottom: 2,
                }}
              />
            </Warper>
          )}
        </div>

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
      </div>
    </DragDropContext>
  );
}
