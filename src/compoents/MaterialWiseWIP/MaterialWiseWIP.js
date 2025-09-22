// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18296

import React, { useState, useEffect, useRef, useMemo } from "react";
import "./MaterialWiseWIP.scss";
import OtherKeyData from "./MaterialWiseWIP.json";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import DatePicker from "react-datepicker";
// import masterData from "./masterData.json";
import "react-datepicker/dist/react-datepicker.css";
import mainButton from "../images/Mail_32.png";
import printButton from "../images/print.png";
import gridView from "../images/GriedView.png";
import imageView from "../images/ImageView2.png";
import { RiFullscreenLine } from "react-icons/ri";
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
import { MdExpandMore, MdOpenInFull } from "react-icons/md";
import CustomTextField from "../text-field/index";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AiFillSetting } from "react-icons/ai";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ImageUp, LayoutGrid } from "lucide-react";
import { IoMdClose } from "react-icons/io";
import noFoundImg from "../images/noFound.jpg";
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

export default function MaterialWiseWIP() {
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
  const [status500, setStatus500] = useState(false);
  const [commonSearch, setCommonSearch] = useState("");
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });
  const [sortModel, setSortModel] = useState([]);
  const [grupEnChekBox, setGrupEnChekBox] = useState({});
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 20,
  });

  const firstTimeLoadedRef = useRef(false);

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
    }, 0); // lets React finish updating state first
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
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = searchParams.get("sp");
    setIsLoading(true);

    const body = {
      con: `{"id":"","mode":"materialwisewipreport","appuserid":"${AllData?.uid}"}`,
      p: "{}",
      f: "Task Management (taskmaster)",
    };

    const bodyMasterApi = {
      con: `{"id":"","mode":"materialwisewipreport_master","appuserid":"${AllData?.uid}"}`,
      p: "{}",
      f: "Task Management (taskmaster)",
    };

    try {
      const bodyMaster = await GetWorkerData(bodyMasterApi, sp);
      const fetchedData = await GetWorkerData(body, sp);

      const bodyMasterData = bodyMaster?.Data?.rd || [];
      const fetchedRowData = fetchedData?.Data?.rd1 || [];
      const fetchedColDefs = fetchedData?.Data?.rd;

      // Create a lookup for quick access by serialjobno
      const masterMap = bodyMasterData?.reduce((acc, curr) => {
        acc[curr.serialjobno] = {
          companyName: curr.companyName,
          customercode: curr.customercode,
        };
        return acc;
      }, {});

      const enrichedRowData = fetchedRowData.map((row) => {
        const jobNo = row["1"];
        if (masterMap[jobNo]) {
          return {
            ...row,
            14: masterMap[jobNo].companyName,
            15: masterMap[jobNo].customercode,
          };
        }
        return row;
      });

      setAllRowData(enrichedRowData); // Final updated data
      setAllColumIdWiseName(fetchedColDefs);

      setMasterKeyData(OtherKeyData?.rd);
      setAllColumData(OtherKeyData?.rd1);

      const grupCheckboxMap = (OtherKeyData?.rd1 || [])
        .filter((col) => col?.GrupChekBox)
        .reduce((acc, col) => {
          acc[col.field] = !!col.defaultGrupChekBox;
          return acc;
        }, {});

      setGrupEnChekBox(grupCheckboxMap);
      setStatus500(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Fetch failed", error);
      setStatus500(true);
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

  const handleGrupEnChekBoxChange = (field) => {
    setGrupEnChekBox((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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
                  checked={grupEnChekBox[col.field] ?? true}
                  onChange={() => handleGrupEnChekBoxChange(col.field)}
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
          headerNamesingle: col.headerName,
          suggestionFilter: col.suggestionFilter,
          hrefLink: col.HrefLink,
          summuryValueKey: col.summuryValueKey,
          summaryTitle: col.summaryTitle,
          ToFixedValue: col.ToFixedValue,
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
                <p
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.backgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "5px",
                    borderRadius: col.BorderRadius,
                    margin: "0px",
                  }}
                >
                  {params.value?.toFixed(col.ToFixedValue)}
                </p>
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
                    color: col.Color || "inherit",
                    backgroundColor: col.backgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "5px",
                    borderRadius: col.BorderRadius,
                    margin: "0px",
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
                    backgroundColor: col.backgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "5px",
                    borderRadius: col.BorderRadius,
                    margin: "0px",
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

    setColumns([srColumn, ...columnData]);
  }, [allColumData, grupEnChekBox, sortModel, paginationModel]);

  useEffect(() => {
    if (!allColumData) return;
    const defaultChecked = {};
    Object.values(allColumData).forEach((col) => {
      if (col.GrupChekBox) {
        defaultChecked[col.field] = true;
      }
    });

    setCheckedColumns(defaultChecked);
  }, [allColumData]);

  const handleCellClick = (params) => {
    setSelectedDepartmentId(params?.row?.deptid);
    setSelectedEmployeeCode(params?.row?.employeecode);
    setOpen(true);
  };

  const columnMap =
    Array.isArray(allColumIdWiseName) && allColumIdWiseName?.length > 0
      ? allColumIdWiseName[0]
      : {};
  columnMap["49"] = "imageViewkey";
  const updatedRowData =
    allRowData &&
    allRowData?.map((row) => ({
      ...row,
    }));

  const originalRows =
    updatedRowData &&
    updatedRowData.map((row, index) => {
      const formattedRow = {};
      Object.keys(row).forEach((key) => {
        const columnName = columnMap[key] || `unknown_${key}`;
        formattedRow[columnName] = row[key];
      });
      return { id: index, ...formattedRow };
    });

  const [pageSize, setPageSize] = useState(10);
  const [filteredRows, setFilteredRows] = useState(originalRows);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const newFilteredRows = originalRows?.filter((row) => {
      let isMatch = true;

      for (const filterField of Object.keys(filters)) {
        const filterValue = filters[filterField];
        if (!filterValue || filterValue.length === 0) continue;

        const rawRowValue = row[filterField];

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
          if (!filterValue.includes(rawRowValue)) {
            isMatch = false;
            break;
          }
        } else {
          const rowValue = rawRowValue?.toString().toLowerCase() || "";
          const filterValueLower = filterValue.toLowerCase();
          if (rowValue !== filterValueLower) {
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

    const groupedRows = groupRows(rowsWithSrNo, grupEnChekBox);
    setFilteredRows(groupedRows);
  }, [
    filters,
    commonSearch,
    fromDate,
    toDate,
    columns,
    originalRows,
    selectedColors,
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
            <div style={{ width: "100%", margin: "10px" }}>
              <CustomTextField
                key={`filter-${col.field}-NormalFilter`}
                type="text"
                placeholder={`${col.headerNamesingle}`}
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

      const inputValue = filters[col.field]?.toLowerCase() || "";
      const filteredSuggestions =
        inputValue.length > 0
          ? [
              ...new Set(
                originalRows
                  .map((row) => row[col.field])
                  .filter(
                    (val) =>
                      val && val.toString().toLowerCase().includes(inputValue)
                  )
              ),
            ]
          : [];

      const handleInputChange = (value) => {
        handleFilterChange(col.field, value.trimStart());
        setSuggestionVisibility((prev) => ({
          ...prev,
          [col.field]: true,
        }));
      };

      const handleSelectSuggestion = (value) => {
        handleFilterChange(col.field, value);
        setSuggestionVisibility((prev) => ({
          ...prev,
          [col.field]: false,
        }));
      };

      const refCallback = (node) => {
        if (node) {
          suggestionRefs.current[col.field] = node;
        }
      };

      return (
        <div
          key={`filter-${col.field}-suggestionFilter`}
          ref={refCallback}
          style={{ margin: "10px", position: "relative" }}
        >
          <CustomTextField
            fullWidth
            placeholder={col.field}
            value={filters[col.field] || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if ((filters[col.field] || "").trim().length > 0) {
                setSuggestionVisibility((prev) => ({
                  ...prev,
                  [col.field]: true,
                }));
              }
            }}
            customBorderColor="rgba(47, 43, 61, 0.2)"
            borderoutlinedColor="#00CFE8"
            customTextColor="#2F2B3DC7"
            customFontSize="0.8125rem"
            size="small"
            variant="filled"
            autoComplete="off"
          />

          {suggestionVisibility[col.field] &&
            filteredSuggestions.length > 0 && (
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
                {filteredSuggestions.map((value) => (
                  <div
                    key={`suggestion-${col.field}-${value}`}
                    onClick={() => handleSelectSuggestion(value)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                      fontSize: "0.8125rem",
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
            ...new Set(originalRows.map((row) => row[col.field])),
          ];

          return (
            <div key={col.field} style={{ width: "100%" }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<MdExpandMore />}
                  id={`${col.field}-header`}
                  sx={{
                    "& .MuiButtonBase-root": {
                      display: "none",
                    },
                  }}
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

  const getSummaryData = () => {
    let summary = {
      diamond: { weight: 0, pcs: 0 },
      cs: { weight: 0, pcs: 0 },
      misc: { weight: 0, pcs: 0 },
      finding: { weight: 0, pcs: 0 },
      total: { weight: 0, pcs: 0, amount: 0 },
    };

    filteredRows?.forEach((row) => {
      const wt = parseFloat(row.weight || 0);
      const pcs = parseInt(row.pcs || 0);
      const amt = parseFloat(row.amount || 0);
      const name = row.itemname?.toUpperCase();

      if (name === "DIAMOND") {
        summary.diamond.weight += wt;
        summary.diamond.pcs += pcs;
      } else if (name === "COLOR STONE") {
        summary.cs.weight += wt;
        summary.cs.pcs += pcs;
      } else if (name === "MISC") {
        summary.misc.weight += wt;
        summary.misc.pcs += pcs;
      } else if (name === "FINDING") {
        summary.finding.weight += wt;
        summary.finding.pcs += pcs;
      }

      // Always add to total
      summary.total.weight += wt;
      summary.total.pcs += pcs;
      summary.total.amount += amt;
    });

    return [
      {
        field: "diamond",
        summaryTitle: "Diamond Wt/Pcs",
        value: `${summary.diamond.weight.toFixed(3)} / ${summary.diamond.pcs}`,
      },
      {
        field: "cs",
        summaryTitle: "CS Wt/Pcs",
        value: `${summary.cs.weight.toFixed(3)} / ${summary.cs.pcs}`,
      },
      {
        field: "misc",
        summaryTitle: "Misc Wt/Pcs",
        value: `${summary.misc.weight.toFixed(3)} / ${summary.misc.pcs}`,
      },
      {
        field: "finding",
        summaryTitle: "Finding Wt/Pcs",
        value: `${summary.finding.weight.toFixed(3)} / ${summary.finding.pcs}`,
      },
      {
        field: "total",
        summaryTitle: "Total Wt/Pcs",
        value: `${summary.total.weight.toFixed(3)} / ${summary.total.pcs}`,
      },
      {
        field: "amount",
        summaryTitle: "Total Amount",
        value: `${summary.total.amount.toFixed(2)}`,
      },
    ];
  };

  const renderSummary = () => {
    const summaryColumns = getSummaryData();
    return (
      <div className="summaryBox">
        {summaryColumns.map((col) => (
          <div className="summaryItem" key={col.field}>
            <div className="AllEmploe_boxViewTotal">
              <div>
                <p className="AllEmplo_boxViewTotalValue">{col.value}</p>
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

    const fileName = `Job Completion Lead Report_${dateString}.xlsx`;

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

  const handleClickOpenPoup = () => {
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  const handleSave = () => {
    console.log("Saving data...");
    console.log("Selected Date:", selectedDate);
    console.log("Selected Rd3 Name:", selectedRd3Name);
  };

  const onDragEnd = () => {};

  const groupRows = (rows, groupCheckBox) => {
    const grouped = [];
    const adjustedCheckBox = { ...groupCheckBox };

    if (adjustedCheckBox["stockbarcode"]) {
      Object.keys(adjustedCheckBox).forEach((key) => {
        adjustedCheckBox[key] = true;
      });
      setGrupEnChekBox(adjustedCheckBox);
    }

    const keysExceptJobNo = Object.keys(adjustedCheckBox).filter(
      (key) => key !== "stockbarcode"
    );

    const anyFalse = keysExceptJobNo.some((k) => !adjustedCheckBox[k]);
    if (anyFalse && adjustedCheckBox["stockbarcode"]) {
      adjustedCheckBox["stockbarcode"] = false;
      setGrupEnChekBox(adjustedCheckBox);
    }

    if (!Array.isArray(rows)) {
      console.warn("groupRows: rows is not an array!", rows);
      return grouped;
    }

    const allChecked = Object.values(adjustedCheckBox).every(Boolean);
    if (allChecked) {
      return rows.map((row, index) => ({
        ...row,
        id: index,
        srNo: index + 1,
      }));
    }

    rows.forEach((row) => {
      const newRow = { ...row };
      const keyParts = [];

      for (const [field, checked] of Object.entries(adjustedCheckBox)) {
        if (checked) {
          keyParts.push(newRow[field]);
        } else {
          newRow[field] = "-";
        }
      }

      const groupKey = keyParts.join("|");
      if (!grouped[groupKey]) {
        grouped[groupKey] = { ...newRow };
      } else {
        for (const col of OtherKeyData?.rd1 || []) {
          if (!col.GrupChekBox && typeof newRow[col.field] === "number") {
            grouped[groupKey][col.field] =
              (grouped[groupKey][col.field] || 0) + (newRow[col.field] || 0);
          }
        }
      }
    });

    return Object.values(grouped).map((item, index) => ({
      ...item,
      id: index,
      srNo: index + 1,
    }));
  };

  const allChecked = useMemo(
    () => Object.values(grupEnChekBox).every((val) => val === true),
    [grupEnChekBox]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="MaterialWiseWIP_mainGridView"
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
          <p
            style={{
              margin: "20px 10px 0px 10px",
              fontSize: "25px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            Filter
            <IoMdClose
              style={{
                cursor: "pointer",
                fontSize: "25px",
                marginTop: "-10px",
              }}
              onClick={() => setSideFilterOpen(false)}
            />
          </p>

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

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                {renderFilterRange(col)}
              </div>
            ))}

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                {renderFilterDropDown(col)}
              </div>
            ))}

          <div
            style={{
              margin: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            {columns
              .filter((col) => col.filterable)
              .map((col) => (
                <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                  {renderFilterMulti(col)}
                </div>
              ))}
          </div>
        </Drawer>
        <div
          style={{
            position: showImageView && "fixed",
            top: "0px",
            backgroundColor: "#f8f7fa",
            width: "100%",
          }}
        >
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
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "end" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "20px" }}
              >
                <button onClick={toggleDrawer(true)} className="FiletrBtnOpen">
                  Open Filter
                </button>

                {/* <div
                  style={{
                    display: "flex",
                    gap: "3px",
                  }}
                >
                  <DualDatePicker
                    filterState={filterState}
                    setFilterState={setFilterState}
                    validDay={186}
                    validMonth={6}
                    withountDateFilter={true}
                  />
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
                </div> */}
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

                  {/* <CustomTextField
                  select
                  fullWidth
                  value={filters.someField || ""}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  customBorderColor="rgba(47, 43, 61, 0.2)"
                  borderoutlinedColor="#00CFE8"
                  customTextColor="#2F2B3DC7"
                  customFontSize="0.8125rem"
                  size="small"
                  className="selectDropDownMain"
                  variant="filled"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {masterData.rd3.map((item) => (
                    <MenuItem key={item.id} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </CustomTextField> */}

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
              {/* <div style={{ display: "flex" }}>
              {masterData?.rd3.map((data) => (
                <abbr title={data?.name}>
                  <p
                    key={data.id}
                    style={{
                      backgroundColor: data?.colorcode,
                      cursor: "pointer",
                      border: selectedColors.includes(data.id)
                        ? "2px solid black"
                        : "none",
                    }}
                    className="colorFiled"
                    onClick={() => toggleColorSelection(data.id)} // Handle color click
                  ></p>
                </abbr>
              ))}
            </div> */}
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

              {allChecked && masterKeyData?.imageView && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showImageView ? (
                    <div onClick={() => setShowImageView(false)}>
                      <LayoutGrid className="imageViewImgGrid" />
                    </div>
                  ) : (
                    <div onClick={() => setShowImageView(true)}>
                      <ImageUp className="imageViewImg" />
                    </div>
                  )}
                </div>
              )}

              {/* {masterKeyData?.fullScreenGridButton && (
              <button className="fullScreenButton" onClick={toggleFullScreen}>
                <RiFullscreenLine
                  style={{ marginInline: "5px", fontSize: "30px" }}
                />
              </button>
            )} */}

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

              <button onClick={handleClearFilter} className="ClearFilterButton">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 512 512"
                  class="mr-2"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z"></path>
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div
          ref={gridRef}
          style={{
            height: "calc(100vh - 230px)",
            margin: "5px",
            marginTop: showImageView && "170px",
          }}
        >
          {showImageView ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {filteredRows.map((item, idx) => {
                const src =
                  String(item["imageViewkey"] ?? "").trim() || noFoundImg;
                return (
                  <div>
                    <img
                      key={idx}
                      src={src}
                      alt={`record-${idx}`}
                      height="auto"
                      loading="lazy"
                      style={{
                        width: "200px",
                        height: "200px",
                        border: "1px solid lightgray",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px" }}>
                        <p
                          style={{
                            margin: "0px",
                            fontWeight: 600,
                            fontSize: "15px",
                          }}
                        >
                          {item["5"]}
                        </p>
                        <p
                          style={{
                            margin: "0px",
                            fontWeight: 600,
                            fontSize: "14px",
                            display: "flex",
                            gap: "2px",
                            color: "#CF4F7D",
                          }}
                        >
                          <span>{item["16"]}</span>
                          <span>{item["17"]}</span>
                          <span>{item["18"]}</span>
                        </p>
                      </div>
                      <p
                        style={{
                          margin: "0px",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {item["9"]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Warper>
              <DataGrid
                rows={filteredRows ?? []}
                columns={columns ?? []}
                pageSize={pageSize}
                autoHeight={false}
                columnBuffer={17}
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
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
                      pageSize: 20,
                      page: 0,
                    },
                  },
                }}
                slots={{
                  pagination: CustomPagination, // ✅ custom pagination
                }}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[20, 30, 50, 100]}
                className="simpleGridView"
                pagination
                sx={{
                  "& .MuiDataGrid-menuIcon": {
                    display: "none",
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
              </Paper>
            </Box>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}
