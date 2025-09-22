// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18324
// \\nzen\allpublish\lib\jo\28\reactSampleTest

import React, { useState, useEffect, useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import "./NewSampleReport.scss";
import "react-datepicker/dist/react-datepicker.css";
import mainButton from "../images/Mail_32.png";
import printButton from "../images/print.png";
import gridView from "../images/GriedView.png";
import noFoundImg from "../images/noFound.jpg";
import { RiFullscreenLine } from "react-icons/ri";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AiFillSetting } from "react-icons/ai";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftToLine,
  CircleX,
  FunnelPlus,
  FunnelX,
  ImageUp,
  LayoutGrid,
} from "lucide-react";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { DateRangePicker } from "mui-daterange-picker";
import DatePicker from "react-datepicker";
import masterData from "./masterData.json";
import CustomTextField from "../text-field";
import DualDatePicker from "../DatePicker/DualDatePicker";
import { GoCopy } from "react-icons/go";
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

const DraggableColumn = ({
  col,
  index,
  handleCheckboxChange,
  checkedColumns,
}) => {
  return (
    <Draggable draggableId={col.field.toString()} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="banner_card"
          style={{
            opacity: snapshot.isDragging ? 0.5 : 1,
            cursor: "grab",
            transition: "opacity 0.2s ease",
            ...provided.draggableProps.style,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={checkedColumns[col.field]}
                onChange={() => handleCheckboxChange(col.field)}
              />
            }
            label={col.headerName}
            sx={{
              "& .MuiCheckbox-sizeSmall": {
                display: "none!important",
              },
            }}
          />
        </Card>
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

export default function NewSampleReport({ OtherKeyData, mode, onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [toDate, setToDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const gridContainerRef = useRef(null);
  const [showImageView, setShowImageView] = useState(false);
  const [openPopup, setOpenPopup] = useState(false);
  const [openHrefModel, setOpenHrefModel] = useState(false);
  const [columns, setColumns] = useState([]);
  const [openPDate, setOpenPDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [masterKeyData, setMasterKeyData] = useState();
  const [allColumIdWiseName, setAllColumIdWiseName] = useState();
  const [allColumData, setAllColumData] = useState();
  const [allRowData, setAllRowData] = useState();
  const [checkedColumns, setCheckedColumns] = useState({});
  const gridRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [status500, setStatus500] = useState(false);
  const [commonSearch, setCommonSearch] = useState("");
  const [sortModel, setSortModel] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [activeActionColumn, setActiveActionColumn] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [selectionModel, setSelectionModel] = useState([]);

  //Date Filters
  const [dateColumnOptions, setDateColumnOptions] = useState([]);
  const [selectedDateColumn, setSelectedDateColumn] = useState("");
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });

  const startDate = filterState?.dateRange?.startDate;
  const endDate = filterState?.dateRange?.endDate;
  const apiRef = useGridApiRef();

  const [grupEnChekBox, setGrupEnChekBox] = useState({
    empbarcode: true,
    dept: true,
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const pid = searchParams.get("pid");
  const firstTimeLoadedRef = useRef(false);

  useEffect(() => {
    const now = new Date();
    const formattedDate = formatToMMDDYYYY(now);
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
      fetchData(formattedStart, formattedEnd);
    }
  }, [filterState.dateRange]);

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

  const fetchData = async (stat, end) => {
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = searchParams.get("sp");
    setIsLoading(true);
    try {
      // const res = await fetch("/lib/jo/28/reactSampleTest/sampledata.json");
      // if (!res.ok) {
      //   throw new Error(`HTTP error! status: ${res.status}`);
      // }
      // const OtherKeyData = await res.json();
      // const data = await res.json();
      setAllRowData(OtherKeyData?.rd3);
      setAllColumIdWiseName(OtherKeyData?.rd2);
      setMasterKeyData(OtherKeyData?.rd);
      setAllColumData(OtherKeyData?.rd1);
      const grupCheckboxMap = (OtherKeyData?.rd1 || [])
        .filter((col) => col?.grupChekBox)
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
    } catch (error) {
      console.error("Fetch error:", error);
      setStatus500(true);
    } finally {
      setIsLoading(false);
    }
  };

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
        return {
          field: col.field,
          headerName: (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {col.grupChekBox && (
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
          headerNameSub: col.headerName,
          width: col.Width,
          align: col.ColumAlign || "left",
          headerAlign: col.Align,
          filterable: col.ColumFilter,
          headerNamesingle: col.headerName,
          suggestionFilter: col.suggestionFilter,
          hrefLink: col.HrefLink,
          onHrefLinkModel: col.onHrefLinkModel,
          onHrefNavigate: col.onHrefNavigate,
          summuryValueKey: col.summuryValueKey,
          summaryValueFormated: col.summaryValueFormated,
          flex: 1,
          summaryTitle: col.summaryTitle,
          summaryUnit: col.summaryUnit,
          columToFixedValue: col.columToFixedValue,
          copyButton: col.copyButton,
          filterTypes: [
            col.NormalFilter && "NormalFilter",
            col.MultiSelection && "MultiSelection",
            col.RangeFilter && "RangeFilter",
            col.suggestionFilter && "suggestionFilter",
            col.selectDropdownFilter && "selectDropdownFilter",
          ].filter(Boolean),

          renderCell: (params) => {
            const displayValue = params.value;
            if (col.columToFixedValue) {
              return (
                <span
                  style={{
                    color: col.Color || "inherit",
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "5px 20px",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {params.value?.toFixed(col.columToFixedValue)}
                </span>
              );
            }
            if (col.dateColumn == true) {
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
                    backgroundColor: col.BackgroundColor || "inherit",
                    fontSize: col.FontSize || "inherit",
                    textTransform: col.ColumTitleCapital ? "uppercase" : "none",
                    padding: "5px 20px",
                    borderRadius: col.BorderRadius,
                  }}
                >
                  {formattedDate}
                </span>
              );
            } else if (col.copyButton) {
              const handleCopy = () => {
                navigator.clipboard
                  .writeText(displayValue)
                  .then(() => {
                    console.log("Copied to clipboard");
                  })
                  .catch((err) => {
                    console.error("Failed to copy: ", err);
                  });
              };

              return (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: col.Color || "inherit",
                      backgroundColor: col.BackgroundColor || "inherit",
                      fontSize: col.FontSize || "inherit",
                      textTransform: col.ColumTitleCapital
                        ? "uppercase"
                        : "none",
                      padding: "5px 20px",
                      borderRadius: col.BorderRadius,
                    }}
                  >
                    {displayValue}
                  </span>
                  <Button
                    onClick={handleCopy}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginLeft: "8px",
                    }}
                    title="Copy to clipboard"
                  >
                    <GoCopy style={{ fontSize: "18px", color: "black" }} />
                  </Button>
                </div>
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
                    padding: "5px 20px",
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
      headerName: (
        <>
          {masterKeyData?.chekboxSelection ? (
            <>
              <Checkbox
                checked={
                  filteredRows?.length > 0 &&
                  selectionModel.length === filteredRows.length
                }
                indeterminate={
                  selectionModel.length > 0 &&
                  selectionModel.length < filteredRows.length
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    const start =
                      paginationModel.page * paginationModel.pageSize;
                    const end = start + paginationModel.pageSize;
                    const pageRows = filteredRows.slice(start, end);
                    setSelectionModel(pageRows.map((r) => r.id));
                  } else {
                    // ✅ Clear all
                    setSelectionModel([]);
                  }
                }}
                size="small"
              />
              Sr#
            </>
          ) : (
            "Sr#"
          )}
        </>
      ),
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isChecked = selectionModel.includes(params.id);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {masterKeyData?.chekboxSelection && (
              <Checkbox
                size="small"
                checked={selectionModel.includes(params.id)}
                onChange={() => {
                  if (selectionModel.includes(params.id)) {
                    setSelectionModel((prev) =>
                      prev.filter((id) => id !== params.id)
                    );
                  } else {
                    setSelectionModel((prev) => [...prev, params.id]);
                  }
                }}
              />
            )}
            {paginationModel.page * paginationModel.pageSize +
              params.api.getRowIndexRelativeToVisibleRows(params.id) +
              1}
          </div>
        );
      },
    };

    setColumns([srColumn, ...columnData]);
  }, [allColumData, grupEnChekBox, sortModel, paginationModel, selectionModel]);

  // useEffect(() => {
  //   if (!allColumData) return;
  //   const defaultChecked = {};
  //   Object.values(allColumData).forEach((col) => {
  //     if (col.grupChekBox) {
  //       defaultChecked[col.field] = true;
  //     }
  //   });

  //   setCheckedColumns(defaultChecked);
  // }, [allColumData]);

  const handleCellClick = (params) => {
    let url_optigo = sessionStorage.getItem("url_optigo");

    if (params?.colDef?.onHrefNavigate) {
      window?.parent.addTab(
        "Material Purchase",
        "icon-InventoryManagement_invoiceSummary",
        url_optigo +
          "mfg/app/InventoryManagement_invoiceList?invoiceof=supplier&invoiceno=" +
          btoa(params?.formattedValue) +
          "&IsOldMetal=" +
          params?.row?.isoldmetal
      );
    } else if (params?.colDef?.onHrefLinkModel) {
      setOpenHrefModel(true);
    }
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

  useEffect(() => {
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
  }, [allColumData]);

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
      if (isMatch && filterState && selectedDateColumn) {
        const toDateOnly = (d) => new Date(new Date(d).toDateString());
        const rowDate = toDateOnly(row[selectedDateColumn]);
        const parsedStart = toDateOnly(startDate);
        const parsedEnd = toDateOnly(endDate);
        if (
          isNaN(rowDate.getTime()) ||
          rowDate < parsedStart ||
          rowDate > parsedEnd
        ) {
          isMatch = false;
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

    if (masterKeyData?.grupChekBox) {
      const groupedRows = groupRows(rowsWithSrNo, grupEnChekBox);
      setFilteredRows(groupedRows);
    } else {
      setFilteredRows(rowsWithSrNo);
    }
  }, [
    filters,
    commonSearch,
    fromDate,
    toDate,
    startDate,
    columns,
    selectedDateColumn,
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
            <div style={{ width: "100%", margin: "10px 20px" }}>
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

  const renderSuggestionFilter = (col) => {
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
          style={{ margin: "10px 20px", position: "relative", width: "100%" }}
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

  const renderFilterDropDown = (col) => {
    if (!col.filterTypes || col.filterTypes.length === 0) return null;
    const filtersToRender = col.filterTypes;

    return filtersToRender.map((filterType) => {
      switch (filterType) {
        case "selectDropdownFilter": {
          const uniqueValues = [
            ...new Set(originalRows?.map((row) => row[col.field])),
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
            <div
              key={`filter-${col.field}-RangeFilter`}
              style={{ margin: "10px 20px" }}
            >
              <div style={{ display: "flex" }}>
                <p style={{ margin: "0px" }}>{col.headerName}</p>
              </div>
              <CustomTextField
                type="number"
                className="minTexBox"
                customBorderColor="rgba(47, 43, 61, 0.06)"
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
            <div key={col.field} style={{ margin: "10px 20px" }}>
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
        {pid == 18231
          ? summaryData?.map((col) => {
              return (
                <div className="summaryItem" key={col.field}>
                  <div className="AllEmploe_boxViewTotal">
                    <div>
                      <p className="AllEmplo_boxViewTotalValue">{col.value}</p>
                      <p className="boxViewTotalTitle">{col.title}</p>
                    </div>
                  </div>
                </div>
              );
            })
          : summaryColumns.map((col) => {
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
                        {col?.summaryValueFormated
                          ? Number(calculatedValue).toLocaleString("en-IN", {
                              minimumFractionDigits: col?.summuryValueKey,
                              maximumFractionDigits: col?.summuryValueKey,
                            })
                          : calculatedValue.toFixed(col?.summuryValueKey)}{" "}
                        <span style={{ fontSize: "17px" }}>
                          {col?.summaryUnit}
                        </span>
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

  const handleClickOpenPoup = () => {
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  const handleSave = () => {
    console.log("Saving data...");
    console.log("Selected Date:", selectedDate);
  };

  const moveColumn = (dragIndex, hoverIndex) => {
    const updatedColumns = [...columns];
    const [movedColumn] = updatedColumns.splice(dragIndex, 1);
    updatedColumns.splice(hoverIndex, 0, movedColumn);
    setColumns(updatedColumns);
  };

  const onDragEnd = (result) => {
    moveColumn(result.source.index, result.destination.index);
  };

  useEffect(() => {
    let metalAmount = 0;
    let totalDiamondAmount = 0;
    let totalCSTAmount = 0;
    let totalMISCAmount = 0;
    let metalWeight = 0;
    let diamondWeight = 0,
      diamondPcs = 0;
    let colorStoneWeight = 0,
      colorStonePcs = 0;
    let miscWeight = 0,
      miscPcs = 0;
    let totalPureWeight = 0;
    let totalAmount = 0;

    filteredRows?.forEach((item) => {
      const { material, amount, weight, pcs, purewt } = item;

      if (material === "METAL") {
        metalAmount += amount;
      }

      if (material === "METAL" || material === "FINDING") {
        metalWeight += weight;
      }

      if (material === "DIAMOND") {
        totalDiamondAmount += amount;
        diamondWeight += weight;
        diamondPcs += pcs;
      }

      if (material === "COLOR STONE") {
        totalCSTAmount += amount;
        colorStoneWeight += weight;
        colorStonePcs += pcs;
      }
      if (material === "MISC") {
        totalMISCAmount += amount;
        miscWeight += weight;
        miscPcs += pcs;
      }

      totalPureWeight += purewt;
      totalAmount += amount;
    });

    const finalSummary = [
      { title: "Total Metal Amt", value: metalAmount?.toFixed(2) },
      { title: "Total Dia. Amt", value: totalDiamondAmount?.toFixed(2) },
      { title: "Total CST Amt", value: totalCSTAmount?.toFixed(2) },
      { title: "Total MISC Amt", value: totalMISCAmount?.toFixed(2) },
      { title: "Metal Weight", value: metalWeight?.toFixed(3) },
      {
        title: "Diamond Wt/Pcs",
        value: `${diamondWeight?.toFixed(3)} / ${diamondPcs}`,
      },
      {
        title: "Colorstone Wt/Pcs",
        value: `${colorStoneWeight?.toFixed(3)} / ${colorStonePcs}`,
      },
      { title: "MISC Wt/Pcs", value: `${miscWeight?.toFixed(3)} / ${miscPcs}` },
      { title: "Total Pure Wt", value: totalPureWeight?.toFixed(3) },
      { title: "Total Amount", value: totalAmount?.toFixed(2) },
    ];

    setSummaryData(finalSummary);
  }, [filteredRows]);

  const groupRows = (rows, groupCheckBox) => {
    const grouped = [];
    if (!Array.isArray(rows)) {
      console.warn("groupRows: rows is not an array!", rows);
      return grouped;
    }

    rows.forEach((row) => {
      const newRow = { ...row };
      const keyParts = [];
      for (const [field, checked] of Object?.entries(groupCheckBox)) {
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
        for (const col of allColumData) {
          if (!col.grupChekBox && typeof newRow[col.field] === "number") {
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
        className="dynamic_sample_report_main"
        sx={{ width: "100vw", display: "flex", flexDirection: "column" }}
        ref={gridContainerRef}
      >
        {isLoading && (
          <div className="loader-overlay">
            <CircularProgress className="loadingBarManage" />
          </div>
        )}

        <Dialog open={openHrefModel} onClose={() => setOpenHrefModel(false)}>
          <div className="ConversionMain">
            <h1>Hello Model......</h1>
          </div>
        </Dialog>

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
                        handleCheckboxChange={() =>
                          setCheckedColumns((prev) => ({
                            ...prev,
                            [col.field]: !prev[col.field],
                          }))
                        }
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                <Button className="btn_SaveColumModel">Save</Button>
              </div>
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
          <div>
            {columns
              .filter((col) => col.filterable)
              .map((col) => (
                <div key={col.field}>{renderFilterMulti(col)}</div>
              ))}
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

          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.field} style={{ display: "flex", gap: "10px" }}>
                {renderSuggestionFilter(col)}
              </div>
            ))}
        </Drawer>

        <Dialog
          open={Boolean(activeActionColumn)}
          onClose={() => setActiveActionColumn(null)}
          maxWidth="xs"
          fullWidth
        >
          <div style={{ height: "400px" }}>
            <DialogTitle>
              {activeActionColumn
                ? `Update ${activeActionColumn.headerName}`
                : ""}
            </DialogTitle>

            <DialogContent dividers>
              {activeActionColumn?.dateColumn ? (
                <DatePicker
                  label="Select Date"
                  value={tempValue ? new Date(tempValue) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const formatted = newValue.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      setTempValue(formatted);
                    } else {
                      setTempValue("");
                    }
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              ) : activeActionColumn?.actionMasterName ? (
                <TextField
                  select
                  fullWidth
                  label={`Select ${activeActionColumn.headerName}`}
                  value={tempValue || ""}
                  onChange={(e) => setTempValue(e.target.value)}
                >
                  {masterData[activeActionColumn.actionMasterName]?.map(
                    (item) => (
                      <MenuItem
                        key={item.id}
                        value={item.userJob || item.amount}
                      >
                        {item.userJob || item.amount}
                      </MenuItem>
                    )
                  )}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label={`Enter ${activeActionColumn?.headerName}`}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                />
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setActiveActionColumn(null)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (!selectionModel || selectionModel.length === 0) {
                    alert("Please select at least one row first.");
                    return;
                  }
                  if (!tempValue) return;

                  setFilteredRows((prev) =>
                    prev.map((row) =>
                      selectionModel.includes(row.id)
                        ? {
                            ...row,
                            [activeActionColumn.field]:
                              activeActionColumn.dateColumn
                                ? new Date(tempValue).toISOString()
                                : tempValue,
                          }
                        : row
                    )
                  );

                  setActiveActionColumn(null);
                  setTempValue("");
                }}
              >
                Save
              </Button>
            </DialogActions>
          </div>
        </Dialog>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
            }}
          >
            <Button
              variant="outlined"
              onClick={onBack}
              className="fullScreenButton"
            >
              <ArrowLeftToLine />
            </Button>
            {renderSummary()}
          </div>

          <div style={{ display: "flex" }}>
            {masterKeyData?.columSettingModel && (
              <div className="fullScreenButton  " onClick={handleClickOpenPoup}>
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
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "end" }}>
            {masterKeyData?.MultiDateFilter ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "20px" }}
              >
                <button onClick={toggleDrawer(true)} className="FiletrBtnOpen">
                  <MdOutlineFilterAlt
                    style={{ height: "30px", width: "30px" }}
                  />
                </button>

                <FormControl size="small" sx={{ minWidth: 200, margin: "0px" }}>
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
                    setFromDate(null);
                    setToDate(null);
                  }}
                  className="btn_FiletrBtnAll"
                >
                  All
                </Button>
              </div>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Button
                  onClick={toggleDrawer(true)}
                  className="btn_FiletrBtnOpen"
                >
                  <MdOutlineFilterAlt
                    style={{ height: "30px", width: "30px" }}
                  />
                </Button>
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
                    setFromDate(null);
                    setToDate(null);
                  }}
                  className="btn_FiletrBtnAll"
                >
                  All
                </Button>
              </div>
            )}
            <TextField
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
                  padding: "5.5px !important",
                },
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              {allColumData &&
                Object.values(allColumData).map((col) =>
                  col.actionFilter ? (
                    <Button
                      key={col.field}
                      variant="outlined"
                      size="small"
                      className="btn_Action_FiletrBtnOpen"
                      onClick={() => {
                        setActiveActionColumn(col);
                        setTempValue("");
                      }}
                    >
                      Set {col.headerName}
                    </Button>
                  ) : null
                )}
            </div>

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

            {masterKeyData?.imageView &&
            masterKeyData?.allGrupDataShowImageViewShow ? (
              allChecked && (
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
              )
            ) : (
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

            {masterKeyData?.ExcelExport && (
              <Tooltip title="Export to Excel">
                <IconButton
                  onClick={exportToExcel}
                  sx={{
                    background:
                      "linear-gradient(270deg, rgba(115, 103, 240, 0.7) 0%, rgb(115, 103, 240) 100%) !important",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  <SummarizeIcon />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
        <div
          ref={gridRef}
          style={{ height: "calc(100vh - 180px)", margin: "5px" }}
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
                apiRef={apiRef}
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
                }}
                slots={{
                  pagination: CustomPagination,
                }}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                className="simpleGridView"
                pagination
                sx={{
                  "& .MuiDataGrid-menuIcon": {
                    display: "none",
                  },
                  "& .MuiDataGrid-selectedRowCount": {
                    display: "none",
                  },
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
