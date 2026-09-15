"use client";
import { useCallback } from "react";
import { format } from 'date-fns';
import _ from "lodash";
import { ApiService, FileApis } from "../services";

export default function useSignageApi(headers) {

      const apiService = new ApiService();
      const fileService = new FileApis()

      const fetchData = useCallback(async () => {
            apiService.setBaseMode("list");
            apiService.setBaseDesc("Tv Content (list)");
            const response = await apiService.executeApi(headers, {});
            if (response.success) {
                  const data = response.data.rd.map((item) => ({
                        id: item.TvSetId,
                        setName: item.SetName,
                        orientation: item.Orientation,
                        isDefault: item.IsDefault,
                        isActive: item.IsActive,
                        entryDate: item.EntryDate ? format(new Date(item.EntryDate), "dd MMM yyyy") : "",
                        files: !_.isEmpty(item.Files) ? JSON.parse(item.Files) : []
                  }));
                  return { success: true, data }
            } else {
                  return { success: false, message: response.message }
            }
      }, [headers]);

      const fetchUkey = useCallback(async () => {
            apiService.setBaseMode("fetch_key");
            apiService.setBaseDesc("Tv Content (Fetch Ukey)");
            const response = await apiService.executeApi(headers, {});
            if (response.success) {
                  return { success: true, data: response.data.rd[0]?.ukey }
            } else {
                  return { success: false, message: response.message }
            }
      }, [headers]);

      const deleteDisplayData = useCallback(async (row) => {
            apiService.setBaseMode("delete");
            apiService.setBaseDesc("Tv Content (delete)");
            let body = { TvSetId: row?.id ?? row?.TvSetId };
            const response = await apiService.executeApi(headers, body);
            return { success: response.success, message: response.message }
      }, [headers]);

      const deleteFileData = useCallback(async (row, ukey) => {
            apiService.setBaseMode("file_delete");
            apiService.setBaseDesc("Tv Content (file delete)");
            let body = { FileId: row.Id };
            const response = await apiService.executeApi(headers, body);
            if (response.success) {
                  await fileService.Remove(`${process.env.NEXT_PUBLIC_HTTP_URL + ukey + "/TV_APPS/" + row.FileName}`);
            }
            return { success: response.success, message: response.message }
      }, [headers]);

      const saveDisplayData = useCallback(async (body) => {
            apiService.setBaseMode("create");
            apiService.setBaseDesc("Tv Content (create)");
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const updateDisplayData = useCallback(async (body) => {
            apiService.setBaseMode("update");
            apiService.setBaseDesc("Tv Content (update)");
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const setDefaultRow = useCallback(async (body) => {
            apiService.setBaseMode("setisdefault");
            apiService.setBaseDesc("Tv Content (update is default)");
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const setActiveInActiveRow = useCallback(async (body) => {
            apiService.setBaseMode("setisactive");
            apiService.setBaseDesc("Tv Content (update is active)");
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const setDisplayOrder = useCallback(async (body) => {
            apiService.setBaseMode("setdisplayorder");
            apiService.setBaseDesc("Tv Content (Set display order)");
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const setFileDuration = useCallback(async (body) => {
            apiService.setBaseMode("update_file_duration");
            apiService.setBaseDesc("Tv Content File ( Duration Update)");
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const fetchLocationData = useCallback(async () => {
            apiService.setBaseMode("location_list");
            apiService.setBaseDesc("Tv Location (list)");
            const response = await apiService.executeApi(headers, {});
            if (response.success) {
                  const data = response.data.rd.map((item) => ({
                        id: item.Id,
                        title: item.Title,
                  }));
                  return { success: true, data }
            } else {
                  return { success: false, message: response.message }
            }
      }, [headers]);

      const saveLocationData = useCallback(async (data) => {
            apiService.setBaseMode("location_create");
            apiService.setBaseDesc("Tv Location (create)");
            const body = { Title: data.name };
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const updateLocationData = useCallback(async (id, data) => {
            apiService.setBaseMode("location_update");
            apiService.setBaseDesc("Tv Locaiton (update)");
            const body = { LocationId: id, Title: data.name };
            return await apiService.executeApi(headers, body);
      }, [headers]);

      const deleteLocationData = useCallback(async (row) => {
            apiService.setBaseMode("location_delete");
            apiService.setBaseDesc("Tv Locaiton (delete)");
            let body = { LocationId: row.id };
            return await apiService.executeApi(headers, body);
      }, [headers]);

      return {
            fetchData, fetchUkey, deleteDisplayData, deleteFileData,
            saveDisplayData, updateDisplayData, setDefaultRow, setActiveInActiveRow,
            setDisplayOrder, setFileDuration, fetchLocationData, deleteLocationData,
            saveLocationData, updateLocationData
      }
}