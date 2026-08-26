import axios from "axios";

const API_URL = "http://newnextjs.web/api/report";
// const API_URL = "https://apix.optigoapps.com/api/report


const sv = process.env.NODE_ENV === "production" ? "1" : "0";
const version = "beta";
const sp = "230";

export const GetActiveProcatTheme = async ({ domainName, yearCode }) => {
  try {
    const body = {
      con: JSON.stringify({
        mode: "gettheme",
        appuserid: "admin@orail.co.in",
        IPAddress: "",
        FormName: "DynamicReport ( data )",
      }),
      p: JSON.stringify({
        domain_name: domainName,
      }),
      f: "GetThemeActiveProcatTheme ( data )",
    };

    const { data } = await axios.post(API_URL, body, {
      headers: {
        "Content-Type": "application/json",
        Yearcode: 'e3tuemVufX17ezIwfX17e2RlbW9zdG9yZX19e3tkZW1vc3RvcmV9fQ==' || yearCode,
        sp,
        sv,
        version,
      },
    });

    if (data?.Data?.rd?.length) {
      const theme = data?.Data?.rd?.filter(theme => theme?.domain_name === "procatalog.web");
      return theme.length ? theme[0] : null;
    }

    throw new Error("Theme not found.");
  } catch (error) {
    console.error("Error fetching theme:", error);
    throw error;
  }
};

export const GetAllProcatMasterThemes = async ({ yearCode } = {}) => {
  try {
    const body = {
      con: JSON.stringify({
        mode: "getmasterthemes",
        appuserid: "admin@orail.co.in",
        IPAddress: "",
        FormName: "DynamicReport ( data )",
      }),
      p: JSON.stringify({}),
      f: "GetThemeActiveProcatTheme ( data )",
    };

    const { data } = await axios.post(API_URL, body, {
      headers: {
        "Content-Type": "application/json",
        Yearcode: 'e3tuemVufX17ezIwfX17e2RlbW9zdG9yZX19e3tkZW1vc3RvcmV9fQ==' || yearCode,
        sp,
        sv,
        version,
      },
    });

    if (data?.Data?.rd?.length) {
      const firstRow = data.Data.rd[0];
      if (firstRow?.stat === 0 || firstRow?.stat_msg) {
        console.warn("GetAllProcatMasterThemes warning:", firstRow?.stat_msg);
        return [];
      }
      return data.Data.rd;
    }

    return [];
  } catch (error) {
    console.error("Error fetching master themes:", error);
    return [];
  }
};

export const ApplyProcatTheme = async ({ domainName, themeId, backupName, storeId, yearCode, customTheme }) => {
  try {
    const body = {
      con: JSON.stringify({
        mode: "applytheme",
        appuserid: "admin@orail.co.in",
        IPAddress: "",
        FormName: "DynamicReport ( data )",
      }),
      p: JSON.stringify({
        domain_name: domainName,
        store_id: storeId,
        theme_id: themeId,
        backup_name: backupName,
        ...customTheme,
      }),
      f: "GetThemeActiveProcatTheme ( data )",
    };

    const { data } = await axios.post(API_URL, body, {
      headers: {
        "Content-Type": "application/json",
        Yearcode: 'e3tuemVufX17ezIwfX17e2RlbW9zdG9yZX19e3tkZW1vc3RvcmV9fQ==' || yearCode,
        sp,
        sv,
        version,
      },
    });

    return data?.Data?.rd?.[0] || data;
  } catch (error) {
    console.error("Error applying theme:", error);
    throw error;
  }
};

export const GetProcatThemeBackups = async ({ domainName, yearCode }) => {
  try {
    const body = {
      con: JSON.stringify({
        mode: "getthemebackups",
        appuserid: "admin@orail.co.in",
        IPAddress: "",
        FormName: "DynamicReport ( data )",
      }),
      p: JSON.stringify({
        domain_name: domainName,
      }),
      f: "GetThemeActiveProcatTheme ( data )",
    };

    const { data } = await axios.post(API_URL, body, {
      headers: {
        "Content-Type": "application/json",
        Yearcode: 'e3tuemVufX17ezIwfX17e2RlbW9zdG9yZX19e3tkZW1vc3RvcmV9fQ==' || yearCode,
        sp,
        sv,
        version,
      },
    });

    return data?.Data?.rd || [];
  } catch (error) {
    console.error("Error fetching theme backups:", error);
    throw error;
  }
};

export const RestoreProcatThemeBackup = async ({ backupId, yearCode }) => {
  try {
    const body = {
      con: JSON.stringify({
        mode: "restorethemebackup",
        appuserid: "admin@orail.co.in",
        IPAddress: "",
        FormName: "DynamicReport ( data )",
      }),
      p: JSON.stringify({
        backup_id: backupId,
      }),
      f: "GetThemeActiveProcatTheme ( data )",
    };

    const { data } = await axios.post(API_URL, body, {
      headers: {
        "Content-Type": "application/json",
        Yearcode: 'e3tuemVufX17ezIwfX17e2RlbW9zdG9yZX19e3tkZW1vc3RvcmV9fQ==' || yearCode,
        sp,
        sv,
        version,
      },
    });

    return data?.Data?.rd?.[0] || data;
  } catch (error) {
    console.error("Error restoring theme backup:", error);
    throw error;
  }
};


