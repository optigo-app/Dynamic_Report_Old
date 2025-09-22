// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18316

import React, { useState, useEffect, useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import "./StockDetailIN.scss";
import DatePicker from "react-datepicker";
// import masterData from "./masterData.json";
import "react-datepicker/dist/react-datepicker.css";
import mainButton from "../../images/Mail_32.png";
import printButton from "../../images/print.png";
import gridView from "../../images/GriedView.png";
import imageView from "../../images/ImageView2.png";
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
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Slide,
  Typography,
} from "@mui/material";
import emailjs from "emailjs-com";
import { MdExpandMore, MdOpenInFull } from "react-icons/md";
import CustomTextField from "../../text-field/index";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AiFillSetting } from "react-icons/ai";
import OtherKeyData from "./StockDetailIN.json";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DualDatePicker from "../../DatePicker/DualDatePicker";
import { GetWorkerData } from "../../../API/GetWorkerData/GetWorkerData";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { IoMdClose } from "react-icons/io";
import { showToast } from "../../../Utils/Tostify/ToastManager";
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

const formatToMMDDYYYY = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export default function StockDetailIN() {
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
  const [allColumIdWiseNameAll, setAllColumIdWiseNameAll] = useState();
  const [allColumData, setAllColumData] = useState();
  const [allRowData, setAllRowData] = useState();
  const [allRowDataAll, setAllRowDataAll] = useState();
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
  const [sortModel, setSortModel] = useState([]);
  const [masterData, setMasterData] = useState([]);
  const [filterState, setFilterState] = useState({
    dateRange: { startDate: null, endDate: null },
  });
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [grupEnChekBox, setGrupEnChekBox] = useState({
    empbarcode: true,
    dept: true,
  });

  const materialForDetail = searchParams.get("material");
  const entryDateParam = searchParams.get("entryDate");
  const entryDate = entryDateParam ? new Date(entryDateParam) : new Date();

  const firstTimeLoadedRef = useRef(false);

  const uniqueMaterialNames = useMemo(() => {
    const names = allRowDataAll?.map((row) => row["4"]).filter(Boolean);
    return [...new Set(names)];
  }, [allRowDataAll]);

  useEffect(() => {
    if (materialForDetail && uniqueMaterialNames?.includes(materialForDetail)) {
      setSelectedMaterial(materialForDetail);
    }
  }, [materialForDetail, uniqueMaterialNames]);

  useEffect(() => {
    setStartDate(entryDate);
    setEndDate(entryDate);
    fetchData(formatToMMDDYYYY(entryDate), formatToMMDDYYYY(entryDate));
    setFilterState({
      dateRange: {
        startDate: entryDate, // keep Date
        endDate: entryDate, // keep Date
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
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = searchParams.get("sp");

    setIsLoading(true);

    const body = {
      con: `{"id":"","mode":"STOCK_VALUATION_IN","appuserid":"${AllData?.uid}"}`,
      p: "",
      f: "Task Management (taskmaster)",
    };

    const MasterDataBody = {
      con: `{"id":"","mode":"stockvaluation_master","appuserid":"${AllData?.uid}"}`,
      p: "",
      f: "Task Management (taskmaster)",
    };

    const fetchedDataMaster = await GetWorkerData(MasterDataBody, sp);
    if (fetchedDataMaster) {
      setMasterData(fetchedDataMaster?.Data);
    }

    if (allRowDataAll) {
      setAllRowData(allRowDataAll);
      setAllColumIdWiseName(allColumIdWiseNameAll);
      setMasterKeyData(OtherKeyData?.rd);
      setAllColumData(OtherKeyData?.rd1);
      setStatus500(false);
      setIsLoading(false);
    } else {
      try {
        const fetchedData = await GetWorkerData(body, sp);
        setAllRowData(fetchedData?.Data?.rd1);
        setAllRowDataAll(fetchedData?.Data?.rd1);
        setAllColumIdWiseName(fetchedData?.Data?.rd);
        setAllColumIdWiseNameAll(fetchedData?.Data?.rd);
        setMasterKeyData(OtherKeyData?.rd);
        setAllColumData(OtherKeyData?.rd1);
        setStatus500(false);
        setIsLoading(false);
      } catch (error) {
        setStatus500(true);
        setIsLoading(false);
      }
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
    if (!allColumData || !masterData) return;

    // --- Master Mapping Helpers ---
    const getItemName = (itemid) => {
      return masterData.rd.find((x) => x.id === itemid)?.itemname || "";
    };

    const getShapeName = (itemName, shapeid) => {
      if (itemName === "DIAMOND") {
        return (
          masterData.rd2.find((x) => x.shapeid === shapeid)?.DiamondShape || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd3.find((x) => x.shapeid === shapeid)?.ColorStoneShape ||
          ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd4.find((x) => x.shapeid === shapeid)?.Miscshape || ""
        );
      }
      return shapeid || "";
    };

    const getColorName = (itemName, colorid) => {
      if (itemName === "DIAMOND") {
        return (
          masterData.rd5?.find((x) => x.colorid === colorid)?.Diamondcolor || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd6?.find((x) => x.colorid === colorid)?.ColorStonecolor ||
          ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd7?.find((x) => x.colorid === colorid)?.Misccolor || ""
        );
      }
      return colorid || "";
    };

    const getQualityName = (itemName, qualityid) => {
      console.log('itemNameitemName',itemName , qualityid);
      if (itemName === "DIAMOND") {
        return (
          masterData.rd8?.find((x) => x.qualityid === qualityid)
            ?.diamondquality || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd9?.find((x) => x.qualityid === qualityid)
            ?.colorstonequality || ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd10?.find((x) => x.qualityid === qualityid)
            ?.miscquality || ""
        );
      } else if (itemName === "FINDING") {
        return (
          masterData.rd11?.find((x) => x.qualityid === qualityid)
            ?.FindingQuality || ""
        );
      }
      return qualityid || "";
    };

    const getSizeName = (itemName, sizeId) => {
      if (itemName === "DIAMOND") {
        return (
          masterData.rd11?.find((x) => x.sizeid === sizeId)?.diamondsize || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd12?.find((x) => x.sizeid === sizeId)?.colorstonesize ||
          ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd13?.find((x) => x.sizeid === sizeId)?.miscsize || ""
        );
      } else if (itemName === "FINDING") {
        return (
          masterData.rd15?.find((x) => x.sizeid === sizeId)?.FindingSize || ""
        );
      } else if (itemName === "METAL") {
        return (
          masterData.rd16?.find((x) => x.sizeid === sizeId)?.MetalSize || ""
        );
      }
      return sizeId || "";
    };

    const getMaterialName = (qualityid) => {
      const match = masterData.rd1?.find((x) => x.materialtypeid === qualityid);
      return match?.materialtypename || qualityid || "";
    };

    const columnData = Object.values(allColumData)
      .filter((col) => col.ColumShow)
      .map((col) => {
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
          ...col,
          renderCell: (params) => {
            const itemName = getItemName(params.row.itemid);
            if (col.field === "itemid") {
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
                  {itemName}
                </span>
              );
            }

            if (col.field === "shapeid") {
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
                  {getShapeName(itemName, params.value)}
                </span>
              );
            }

            if (col.field === "colorid") {
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
                  {getColorName(itemName, params.value)}
                </span>
              );
            }

            if (col.field === "qualityid") {
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
                  {getQualityName(itemName, params.value)}
                </span>
              );
            }

            if (col.field === "sizeid") {
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
                  {getSizeName(itemName, params.value)}
                </span>
              );
            }

            if (col.field === "materialtypeid") {
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
                  {getMaterialName(params.value)}
                </span>
              );
            }

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
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                  onClick={() => handleCellClick(params)}
                >
                  {params.value}
                </a>
              );
            } else if (col.dateColumn) {
              const formattedDate =
                params.value && !isNaN(new Date(params.value).getTime())
                  ? new Date(params.value).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "";
              return (
                <span style={{ fontSize: col.FontSize || "inherit" }}>
                  {formattedDate}
                </span>
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
  }, [allColumData, masterData, grupEnChekBox, sortModel]);

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

  const originalRows =
    allColumIdWiseName &&
    allRowData?.map((row, index) => {
      const formattedRow = {};
      Object.keys(row).forEach((key) => {
        formattedRow[allColumIdWiseName[0][key]] = row[key];
      });
      return { id: index, ...formattedRow };
    });

  const [dateColumnOptions, setDateColumnOptions] = useState([]);
  const [selectedDateColumn, setSelectedDateColumn] = useState("");

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
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [filteredRows, setFilteredRows] = useState(originalRows);
  const [filters, setFilters] = useState({});

 useEffect(() => {
    const getItemName = (itemid) => {
      return masterData.rd.find((x) => x.id === itemid)?.itemname || "";
    };

    const getShapeName = (itemName, shapeid) => {
      if (itemName === "DIAMOND") {
        return (
          masterData.rd2.find((x) => x.shapeid === shapeid)?.DiamondShape || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd3.find((x) => x.shapeid === shapeid)?.ColorStoneShape ||
          ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd4.find((x) => x.shapeid === shapeid)?.Miscshape || ""
        );
      }
      return shapeid || "";
    };

    const getColorName = (itemName, colorid) => {
      if (itemName === "DIAMOND") {
        return (
          masterData.rd5?.find((x) => x.colorid === colorid)?.Diamondcolor || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd6?.find((x) => x.colorid === colorid)?.ColorStonecolor ||
          ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd7?.find((x) => x.colorid === colorid)?.Misccolor || ""
        );
      }
      return colorid || "";
    };

    const getQualityName = (itemName, qualityid) => {
      console.log("itemNameitemName", itemName, qualityid);
      if (itemName === "DIAMOND") {
        return (
          masterData.rd8?.find((x) => x.qualityid === qualityid)
            ?.diamondquality || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd9?.find((x) => x.qualityid === qualityid)
            ?.colorstonequality || ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd10?.find((x) => x.qualityid === qualityid)
            ?.miscquality || ""
        );
      } else if (itemName === "FINDING") {
        return (
          masterData.rd11?.find((x) => x.qualityid === qualityid)
            ?.FindingQuality || ""
        );
      }
      return qualityid || "";
    };

    const getSizeName = (itemName, sizeId) => {
      if (itemName === "DIAMOND") {
        return (
          masterData.rd11?.find((x) => x.sizeid === sizeId)?.diamondsize || ""
        );
      } else if (itemName === "COLOR STONE") {
        return (
          masterData.rd12?.find((x) => x.sizeid === sizeId)?.colorstonesize ||
          ""
        );
      } else if (itemName === "MISC") {
        return (
          masterData.rd13?.find((x) => x.sizeid === sizeId)?.miscsize || ""
        );
      } else if (itemName === "FINDING") {
        return (
          masterData.rd15?.find((x) => x.sizeid === sizeId)?.FindingSize || ""
        );
      } else if (itemName === "METAL") {
        return (
          masterData.rd16?.find((x) => x.sizeid === sizeId)?.MetalSize || ""
        );
      }
      return sizeId || "";
    };

    const getMaterialName = (qualityid) => {
      const match = masterData.rd1?.find((x) => x.materialtypeid === qualityid);
      return match?.materialtypename || qualityid || "";
    };
    
    const newFilteredRows = originalRows?.filter((row) => {
      let isMatch = true;

      const itemName = getItemName(row.itemid); // use same mapping
      const getDisplayValue = (field, value) => {
        switch (field) {
          case "shapeid":
            return getShapeName(itemName, value);
          case "colorid":
            return getColorName(itemName, value);
          case "qualityid":
            return getQualityName(itemName, value);
          case "sizeid":
            return getSizeName(itemName, value);
          case "materialtypeid":
            return getMaterialName(value);
          case "itemid":
            return itemName;
          default:
            return value;
        }
      };

      if (selectedMaterial && row.event !== selectedMaterial) {
        isMatch = false;
      }

      for (const filterField of Object.keys(filters)) {
        const filterValue = filters[filterField];
        if (!filterValue || filterValue.length === 0) continue;

        const rawRowValue = getDisplayValue(filterField, row[filterField]);

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
        const hasMatch = Object.keys(row).some((key) => {
          const displayVal = getDisplayValue(key, row[key]);
          return displayVal?.toString().toLowerCase().includes(searchText);
        });
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
    columns,
    startDate,
    selectedColors,
    selectedDateColumn,
    selectedMaterial,
  ]);

  const handleMaterialChange = (event) => {
    setSelectedMaterial(event.target.value);
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
            <Typography>{col.headerNamesingle || col.field}</Typography>
          </AccordionSummary>
          <AccordionDetails
            className="gridMetalComboMain"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {uniqueValues
              .filter((value) => value.trim() !== "")
              .map((value) => (
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

  // for excel data format
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

    if (!Array.isArray(rows)) {
      console.warn("groupRows: rows is not an array!", rows);
      return grouped;
    }

    rows.forEach((row) => {
      const newRow = { ...row };
      const keyParts = [];
      for (const [field, checked] of Object.entries(groupCheckBox)) {
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
        for (const col of OtherKeyData?.rd1) {
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className="JobCompletion_report_main"
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

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {columns
              .filter(
                (col) =>
                  col.filterable &&
                  Array.isArray(col.filterTypes) &&
                  col.filterTypes.includes("MultiSelection")
              )
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
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* <button onClick={toggleDrawer(true)} className="FiletrBtnOpen">
                Filter
              </button> */}
              {/* <FormControl size="small" sx={{ minWidth: 200, margin: "0px" }}>
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
              </FormControl> */}
              <DualDatePicker
                filterState={filterState}
                setFilterState={setFilterState}
                validDay={186}
                validMonth={6}
              />
              {/* <p
                style={{ fontWeight: 600, color: "#696262", fontSize: "17px" }}
              >
                {" "}
                Last Updated :- {lastUpdated}
              </p> */}

              <FormControl size="small" sx={{ width: 200, margin: "0px" }}>
                <Select
                  value={selectedMaterial}
                  onChange={handleMaterialChange}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflowY: "auto",
                      },
                    },
                  }}
                >
                  {uniqueMaterialNames.map((cust, index) => (
                    <MenuItem key={index} value={cust}>
                      {cust}
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
              placeholder="Search..."
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
        <div
          ref={gridRef}
          style={{ height: "calc(100vh - 180px)", margin: "5px" }}
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
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
                // pageSize={pageSize}
                autoHeight={false}
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
                // onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                // rowsPerPageOptions={[5, 10, 15, 25, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50, 100]}
                className="simpleGridView bottomNavigate"
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
