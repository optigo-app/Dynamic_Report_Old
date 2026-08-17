// websiteManagementApi.js
import axios from "axios";

const APIURL =
  window.location.hostname === "localhost" || window.location.hostname === "nzen"
    ? "http://newnextjs.web/api/report"
    : "https://apilx.optigoapps.com/api/report";

const CommonAPI = async (body) => {
  const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));

  const headers = {
    Yearcode: `${AllData?.yc}`,
    version: "v1",
    sv: `${AllData?.sv}`,
    sp: 217,
  };

  try {
    const response = await axios.post(APIURL, body, { headers });
    return response?.data;
  } catch (error) {
    console.error("API error is:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// -------------------------------------------------------------
// GETWEBSITEDATA - list of websites for the company, now includes
// IsActive + ConfiguredBannerTypeIds (comma separated string)
// -------------------------------------------------------------
export const getWebsiteData = (companyDbName) =>
  CommonAPI({
    con: JSON.stringify({ mode: "GETWEBSITEDATA", appuserid: "", IPAddress: "" }),
    p: JSON.stringify({ CompanyDbName: companyDbName }),
    f: "GETWEBSITEDATA",
  });

// -------------------------------------------------------------
// GETBANNERTYPECONFIG - fetch selected banner type ids for one website
// -------------------------------------------------------------
export const getBannerTypeConfig = (websiteId) =>
  CommonAPI({
    con: JSON.stringify({ mode: "GETBANNERTYPECONFIG", appuserid: "", IPAddress: "" }),
    p: JSON.stringify({ WebsiteId: websiteId }),
    f: "GETBANNERTYPECONFIG",
  });

// -------------------------------------------------------------
// SAVEBANNERTYPECONFIG - save the checked banner type ids for one website
// bannerTypeIds: array of numbers, e.g. [1, 3, 5]
// -------------------------------------------------------------
export const saveBannerTypeConfig = (websiteId, bannerTypeIds) =>
  CommonAPI({
    con: JSON.stringify({ mode: "SAVEBANNERTYPECONFIG", appuserid: "", IPAddress: "" }),
    p: JSON.stringify({ WebsiteId: websiteId, BannerTypeIds: bannerTypeIds.join(",") }),
    f: "SAVEBANNERTYPECONFIG",
  });

// -------------------------------------------------------------
// UPDATEWEBSITESTATUS - toggle a website's active/inactive flag
// -------------------------------------------------------------
export const updateWebsiteStatus = (websiteId, isActive) =>
  CommonAPI({
    con: JSON.stringify({ mode: "UPDATEWEBSITESTATUS", appuserid: "", IPAddress: "" }),
    p: JSON.stringify({ WebsiteId: websiteId, IsActive: isActive ? 1 : 0 }),
    f: "UPDATEWEBSITESTATUS",
  });

export default CommonAPI;