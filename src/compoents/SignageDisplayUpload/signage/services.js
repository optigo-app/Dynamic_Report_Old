import axios from "axios";

function getApiUrl() {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "nzen"
  ) {
    return "http://newnextjs.web/api/report";
  }
  return "https://apilx.optigoapps.com/api/report";
}

function getFileUploadUrl() {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "nzen"
  ) {
    return "http://newnextjs.web/api/upload";
  }
  return "https://apilx.optigoapps.com/api/upload";
}

export class ApiService {
  constructor() {
    this.mode = "";
    this.desc = "";
  }

  setBaseMode(mode) {
    this.mode = mode;
  }

  setBaseDesc(desc) {
    this.desc = desc;
  }

  async executeApi(headers, body) {
    try {
      const token = sessionStorage.getItem("Token") || "";
      const requestHeaders = {
        Authorization: `Bearer ${token}`,
        Yearcode: headers?.yearcode || "",
        version: headers?.version || "v4",
        sv: headers?.sv || "0",
        sp: headers?.sp || "20",
      };

      const payload = {
        con: JSON.stringify({ id: "", mode: this.mode }),
        p: JSON.stringify(body || {}),
        f: this.desc,
      };

      const url = getApiUrl();
      const response = await axios.post(url, payload, { headers: requestHeaders });
      const respData = response?.data || {};

      return {
        success: true,
        message: respData?.Message || "OK",
        data: respData?.Data ? { rd: respData.Data?.rd } : respData,
      };
    } catch (error) {
      console.error("executeApi error:", error);
      return {
        success: false,
        message: error?.response?.data?.Message || error.message || "API call failed",
        data: {},
      };
    }
  }
}

export class FileApis {
  async Upload(formData) {
    try {
      const token = sessionStorage.getItem("Token") || "";
      const response = await axios.post(getFileUploadUrl(), formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, files: response?.data?.files || [] };
    } catch (error) {
      console.error("File upload error:", error);
      return { success: false, message: error.message || "Upload failed" };
    }
  }

  async Remove(fileUrl) {
    try {
      const token = sessionStorage.getItem("Token") || "";
      const response = await axios.delete(fileUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response?.data };
    } catch (error) {
      console.error("File remove error:", error);
      return { success: false, message: error.message || "Remove failed" };
    }
  }
}
