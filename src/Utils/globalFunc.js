import { IconButton, MenuItem, Select, TextField } from "@mui/material";
import { gridPageCountSelector, gridPageSelector, useGridApiContext, useGridSelector } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from "@mui/icons-material";

export const getClientIpAddress = async () => {
  try {
    const cachedIp = sessionStorage.getItem("clientIpAddress");
    if (cachedIp) return cachedIp;
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    const ip = data?.ip || "";
    sessionStorage.setItem("clientIpAddress", ip);
    return ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "";
  }
};


export const CustomPagination = () => {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = apiRef.current.getRowsCount();
  const pageSize = apiRef.current.state.pagination.paginationModel.pageSize;
  const [inputPage, setInputPage] = useState(page + 1);

  useEffect(() => {
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>Rows per page:</span>
        <Select
          value={pageSize}
          onChange={handlePageSizeChange}
          size="small"
          sx={{
            height: "28px",
            width: "68px",
            fontSize: "14px",
            "& .MuiSelect-select": {
              padding: "0 8px !important",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "0.5px",
            },

            "& .MuiPaper-root": {
              marginBottom: "-50px !important"
            }
          }}
        >
          {[20, 30, 50, 100].map((size) => (
            <MenuItem key={size} value={size} sx={{ fontSize: "14px", py: "6px" }}>
              {size}
            </MenuItem>
          ))}
        </Select>

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
          sx={{
            "& .MuiInputBase-root": {
              padding: "2px 5px !important",
              height: "28px !important",
            },
          }}
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
};