// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18573

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Switch,
} from "@mui/material";
import { Globe, Calendar, Layers, Code2, ImagePlus } from "lucide-react";
import "./WebsiteManagementGrid.scss";
import axios from "axios";
import BannerTypeCheckDialog from "./BannerTypeCheckDialog";
import { getWebsiteData, updateWebsiteStatus } from "./websiteManagementApi";

const WebsiteManagementGrid = () => {
  const [ready, setReady] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [companyDbName, setCompanyDbName] = useState();

  const [websiteList, setWebsiteList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeWebsite, setActiveWebsite] = useState(null);
  const [configMap, setConfigMap] = useState({});     // { [websiteId]: [bannerTypeId, ...] }
  const [statusMap, setStatusMap] = useState({});      // { [websiteId]: true | false }
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);


  //   useEffect(() => {
  //   sessionStorage.setItem("5F383721-FC33-F111-B3AE-F875A496BA9D", JSON?.stringify({
  //   "tkn": "OTA2NTQ3MTcwMDUzNTY1MQ==",
  //   "pid": 18531,
  //   "IsEmpLogin": 0,
  //   "IsPower": 2,
  //   "SpNo": "MA==",
  //   "SpVer": "",
  //   "SV": "MA==",
  //   "LId": "MTAyMA==",
  //   "LUId": "dGVzdEBuemVuLmNvbQ==",
  //   "DAU": "aHR0cDovL256ZW4vam8vYXBpLWxpYi9BcHAvQ2VudHJhbEFwaQ==",
  //   "YearCode": "e3tuemVufX17ezIwfX17e29yYWlsMjV9fXt7b3JhaWwyNX19",
  //   "cuVer": "UjUwQjM=",
  //   "rptapiurl": "aHR0cDovL25ld25leHRqcy53ZWIvYXBpL3JlcG9ydA==",
  //   "dxver": "YmV0YQ=="
  //   }))
  //   window.location.replace("http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18573&CN=UkRTRF8yMDI2MDQwOTEwMDkwOV9iZGIzY2Y1NjRiNDc0NWJmYWY4NjNkYjBhZmI2MzZmNg==&pid=18333&Token=5F383721-FC33-F111-B3AE-F875A496BA9D");
  // }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNewToken(params.get("Token"));
  }, []);

  useEffect(() => {
    if (newToken === null) return;

    const initialize = async () => {
      if (!newToken) {
        console.error("No token found");
        setReady(true);
        return;
      }

      try {
        let parsedData;
        const storedJson = sessionStorage.getItem(newToken);

        if (storedJson) {
          parsedData = JSON.parse(storedJson);
          if (parsedData?.LUId) parsedData.LUId = atob(parsedData.LUId);
          sessionStorage.setItem("reportVarible", JSON.stringify(parsedData));
        } else {
          const tokenApiUrl =
            ["localhost", "nzen", "assetmanagement.web"].includes(
              window.location.hostname
            )
              ? "http://nzen/jo/api-lib/App/CentralCrossDomainToken"
              : "https://vw.optigoapps.com/linkedapp/App/CentralCrossDomainToken";

          const tokenResponse = await axios.post(tokenApiUrl, {
            ReqData: `[{"ForEvt":"GetTokenVal","Token":"${newToken}"}]`,
          });

          const tokenData = tokenResponse?.data?.Data?.DT?.[0];
          if (!tokenData?.JsonData || !tokenData?.Token) {
            console.error("Invalid token response");
            setReady(true);
            return;
          }

          parsedData = JSON.parse(tokenData.JsonData);
          if (parsedData?.LUId) parsedData.LUId = atob(parsedData.LUId);

          sessionStorage.setItem(newToken, JSON.stringify(parsedData));
          sessionStorage.setItem("reportVarible", JSON.stringify(parsedData));
        }

        const tkn = parsedData?.tkn;
        if (!tkn) {
          setReady(true);
          return;
        }

        const decodedKey = atob(tkn);
        const clientIpAddress = sessionStorage.getItem("clientIpAddress") || "";

        const body = {
          con: JSON.stringify({
            mode: "getCompanyMaster",
            appuserid: parsedData?.LUId,
            IPAddress: clientIpAddress,
          }),
          p: JSON.stringify({}),
          f: "getCompanyMaster",
        };

        const headers = {
          Yearcode: "",
          version: "v1",
          sv: "0",
          sp: 196,
        };

        const reportApiUrl =
          ["localhost", "nzen", "assetmanagement.web"].includes(
            window.location.hostname
          )
            ? "http://newnextjs.web/api/report"
            : "https://apilx.optigoapps.com/api/report";

        const response = await axios.post(reportApiUrl, body, { headers });
        const rd = response?.data?.Data?.rd || [];

        const matched = rd.find((c) => String(c.dbUniqueKey) === String(decodedKey));

        if (matched?.dbname) {
          setCompanyDbName(matched.dbname);
          sessionStorage.setItem("useruploadkey", matched?.uKey);
        }

        setReady(true);
      } catch (err) {
        console.error("Initialization error:", err);
        setReady(true);
      }
    };

    initialize();
  }, [newToken]);

  // GETWEBSITEDATA - now also seeds statusMap / configMap from the
  // IsActive + ConfiguredBannerTypeIds fields returned by the SP
  useEffect(() => {
    if (!companyDbName) return;

    const fetchWebsiteData = async () => {
      setListLoading(true);
      setListError("");
      try {
        const res = await getWebsiteData(companyDbName);
        const rows = res?.Data?.rd || res?.Data?.DT || [];

        if (res?.Data?.stat === 0) {
          setListError(res?.Data?.stat_msg || "Failed to load website data.");
          setWebsiteList([]);
          return;
        }

        const list = Array.isArray(rows) ? rows : [];
        setWebsiteList(list);

        const nextStatusMap = {};
        const nextConfigMap = {};
        list.forEach((row) => {
          nextStatusMap[row.id] = row.IsActive === undefined ? true : !!row.IsActive;
          nextConfigMap[row.id] = row.ConfiguredBannerTypeIds
            ? String(row.ConfiguredBannerTypeIds)
                .split(",")
                .filter(Boolean)
                .map(Number)
            : [];
        });
        setStatusMap(nextStatusMap);
        setConfigMap(nextConfigMap);
      } catch (err) {
        console.error("GETWEBSITEDATA error:", err);
        setListError("Failed to load website data.");
      } finally {
        setListLoading(false);
      }
    };

    fetchWebsiteData();
  }, [companyDbName]);

  const handleOpenBannerDialog = (row) => {
    setActiveWebsite(row);
    setDialogOpen(true);
  };

  const handleDialogSaved = (websiteId, bannerTypeIds) => {
    setConfigMap((prev) => ({ ...prev, [websiteId]: bannerTypeIds }));
  };

  const handleToggleStatus = async (row) => {
    const currentIsActive = statusMap[row.id] ?? true;
    const nextIsActive = !currentIsActive;

    setStatusUpdatingId(row.id);
    // optimistic update
    setStatusMap((prev) => ({ ...prev, [row.id]: nextIsActive }));

    try {
      const res = await updateWebsiteStatus(row.id, nextIsActive);
      if (res?.Data?.stat === 0) {
        // revert on failure
        setStatusMap((prev) => ({ ...prev, [row.id]: currentIsActive }));
        console.error("Update website status failed:", res?.Data?.stat_msg);
      }
    } catch (err) {
      // revert on error
      setStatusMap((prev) => ({ ...prev, [row.id]: currentIsActive }));
      console.error("Update website status error:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <Box className="website-mgmt">
      <Paper className="website-mgmt__header" elevation={0}>
        <Globe size={20} />
        <Typography variant="h6" className="website-mgmt__title">
          Website Management
        </Typography>
      </Paper>

      {listLoading && (
        <Box className="website-mgmt__loading">
          <CircularProgress size={28} />
        </Box>
      )}

      {!listLoading && listError && (
        <Typography className="website-mgmt__error">{listError}</Typography>
      )}

      {!listLoading && !listError && (
        <Box className="website-mgmt__grid">
          {websiteList.length === 0 ? (
            <Typography className="website-mgmt__empty">No websites found.</Typography>
          ) : (
            websiteList.map((row) => {
              const isConfigured = (configMap[row.id]?.length || 0) > 0;
              const isActive = statusMap[row.id] ?? true; // default Active if no row yet

              return (
                <Card key={row.id} className={`website-box ${!isActive ? "website-box--inactive" : ""}`}>
                  <CardContent className="website-box__content">
                    <div className="website-box__top">
                      <Typography className="website-box__domain" title={row.DomainName}>
                        {row.DomainName}
                      </Typography>
                      <Chip size="small" label={row.DomainFor} className="website-box__chip" />
                    </div>

                    <Typography className="website-box__ecom">
                      {row.EcommerceName || "-"}
                    </Typography>

                    <div className="website-box__meta">
                      <span className="website-box__meta-item">
                        <Layers size={14} />
                        Theme {row.Themeno}
                      </span>
                      <span className="website-box__meta-item">
                        <Code2 size={14} />
                        {row.SpVersion}
                      </span>
                    </div>

                    <div className="website-box__footer">
                      <Calendar size={13} />
                      <span>
                        {row.Entrydate ? new Date(row.Entrydate).toLocaleDateString() : "-"}
                      </span>
                    </div>

                    <div className="website-box__actions">
                      <Button
                        className="website-box__banner-btn"
                        startIcon={<ImagePlus size={16} />}
                        disabled={!isActive}
                        title={!isActive ? "Activate this website to manage banners" : ""}
                        onClick={() => handleOpenBannerDialog(row)}
                      >
                        {isConfigured ? "Edit Banner" : "Add Banner"}
                      </Button>

                      <div className="website-box__status">
                        <span className={`website-box__status-label ${isActive ? "is-active" : "is-inactive"}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          size="small"
                          checked={isActive}
                          disabled={statusUpdatingId === row.id}
                          onChange={() => handleToggleStatus(row)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      )}

      <BannerTypeCheckDialog
        open={dialogOpen}
        websiteId={activeWebsite?.id}
        websiteName={activeWebsite?.DomainName}
        onClose={() => setDialogOpen(false)}
        onSaved={handleDialogSaved}
      />
    </Box>
  );
};

export default WebsiteManagementGrid;