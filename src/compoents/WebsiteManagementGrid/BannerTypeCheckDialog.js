"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BANNER_TYPES } from "./bannerTypes";
import "./BannerTypeCheckDialog.scss";
import { getBannerTypeConfig, saveBannerTypeConfig } from "./websiteManagementApi";

const BannerTypeCheckDialog = ({ open, onClose, websiteId, websiteName, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);

  useEffect(() => {
    if (!open || !websiteId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getBannerTypeConfig(websiteId);
        const rows = res?.Data?.rd || res?.Data?.DT || [];

        if (res?.Data?.stat === 0) {
          console.error("Load banner type config failed:", res?.Data?.stat_msg);
          setCheckedIds([]);
        } else {
          // rows[0].BannerConfigJson is a JSON STRING like
          // '{"activeBannerTypeIds":[1,2,3,4]}' — not an array of banner rows.
          let ids = [];
          const raw = rows?.[0]?.BannerConfigJson;
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              ids = Array.isArray(parsed?.activeBannerTypeIds)
                ? parsed.activeBannerTypeIds.map(Number)
                : [];
            } catch (parseErr) {
              console.error("BannerConfigJson parse error:", parseErr);
            }
          }
          setCheckedIds(ids);
        }
      } catch (err) {
        console.error("Load banner type config error:", err);
        setCheckedIds([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, websiteId]);

  const handleToggle = (bannerTypeId) => {
    setCheckedIds((prev) =>
      prev.includes(bannerTypeId)
        ? prev.filter((id) => id !== bannerTypeId)
        : [...prev, bannerTypeId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveBannerTypeConfig(websiteId, checkedIds);
      if (res?.Data?.stat === 0) {
        console.error("Save banner type config failed:", res?.Data?.stat_msg);
        return;
      }
      onSaved?.(websiteId, checkedIds);
      onClose();
    } catch (err) {
      console.error("Save banner type config error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" className="banner_type_check_dialog">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          Banner List
          {websiteName && (
            <span className="banner_type_check_dialog__subtitle">{websiteName}</span>
          )}
        </div>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <div className="banner_type_check_dialog__loading">
            <CircularProgress size={24} />
          </div>
        ) : (
          <FormGroup>
            {BANNER_TYPES.map((type) => (
              <FormControlLabel
                key={type.BannerTypeId}
                control={
                  <Checkbox
                    checked={checkedIds.includes(type.BannerTypeId)}
                    onChange={() => handleToggle(type.BannerTypeId)}
                  />
                }
                label={type.TypeName}
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BannerTypeCheckDialog;