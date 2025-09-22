import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridCloseIcon } from "@mui/x-data-grid";
import "./AllEmployeeDataReport.scss";
import DatePicker from "react-datepicker";
import masterData from "./masterData.json";
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
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Slide,
  TextField,
  Typography,
} from "@mui/material";
import emailjs from "emailjs-com";
import { MdExpandMore, MdOpenInFull } from "react-icons/md";
import CustomTextField from "../../text-field/index";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AiFillSetting } from "react-icons/ai";
import OtherKeyData from "./AllEmployeeData.json";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SingleEmployeeWiseData from "./SingleEmployeeWiseData/SingleEmployeeWiseData";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Warper from "../../WorkerReportSpliterView/AllEmployeeDataReport/warper";

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
  AllFinalData,
  selectCustomerCode,
  onClosePane,
  onOpenPane,
  isPaneCollapsed,
  showAllSalesrepData,
}) {
  const [commonSearch, setCommonSearch] = React.useState("");
  const [toDate, setToDate] = React.useState(null);
  const [fromDate, setFromDate] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const gridContainerRef = React.useRef(null);
  const [showImageView, setShowImageView] = React.useState(false);
  const [selectedColors, setSelectedColors] = React.useState([]);
  const [openPopup, setOpenPopup] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [openPDate, setOpenPDate] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedRd3Name, setSelectedRd3Name] = React.useState("");
  const [masterKeyData, setMasterKeyData] = React.useState();
  const [allColumData, setAllColumData] = React.useState();
  const [originalRows, setAllRowData] = React.useState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [checkedColumns, setCheckedColumns] = React.useState({});
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState();
  const [selectedEmployeeCode, setSelectedEmployeeCode] = React.useState();
  const [selectedEmployeeName, setSelectedEmployeeName] = React.useState();
  const [sortModel, setSortModel] = React.useState([]);
  const [selectedEmployeeBarCode, setSelectedEmployeeBarCode] =
    React.useState();
  const [grupEnChekBox, setGrupEnChekBox] = React.useState({
    po: true,
    skuno: true,
    customercode: true
  });
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });

  const [lastUpdated, setLastUpdated] = React.useState("");
  const gridRef = React.useRef(null);
  const APICall = () => {

    setIsLoading(true);
    const filteredCustomerData = AllFinalData?.filter((item) => {
      if (showAllSalesrepData) return true;
      return item.customercode === selectCustomerCode;
    }).map((item) => ({
      ...item,
      id: item.skuno,
    }));

    setMasterKeyData(OtherKeyData?.rd);
    setAllColumData(OtherKeyData?.rd1);
    setAllRowData(filteredCustomerData);
    setIsLoading(false);
  };

  React.useEffect(() => {
    APICall();
  }, [selectCustomerCode, AllFinalData]);

  React.useEffect(() => {
    const now = new Date();
    const formatNumber = (n) => n.toString().padStart(2, "0");

    const formattedDate = `${formatNumber(now.getDate())}-${formatNumber(
      now.getMonth() + 1
    )}-${now.getFullYear()} ${formatNumber(now.getHours())}:${formatNumber(
      now.getMinutes()
    )}`;

    setLastUpdated(formattedDate);
  }, []);

  React.useEffect(() => {
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

  React.useEffect(() => {
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
          realHeaderName: col.headerName,
          align: col.ColumAlign || "left",
          headerAlign: col.Align,
          filterable: col.ColumFilter,
          suggestionFilter: col.suggestionFilter,
          hrefLink: col.hrefLink,
          summuryValueKey: col.summuryValueKey,
          summaryTitle: col.summaryTitle,
          ToFixedValue: col.ToFixedValue,
          filterTypes: [
            col.NormalFilter && "NormalFilter",
            col.DateRangeFilter && "DateRangeFilter",
            col.MultiSelection && "MultiSelection",
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
                    padding: "5px",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {params.value?.toFixed(col.ToFixedValue)}
                </span>
              );
            } else if (params?.field == "age") {
              const currentDate = new Date(); // current datetime
              const orderDate = new Date(params.row.entrydate); // convert string to Date object
              const diffInMs = currentDate - orderDate; // gives milliseconds
              const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // convert ms to days

              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {diffInDays}
                </span>
              );
            } else if (params?.field == "totalcnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  <span>{params.value} </span>/{" "}
                  {params?.row?.totalwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "wipcnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      color: "blue",
                      cursor: "pointer",
                    }}
                    className="hyperLinkShow"
                    onClick={() => handleCellClick(params)}
                  >
                    {params.value}{" "}
                  </span>
                  / {params?.row?.wipwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "pipcnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      color: "blue",
                      cursor: "pointer",
                    }}
                    className="hyperLinkShow"
                    onClick={() => handleCellClick(params)}
                  >
                    {params.value}{" "}
                  </span>
                  / {params?.row?.pipwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "inqamcnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      color: "blue",
                      cursor: "pointer",
                    }}
                    className="hyperLinkShow"
                    onClick={() => handleCellClick(params)}
                  >
                    {params.value}{" "}
                  </span>
                  / {params?.row?.inqabookwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "inqccnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  {params.value} / {params?.row?.instockwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "pendingcnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  {params.value} / {params?.row?.etapendingwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "dispatchedcnt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  {params.value} / {params?.row?.insalewt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "inmemo") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  {params.value} / {params?.row?.inmemowt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "inmelt") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  {params.value} / {params?.row?.inmeltwt?.toFixed(3)}
                </span>
              );
            } else if (params?.field == "incompany") {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    borderRadius: col.BorderRadius,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "5px",
                  }}
                >
                  {params.value} / {params?.row?.incompanywt?.toFixed(3)}
                </span>
              );
            } else if (col.hrefLink) {
              return (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "blue",
                    fontSize: col.FontSize || "inherit",
                    cursor: "pointer",
                    width: "120px",
                    fontSize: col.FontSize || "inherit",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                  onClick={() => handleCellClick(params)}
                  className="hyperLinkShow"
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
                    padding: "5px",
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
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    };

    setColumns([srColumn, ...columnData]);
  }, [allColumData, grupEnChekBox, sortModel, paginationModel]);

  const handleCellClick = (params) => {
    let url_optigo = sessionStorage.getItem("url_optigo");

    if (params?.field == "wipcnt") {
      window?.parent.parent.addTab(
        "WIP Report",
        "icon-pipbook",
        url_optigo +
          "/mfg/app/ReportManagement_WIPReport?SKUNO=" +
          btoa(params?.row?.skuno) +
          "&ifid=PIPBOOK&pid=18096"
      );
    } else if (params?.field == "pipcnt") {
      window?.parent.parent.addTab(
        "PIP BOOK",
        "icon-pipbook",
        url_optigo +
          "/mfg/app/ReportManagement_WIPReport?procurement=1&SKUNO=" +
          btoa(params?.row?.skuno) +
          "&ifid=PIPBOOK&pid=18096"
      );
    } else if (params?.field == "inqamcnt") {
      window?.parent.parent.addTab(
        "QA Book",
        "icon-StockBook",
        url_optigo +
          "salescrm/app/StockManagement_StockBook_Inward?JobCompleteStatusId=1&SKUNO=" +
          btoa(params?.row?.skuno)
      );
    } else if (params?.field == "inqccnt") {
      window?.parent.parent.addTab(
        "Stock Book",
        "icon-StockBook",
        url_optigo +
          "salescrm/app/StockManagement_StockBook_Inward?SKUNO=" +
          btoa(params?.row?.skuno)
      );
    }
  };

  const [pageSize, setPageSize] = React.useState(10);
  const [filteredRows, setFilteredRows] = React.useState(originalRows);
  const [filters, setFilters] = React.useState({});

  React.useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(
      (val) => val && (Array.isArray(val) ? val.length > 0 : val !== "")
    );

    if (!hasActiveFilters) {
      setFilteredRows(originalRows);
    }
  }, [originalRows, filters]);

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
    // setFilteredRows(rowsWithSrNo);
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

  // filters, originalRows, commonSearch, fromDate, toDate, columns

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
                placeholder={`${col.realHeaderName}`}
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

  const [highlightedIndex, setHighlightedIndex] = React.useState({});
  const [suggestionVisibility, setSuggestionVisibility] = React.useState({});
  const suggestionRefs = React.useRef({});
  React.useEffect(() => {
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

  const renderFiltersuggestionFilter = (col) => {
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
          style={{ margin: "10px 20px", position: "relative" }}
        >
          <CustomTextField
            fullWidth
            placeholder={col?.realHeaderName}
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
          // const uniqueValues = [
          //   ...new Set(originalRows?.map((row) => row[col.field])),
          // ];
          const uniqueValues = [
            ...new Map(
              originalRows
                ?.map((row) => row[col.field])
                ?.filter(Boolean) // remove null/undefined/empty
                .map((val) => [val.toLowerCase(), val]) // key = lowercase, value = original
            ).values(),
          ].sort((a, b) => a.localeCompare(b));
          return (
            <div
              key={`filter-${col.field}-selectDropdownFilter`}
              style={{ width: "100%", margin: "10px 20px" }}
            >
              <CustomTextField
                select
                fullWidth
                label={`${col.realHeaderName}`}
                value={filters[col.field] || ""}
                onChange={(e) => handleFilterChange(col.field, e.target.value)}
                size="small"
                className="selectDropDownMain"
                variant="filled"
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 300, // set height
                        overflowY: "auto", // enable scroll
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>{`All`}</em>
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

  const [sideFilterOpen, setSideFilterOpen] = React.useState(false);
  const toggleDrawer = (newOpen) => () => {
    setSideFilterOpen(newOpen);
  };

  const renderSummary = () => {
    const summaryGroups = allColumData
      ?.filter((col) => col.summary)
      ?.reduce((acc, col) => {
        const title = col.summaryTitle || "Unknown";
        if (!acc[title]) acc[title] = [];
        acc[title].push(col);
        return acc;
      }, {});

    // ✅ Check if summaryGroups is valid before using Object.entries
    if (!summaryGroups || Object.keys(summaryGroups).length === 0) {
      return null; // or return <div>No summary data available</div>
    }

    return (
      <div className="summaryBox">
        {Object.entries(summaryGroups).map(([title, cols]) => {
          const countCol = cols.find(
            (col) =>
              col.field.toLowerCase().includes("cnt") ||
              col.field.toLowerCase().includes("memo") ||
              col.field.toLowerCase().includes("melt") ||
              col.field.toLowerCase().includes("company")
          );

          const weightCol = cols.find((col) =>
            col.field.toLowerCase().includes("wt")
          );

          const countValue = countCol
            ? filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row[countCol.field]) || 0),
                0
              )
            : null;

          const weightValue = weightCol
            ? filteredRows?.reduce(
                (sum, row) => sum + (parseFloat(row[weightCol.field]) || 0),
                0
              )
            : null;

          const summaryDisplay = `${countValue ?? "-"} / ${
            weightValue != null ? weightValue.toFixed(3) : "-"
          }`;

          return (
            <div className="summaryItem" key={title}>
              <div className="OSR_AllEmploe_boxViewTotal">
                <div>
                  <p className="AllEmplo_boxViewTotalValue_osr">
                    {summaryDisplay}
                  </p>
                  <p className="boxViewTotalTitle_OSR">{title}</p>
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
    const fileName = `OSR Report_${dateString}.xlsx`;
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

  const moveColumn = (fromIndex, toIndex) => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setColumns(newColumns);
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

  const groupRows = (rows, groupCheckBox) => {
    const allGroupTrue = Object.values(groupCheckBox).every(
      (val) => val === true
    );

    if (allGroupTrue) {
      return rows?.map((row, index) => ({
        ...row,
        id: index,
        srNo: index + 1,
      }));
    }

    const groupedMap = {};
    rows.forEach((row) => {
      const newRow = { ...row };
      const keyParts = [];
      for (const [field, checked] of Object.entries(groupCheckBox)) {
        if (checked) {
          keyParts.push(newRow[field] ?? "");
        } else {
          newRow[field] = "-";
        }
      }

      const groupKey = keyParts.join("|");
      if (!groupedMap[groupKey]) {
        groupedMap[groupKey] = { ...newRow };
      } else {
        for (const col of OtherKeyData?.rd1 ?? []) {
          const field = col.field;
          if (!col.GrupChekBox && typeof newRow[field] === "number") {
            groupedMap[groupKey][field] =
              (groupedMap[groupKey][field] || 0) + (newRow[field] || 0);
          }
        }
      }
    });

    return Object.values(groupedMap).map((item, index) => ({
      ...item,
      id: index,
      srNo: index + 1,
    }));
  };

  const onDragEnd = () => {};

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="OSR_AllEmoployee_mainGridView"
        sx={{ width: "100vw", display: "flex", flexDirection: "column" }}
        ref={gridContainerRef}
      >
        {isLoading && (
          <div className="loader-overlay">
            {/* <CircularProgress className="loadingBarManage" /> */}
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "20px 20px 0px 0px",
            }}
          >
            <p style={{ margin: "0px 20px 0px 20px", fontSize: "25px" }}>
              Filter
            </p>
            <Button
              onClick={handleClearFilter}
              className="ClearFilterButton_osr"
            >
              Clear
            </Button>
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
              <div key={col.field} style={{ gap: "10px" }}>
                {renderFiltersuggestionFilter(col)}
              </div>
            ))}

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field}>{renderFilterMulti(col)}</div>
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
        </Drawer>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: "30px" }}>
            {!isPaneCollapsed && (
              <p
                onClick={onClosePane}
                style={{
                  cursor: "pointer",
                  color: "rgb(191 183 183)",
                  margin: "10px",
                }}
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
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <Button
                onClick={toggleDrawer(true)}
                className="FiletrBtnOpen"
                style={{
                  backgroundColor: "#e0e0e0",
                }}
              >
                Filter
              </Button>
              <p
                style={{
                  fontWeight: 600,
                  color: "rgb(154 153 153)",
                  fontSize: "11px",
                }}
              >
                {" "}
                Last Updated <br /> <span>{lastUpdated}</span>
              </p>
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

                <CustomTextField
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
                </CustomTextField>

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

            {/* {masterKeyData?.fullScreenGridButton && (
              <button className="fullScreenButton" onClick={toggleFullScreen}>
                <RiFullscreenLine
                  style={{ marginInline: "5px", fontSize: "30px" }}
                />
              </button>
            )} */}

            <CustomTextField
              type="text"
              placeholder="Search"
              value={commonSearch}
              customBorderColor="rgba(47, 43, 61, 0.2)"
              onChange={(e) => setCommonSearch(e.target.value)}
              InputProps={{
                endAdornment: commonSearch && (
                  <IconButton
                    size="small"
                    onClick={() => setCommonSearch("")}
                    edge="end"
                  >
                    <GridCloseIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              style={{ width: "200px" }}
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
            <Warper>
              <DataGrid
                rows={filteredRows ?? []}
                columns={columns ?? []}
                pageSize={pageSize}
                autoHeight={false}
                localeText={{ noRowsLabel: "No Data" }}
                columnBuffer={17}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50, 100]}
                getRowId={(row) => row.id} // make sure this is correct!
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
                onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
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
              currentLocation={selectedLocation}
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
