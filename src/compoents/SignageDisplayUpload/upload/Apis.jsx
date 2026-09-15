"use client";
import { ApiService } from "@/services/api";
import { FileApis } from "@/services/file";
import { useCallback } from "react";

export default function useUploadApis(headers, loginData) {
    const apiService = new ApiService();
    const fileService = new FileApis();

    apiService.setBaseData({
        appuserid: loginData?.UserId || "", 
        IPAddress: loginData?.IpAddress || "", 
        domain: loginData?.Domain || ""
    });

    const getToken = useCallback(async (UploadType = '') => {
        const body = { UploadType };
        apiService.setBaseMode("gettoken");
        apiService.setBaseDesc("Image Upload Master (gettoken)");
        return await apiService.executeApi(headers, body);
    }, [headers]);
    
    const checkAuthorization = useCallback(async (PageId = 0) => {
        const body = { PageId };
        apiService.setBaseMode("page_rights");
        apiService.setBaseDesc("Image Upload Master (page_rights)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const addImages = useCallback(async (body) => {
        apiService.setBaseMode("upload_images");
        apiService.setBaseDesc("Image Upload Master (addJobImages)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const addJobImages = useCallback(async (body) => {
        apiService.setBaseMode("job_img_upload");
        apiService.setBaseDesc("Image Upload Master (job_img_upload)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const addDesignImages = useCallback(async (body) => {
        apiService.setBaseMode("design_img_upload");
        apiService.setBaseDesc("Image Upload Master (design_img_upload)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const getImages = useCallback(async (UploadType = '') => {
        const body = { UploadType };
        apiService.setBaseMode("list");
        apiService.setBaseDesc("Image Upload Master (list)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const getJobImages = useCallback(async (JobNo = '', ColorName='') => {
        const body = { JobNo, ColorName };
        apiService.setBaseMode("job_img_list");
        apiService.setBaseDesc("Image Upload Master (job_img_list)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const getDesignImages = useCallback(async (DesignNo = '', ColorName='') => {
        const body = { DesignNo, ColorName };
        apiService.setBaseMode("design_img_list");
        apiService.setBaseDesc("Image Upload Master (design_img_list)");
        return await apiService.executeApi(headers, body);
    }, [headers]);
    
    const deleteImages = useCallback(async (body) => {
        apiService.setBaseMode("delete");
        apiService.setBaseDesc("Image Upload Master (delete)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const deleteJobImages = useCallback(async (body) => {
        apiService.setBaseMode("job_img_delete");
        apiService.setBaseDesc("Image Upload Master (job_img_delete)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const deleteDesignImages = useCallback(async (body) => {
        apiService.setBaseMode("design_img_delete");
        apiService.setBaseDesc("Image Upload Master (design_img_delete)");
        return await apiService.executeApi(headers, body);
    }, [headers]);

    const applyImage = useCallback(async () => {
        apiService.setBaseMode("job_apply");
        apiService.setBaseDesc("Image Upload Master (job_apply)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const applyFindingImage = useCallback(async () => {
        apiService.setBaseMode("finding_apply");
        apiService.setBaseDesc("Image Upload Master (finding_apply)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const applyDiamondImage = useCallback(async () => {
        apiService.setBaseMode("diamond_apply");
        apiService.setBaseDesc("Image Upload Master (diamond_apply)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const applyColorstoneImage = useCallback(async () => {
        apiService.setBaseMode("colorstone_apply");
        apiService.setBaseDesc("Image Upload Master (colorstone_apply)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const applyMiscImage = useCallback(async () => {
        apiService.setBaseMode("misc_apply");
        apiService.setBaseDesc("Image Upload Master (misc_apply)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const applyDesignImage = useCallback(async () => {
        apiService.setBaseMode("design_apply");
        apiService.setBaseDesc("Image Upload Master (design_apply)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const getJobs = useCallback(async () => {
        apiService.setBaseMode("job_master");
        apiService.setBaseDesc("Image Upload Master (joblist)");
        return await apiService.executeApi(headers);
    }, [headers]);

    const getDesign = useCallback(async () => {
        apiService.setBaseMode("design_master");
        apiService.setBaseDesc("Image Upload Master (design_master)");
        return await apiService.executeApi(headers);
    }, [headers]);
    
    const unlinkFiles = useCallback(async (files) => {
        return await fileService.Remove(files);
    }, [headers]);

    const renameFiles = useCallback(async (data) => {
        return await fileService.Rename(data);
    }, [headers]);

    const moveFiles = useCallback(async (data) => {
        return await fileService.Move(data);
    }, [headers]);

    return { 
        getToken, addImages, addJobImages, getImages, getJobImages, getDesignImages, deleteJobImages, checkAuthorization,
        deleteDesignImages, getJobs, getDesign, deleteImages, applyImage, applyFindingImage, applyDiamondImage,
        applyColorstoneImage, applyMiscImage, applyDesignImage, unlinkFiles, renameFiles, moveFiles,
        addDesignImages
    };
}