// http://localhost:3000/testreport/?sp=12&ifid=ToolsReport&pid=18245

import React, { useState, useEffect, useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import "./StcokReport.scss";
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
import OtherKeyData from "./StcokReport.json";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CircleX, ImageUp, LayoutGrid } from "lucide-react";
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

export default function StcokReport() {
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
  const [includeCustomerStock, setIncludeCustomerStock] = useState(false);
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });
  const [sortModel, setSortModel] = useState([]);
  const [grupEnChekBox, setGrupEnChekBox] = useState({});
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
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
      con: `{"id":"","mode":"StockReport","appuserid":"${AllData?.uid}"}`,
      p: `{"fdate":"${stat}","tdate":"${end}"}`,
      f: "Task Management (taskmaster)",
    };

    try {
      const fetchedData = await GetWorkerData(body, sp);
      setAllRowData(fetchedData?.Data?.rd1);
      setAllColumIdWiseName(fetchedData?.Data?.rd);
      setMasterKeyData(OtherKeyData?.rd);
      setAllColumData(OtherKeyData?.rd1);
      const grupCheckboxMap = (OtherKeyData?.rd1 || [])
        .filter((col) => col?.GrupChekBox)
        .reduce((acc, col) => {
          if (col.defaultGrupChekBox) {
            acc[col.field] = true;
          } else {
            acc[col.field] = false;
          }
          return acc;
        }, {});
      setGrupEnChekBox(grupCheckboxMap);
      setStatus500(false);
      setIsLoading(false);
    } catch (error) {
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
                  onClick={(e) => e.stopPropagation()}
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
        defaultChecked[col.field] = true; // ✅ By default checked if GrupChekBox is true
      }
    });

    setCheckedColumns(defaultChecked);
  }, [allColumData]);

  const handleCellClick = (params) => {
    setSelectedDepartmentId(params?.row?.deptid);
    setSelectedEmployeeCode(params?.row?.employeecode);
    setOpen(true);
  };

  // Defensive check to make sure the column map is valid

  const columnMap =
    Array.isArray(allColumIdWiseName) && allColumIdWiseName.length > 0
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

  // console.log("allRowDataallRowData", allRowData);
  // console.log("allColumIdWiseName", allColumIdWiseName);
  // const originalRows =
  //   allColumIdWiseName &&
  //   allRowData?.map((row, index) => {
  //     const formattedRow = {};
  //     Object.keys(row).forEach((key) => {
  //       formattedRow[allColumIdWiseName[0][key]] = row[key];
  //     });
  //     return { id: index, ...formattedRow };
  //   });

  const [pageSize, setPageSize] = useState(10);
  const [filteredRows, setFilteredRows] = useState(originalRows);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(
      (val) => val && (Array.isArray(val) ? val.length > 0 : val !== "")
    );

    if (!hasActiveFilters) {
      setFilteredRows(originalRows);
    }
  }, [originalRows, filters]);

  useEffect(() => {
    const newFilteredRows = originalRows?.filter((row) => {
      let isMatch = true;

      if (!includeCustomerStock && row.iscompanystock !== 1) {
        return false;
      }

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
    includeCustomerStock,
  ]);

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
            <div style={{ width: "100%", margin: "5px 20px" }}>
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
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;
    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "MultiSelection":
          const uniqueValues = [
            ...new Set(originalRows.map((row) => row[col.field])),
          ];
          return (
            <div key={col.field} style={{ width: "100%" }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<MdExpandMore />}
                  aria-controls={`${col.field}-content`}
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
    const summaryColumns = columns.filter((col) => {
      const columnData = Object.values(allColumData).find(
        (data) => data.field === col.field
      );
      return columnData?.summary;
    });

    return (
      <div className="summaryBox">
        {summaryColumns.map((col) => {
          let calculatedValue = 0;

          if (col.field === "lossperfm") {
            const totalLossWt =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row.losswt) || 0),
                0
              ) || 0;

            const totalNetReturnWt =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row.netretunwt) || 0),
                0
              ) || 1; // prevent division by 0
            calculatedValue = (totalLossWt / totalNetReturnWt) * 100;
          } else if (col.field === "lossper") {
            const totalLossWt =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row.losswt) || 0),
                0
              ) || 0;

            const totalNetReturnWt =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row.netretunwtfm) || 0),
                0
              ) || 1; // prevent division by 0
            calculatedValue = (totalLossWt / totalNetReturnWt) * 100;
          } else if (col.field === "losspergross") {
            const totalLossWt =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row.losswt) || 0),
                0
              ) || 0;

            const totalNetReturnWt =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row.grossnetretunwt) || 0),
                0
              ) || 1; // prevent division by 0
            calculatedValue = (totalLossWt / totalNetReturnWt) * 100;
          } else {
            calculatedValue =
              filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row[col.field]) || 0),
                0
              ) || 0;
          }
          return (
            <div className="summaryItem" key={col.field}>
              <div className="AllEmploe_boxViewTotal">
                <div>
                  <p className="AllEmplo_boxViewTotalValue">
                    {calculatedValue.toFixed(col?.summuryValueKey)}
                  </p>
                  <p className="boxViewTotalTitle">{col.summaryTitle}</p>
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

  // const groupRows = (rows, groupCheckBox) => {
  //   const grouped = [];
  //   const adjustedCheckBox = { ...groupCheckBox };
  //   console.log('adjustedCheckBox', adjustedCheckBox);

  //   const keysExceptJobNo = Object.keys(adjustedCheckBox).filter(
  //     (key) => key !== "stockbarcode"
  //   );
  //   const anyFalse = keysExceptJobNo.some((k) => !adjustedCheckBox[k]);
  //   if (anyFalse && adjustedCheckBox["stockbarcode"]) {
  //     adjustedCheckBox["stockbarcode"] = false;
  //     setGrupEnChekBox(adjustedCheckBox);
  //   }

  //   if (!Array.isArray(rows)) {
  //     console.warn("groupRows: rows is not an array!", rows);
  //     return grouped;
  //   }

  //   const allChecked = Object.values(adjustedCheckBox).every(Boolean);
  //   if (allChecked) {
  //     return rows.map((row, index) => ({
  //       ...row,
  //       id: index,
  //       srNo: index + 1,
  //     }));
  //   }

  //   rows.forEach((row) => {
  //     const newRow = { ...row };
  //     const keyParts = [];

  //     for (const [field, checked] of Object.entries(adjustedCheckBox)) {
  //       if (checked) {
  //         keyParts.push(newRow[field]);
  //       } else {
  //         newRow[field] = "-";
  //       }
  //     }

  //     const groupKey = keyParts.join("|");
  //     if (!grouped[groupKey]) {
  //       grouped[groupKey] = { ...newRow };
  //     } else {
  //       for (const col of OtherKeyData?.rd1 || []) {
  //         if (!col.GrupChekBox && typeof newRow[col.field] === "number") {
  //           grouped[groupKey][col.field] =
  //             (grouped[groupKey][col.field] || 0) + (newRow[col.field] || 0);
  //         }
  //       }
  //     }
  //   });

  //   return Object.values(grouped).map((item, index) => ({
  //     ...item,
  //     id: index,
  //     srNo: index + 1,
  //   }));
  // };

  const handleChange = (event) => {
    setIncludeCustomerStock(event.target.checked);
    console.log("Include Customer Stock:", event.target.checked);
  };

  const allChecked = useMemo(
    () => Object.values(grupEnChekBox).every((val) => val === true),
    [grupEnChekBox]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="StcokReportMain_mainGridView"
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
              margin: "3px 15px",
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
              padding: "10px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "end" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <button onClick={toggleDrawer(true)} className="FiletrBtnOpen">
                  <MdOutlineFilterAlt
                    style={{ height: "30px", width: "30px" }}
                  />
                </button>
                <div
                  style={{
                    display: "flex",
                    gap: "3px",
                  }}
                >
                  {/* <DualDatePicker
                    filterState={filterState}
                    setFilterState={setFilterState}
                    validDay={186}
                    validMonth={6}
                    withountDateFilter={true}
                  /> */}
                  <Button
                    onClick={() =>
                      setFilterState({
                        ...filterState,
                        dateRange: {
                          startDate: new Date("2000-01-01T18:30:00.000Z"),
                          endDate: new Date(),
                        },
                      })
                    }
                    className="FiletrBtnAll"
                  >
                    All
                  </Button>
                </div>
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeCustomerStock}
                    onChange={handleChange}
                    name="includeCustomerStock"
                    color="primary"
                    style={{margin: '0px', padding: '0px 5px'}}
                  />
                }
                label="Include Customer Stock"
              />

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
                placeholder="Search..."
                value={commonSearch}
                customBorderColor="rgba(47, 43, 61, 0.2)"
                onChange={(e) => setCommonSearch(e.target.value)}
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
                className="mainSearchTextBox"
                sx={{
                  "& .MuiInputBase-input": {
                    padding: "4.5px !important",
                  },
                }}
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

              {/* <button onClick={handleClearFilter} className="ClearFilterButton">
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
              </button> */}
            </div>
          </div>
        </div>

        <div
          ref={gridRef}
          style={{
            height: "calc(100vh - 175px)",
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
                  <div
                    style={{
                      width: "200px",
                      height: "230px",
                    }}
                  >
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
                            fontSize: "12px",
                            lineHeight: "10px",
                          }}
                        >
                          <span>{item?.stockbarcode}</span>
                        </p>
                        <p
                          style={{
                            margin: "0px",
                            fontWeight: 600,
                            fontSize: "12px",
                            display: "flex",
                            color: "#CF4F7D",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "3px",
                              lineHeight: "10px",
                            }}
                          >
                            <span>{item?.metaltype}</span>
                            <span>{item?.metalpurity}</span>
                          </div>
                          <span>{item?.metalcolor}</span>
                        </p>
                      </div>
                      <p
                        style={{
                          margin: "0px",
                          fontWeight: 600,
                          fontSize: "13px",
                          lineHeight: "10px",
                        }}
                      >
                        {item?.designno}
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
                //For Sorting pagnation
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                getRowId={(row) => row.id} // make sure this is correct!
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
                      pageSize: 10,
                      page: 0,
                    },
                  },
                }}
                slots={{
                  pagination: CustomPagination,
                }}
                onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                className="simpleGridView"
                pagination
                sx={{
                  "& .MuiDataGrid-menuIcon": {
                    display: "none",
                  },
                  "& .MuiDataGrid-selectedRowCount": {
                    display: "none !important",
                  },
                  "& .MuiDataGrid-cell:focus": {
                    borderColor: "navajowhite !important",
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

// {
//     "colid": 2,
//     "headerName": "Date",
//     "field": "entrydate",
//     "Width": 150,
//     "Align": "left",
//     "ColumAlign": "left",
//     "hrefLink": "",
//     "ColumShow": true,
//     "ColumFilter": false,
//     "NormalFilter": true,
//     "DateRangeFilter": false,
//     "MultiSelection": false,
//     "RangeFilter": false,
//     "suggestionFilter": false,
//     "selectDropdownFilter": false,
//     "ColumNumberSetting": 7,
//     "ColumTitleCapital": false,
//     "ColumTitleSmall": false,
//     "FontSize": "12px",
//     "borderRadius": "0px",
//     "color": "",
//     "backgroundColor": "",
//     "summary": false,
//     "columAscendion": false,
//     "columDescending": false,
//     "proiorityFilter": true,
//     "copyButton": false,
//     "EditData": false,
//     "summaryTitle": "",
//     "dateColumn": true,
//     "summuryValueKey": 0
//   },
