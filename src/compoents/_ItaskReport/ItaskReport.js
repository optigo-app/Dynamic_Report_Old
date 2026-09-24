// http://localhost:3000/testreport/?sp=6&ifid=ToolsReport&pid=1000

import React, { useEffect, useMemo, useState } from "react";
import {
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Checkbox,
  InputAdornment,
  IconButton,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useSearchParams } from "react-router-dom";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { ClearIcon } from "@mui/x-date-pickers";
import { SearchIcon } from "lucide-react";

const normalize = (s) =>
  (s || "").toString().trim().toLowerCase().replace(/\s+/g, "");

export default function ItaskReport() {
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [status500, setStatus500] = useState(false);

  // masters
  const [rd, setRd] = useState([]); // main groups
  const [rd1, setRd1] = useState([]); // groups
  const [rd2, setRd2] = useState([]); // attributes (id -> label)
  const [rd3, setRd3] = useState([]); // relations

  const [qlColIdToName, setQlColIdToName] = useState({});
  const [rawRows, setRawRows] = useState([]);

  const [selectedMainGroupId, setSelectedMainGroupId] = useState("");
  const [selectedAttrsByGroupId, setSelectedAttrsByGroupId] = useState({});
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await masterData();
        await quickListData();
      } catch (e) {
        setStatus500(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const masterData = async () => {
    const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = searchParams.get("sp");
    const body = {
      con: `{"id":"","mode":"quickreportmasters","appuserid":"${AllData?.uid}"}`,
      p: "",
      f: "Task Management (taskmaster)",
    };
    const res = await GetWorkerData(body, sp);
    setRd(res?.Data?.rd ?? []);
    setRd1(res?.Data?.rd1 ?? []);
    setRd2(res?.Data?.rd2 ?? []);
    setRd3(res?.Data?.rd3 ?? []);
  };

  const quickListData = async () => {
    const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = searchParams.get("sp");
    const body = {
      con: `{"id":"","mode":"QUICKLIST","appuserid":"${AllData?.uid}"}`,
      p: `{"fdate":"","tdate":""}`,
      f: "Task Management (taskmaster)",
    };
    const res = await GetWorkerData(body, sp);
    const colMap = res?.Data?.rd?.[0] ?? {};
    setQlColIdToName(colMap);
    setRawRows(res?.Data?.rd1 ?? []);
  };

  // ---------- relations for dropdowns ----------
  const rd3ForSelectedMain = useMemo(() => {
    if (!selectedMainGroupId) return [];
    const sel = parseInt(selectedMainGroupId, 10);
    return (rd3 || []).filter((x) => x.filtermaingroupid === sel);
  }, [rd3, selectedMainGroupId]);

  const groupsForMain = useMemo(() => {
    const uniq = new Map();
    rd3ForSelectedMain.forEach((rel) => {
      if (!uniq.has(rel.filtergroupid)) {
        const g = rd1.find((r) => r.id === rel.filtergroupid);
        uniq.set(rel.filtergroupid, {
          groupId: rel.filtergroupid,
          groupName: g?.filtergroup || `Group ${rel.filtergroupid}`,
        });
      }
    });
    return Array.from(uniq.values());
  }, [rd1, rd3ForSelectedMain]);

  const groupOptions = useMemo(() => {
    const byGroup = {};
    groupsForMain.forEach(({ groupId }) => {
      const rels = rd3ForSelectedMain.filter(
        (r) => r.filtergroupid === groupId
      );
      const opts = rels
        .map((r) => {
          const attr = rd2.find((a) => a.id === r.filterattrid);
          return attr ? { attrId: attr.id, attrName: attr.filterattr } : null;
        })
        .filter(Boolean);
      byGroup[groupId] = opts;
    });
    return byGroup;
  }, [rd2, rd3ForSelectedMain, groupsForMain]);

  const allColumnNames = useMemo(() => {
    return Object.keys(qlColIdToName)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((k) => qlColIdToName[k]);
  }, [qlColIdToName]);

  const masterColNameSet = useMemo(() => {
    const normColNameToActual = {};
    allColumnNames.forEach((c) => (normColNameToActual[normalize(c)] = c));
    const set = new Set();
    (rd1 || []).forEach((g) => {
      const col = normColNameToActual[normalize(g.filtergroup)];
      if (col) set.add(col); // e.g., "status","priority","type","color", etc.
    });
    return set;
  }, [rd1, allColumnNames]);

  const idToAttr = useMemo(() => {
    const m = new Map();
    (rd2 || []).forEach((a) => m.set(Number(a.id), a.filterattr));
    return m;
  }, [rd2]);

  const gridColumns = useMemo(() => {
    return allColumnNames
      .filter((name) => !/^G\d+$/i.test(name))
      .map((name) => {
        const base = {
          field: name,
          headerName: name.replace(/_/g, " ").toUpperCase(),
          width: name == "taskid" ? 80 : name == "taskname" ? 250 : 120,
          flex: name == "taskid" || name == "taskname" ? "" : 1,
        };

        if (masterColNameSet.has(name)) {
          return {
            ...base,
            renderCell: (params) => {
              const v = params.value;
              if (
                v === 0 ||
                v === "0" ||
                v === null ||
                v === undefined ||
                v === ""
              )
                return "";
              const label = idToAttr.get(Number(v));
              return label ?? v; // fallback to raw if not found
            },
          };
        }
        if (name === "deadlinedate") {
          return {
            ...base,
            field: "deadlinedate",
            valueFormatter: (params) => {
              const value = params;
              if (!value) return "";
              const d = new Date(value);
              if (isNaN(d.getTime())) return value;
              return d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
            },
          };
        }
        return base;
      });
  }, [allColumnNames, masterColNameSet, idToAttr]);

  const originalRows = useMemo(() => {
    return (rawRows || []).map((row, idx) => {
      const out = {};
      Object.keys(row).forEach((k) => {
        const colName = qlColIdToName[k];
        if (colName) out[colName] = row[k];
      });

      const safeId =
        out.taskid !== undefined && out.taskid !== null ? out.taskid : idx + 1;
      return { id: safeId, ...out };
    });
  }, [rawRows, qlColIdToName]);

  const groupIdToColumnKey = useMemo(() => {
    const byName = {};
    const normColNameToActual = {};
    allColumnNames.forEach((c) => (normColNameToActual[normalize(c)] = c));
    (rd1 || []).forEach((g) => {
      const col = normColNameToActual[normalize(g.filtergroup)];
      if (col) byName[g.id] = col;
    });
    return byName;
  }, [rd1, allColumnNames]);

  const filteredRows = useMemo(() => {
    let rows = originalRows;
    const activeGroupIds = Object.keys(selectedAttrsByGroupId).filter(
      (gid) =>
        selectedAttrsByGroupId[gid] && selectedAttrsByGroupId[gid].length > 0
    );
    if (activeGroupIds.length > 0) {
      rows = rows.filter((row) => {
        for (const gid of activeGroupIds) {
          const colKey = groupIdToColumnKey[gid];
          if (!colKey) continue;

          const selectedAttrIds = selectedAttrsByGroupId[gid].map(Number);
          const rowVal = row[colKey];
          if (rowVal === undefined || rowVal === null) return false;

          const rowValNum = Number(rowVal);
          if (!Number.isNaN(rowValNum)) {
            if (!selectedAttrIds.includes(rowValNum)) return false;
          } else {
            const labels = selectedAttrIds.map((id) => idToAttr.get(id));
            if (
              !labels.some(
                (lbl) => normalize(String(rowVal)) === normalize(lbl)
              )
            ) {
              return false;
            }
          }
        }
        return true;
      });
    }

    if (searchText.trim() !== "") {
      const lower = searchText.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some(
          (val) => val && String(val).toLowerCase().includes(lower)
        )
      );
    }

    return rows;
  }, [
    originalRows,
    selectedAttrsByGroupId,
    groupIdToColumnKey,
    idToAttr,
    searchText,
  ]);

  useEffect(() => {
    const validGids = new Set(groupsForMain.map((g) => g.groupId));
    setSelectedAttrsByGroupId((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) {
        if (validGids.has(parseInt(k, 10))) next[k] = prev[k];
      }
      return next;
    });
  }, [groupsForMain]);

  return (
    <Box sx={{ p: 2 }}>
      {isLoading && (
        <Box sx={{ textAlign: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {status500 && (
        <Typography color="error" sx={{ mb: 2 }}>
          Something went wrong while fetching data.
        </Typography>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Main Group</InputLabel>
            <Select
              value={selectedMainGroupId}
              label="Main Group"
              onChange={(e) => setSelectedMainGroupId(e.target.value)}
            >
              {rd.map((mg) => (
                <MenuItem key={mg.id} value={mg.id}>
                  {mg.filtermaingroup}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {groupsForMain.map(({ groupId, groupName }) => (
            <FormControl key={groupId} size="small" sx={{ minWidth: 250 }}>
              <InputLabel>{groupName}</InputLabel>
              <Select
                multiple
                label={groupName}
                value={selectedAttrsByGroupId[groupId] ?? []}
                onChange={(e) =>
                  setSelectedAttrsByGroupId((prev) => ({
                    ...prev,
                    [groupId]: e.target.value,
                  }))
                }
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) return <em>All</em>;
                  const opts = (groupOptions[groupId] || []).filter((o) =>
                    selected.includes(o.attrId)
                  );
                  return opts.map((o) => o.attrName).join(", ");
                }}
              >
                {(groupOptions[groupId] || []).map((opt) => (
                  <MenuItem key={opt.attrId} value={opt.attrId}>
                    <Checkbox
                      checked={
                        selectedAttrsByGroupId[groupId]?.includes(opt.attrId) ||
                        false
                      }
                    />
                    {opt.attrName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
        <TextField
          sx={{ minWidth: 280 }}
          placeholder="Search..."
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchText && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchText("")} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </div>

      <Box sx={{ height: "calc(100vh - 220px)" }}>
        <DataGrid
          rows={filteredRows}
          columns={gridColumns}
          getRowId={(r) => r.id}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
          disableColumnMenu
          sx={{ "& .MuiDataGrid-menuIcon": { display: "none" } }}
        />
      </Box>
    </Box>
  );
}
