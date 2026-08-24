// http://localhost:3000/testreport/?sp=9&ifid=AdvanceCRM&pid=18599


import React, { useMemo, useState } from "react";
import "./CombinationMaker.scss";
import masterData from "./CombinationMaker.json";
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Database,
  FileEdit,
  Files,
  BarChart3,
  Settings,
  Eye,
  Pencil,
  Trash2,
  X,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Users,
  Gem,
  Save,
  Sparkles,
  CheckCircle2,
  Download,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

const GEN_CAP = 5000;

const emptyForm = () => ({
  id: null,
  name: "",
  category: "",
  gender: "",
  description: "",
  displayOrder: 10,
  selections: {},
});

const CombinationMaker = () => {
  const { attributeGroups, categories, genders } = masterData;

  const [sets, setSets] = useState(masterData.sets || []);
  const [view, setView] = useState("dashboard"); // dashboard | builder | combinations
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [combos, setCombos] = useState([]);
  const [editingCombo, setEditingCombo] = useState(null); // combo edit modal (image 1)
  const [confirm, setConfirm] = useState(null); // { count } before continue
  const [toast, setToast] = useState("");
  const [readOnly, setReadOnly] = useState(false); // view existing set combinations

  /* ── helpers ───────────────────────────────── */
  const groupById = useMemo(() => {
    const m = {};
    attributeGroups.forEach((g) => (m[g.id] = g));
    return m;
  }, [attributeGroups]);

  const optName = (groupId, optId) => {
    const g = groupById[groupId];
    const o = g?.options.find((x) => x.id === optId);
    return o ? o.name : optId;
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name || id;

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const selectedCount = (groupId) => (form.selections[groupId] || []).length;

  const totalCombinations = useMemo(() => {
    const counts = attributeGroups
      .map((g) => (form.selections[g.id] || []).length)
      .filter((n) => n > 0);
    if (!counts.length) return 0;
    return counts.reduce((a, b) => a * b, 1);
  }, [form.selections, attributeGroups]);

  /* ── set / builder actions ─────────────────── */
  const startNewSet = () => {
    setReadOnly(false);
    setForm(emptyForm());
    setCombos([]);
    setView("builder");
  };

  const formFromSet = (set) => ({
    id: set.id,
    name: set.name,
    category: set.category,
    gender: set.gender || "",
    description: set.description || "",
    displayOrder: set.displayOrder || 10,
    selections: JSON.parse(JSON.stringify(set.selections || {})),
  });

  const editSet = (set) => {
    setReadOnly(false);
    setForm(formFromSet(set));
    setCombos([]);
    setView("builder");
  };

  const viewSet = (set) => {
    const f = formFromSet(set);
    setReadOnly(true);
    setForm(f);
    setCombos(buildCombinations(f));
    setView("combinations");
  };

  const deleteSet = (id) => {
    setSets((prev) => prev.filter((s) => s.id !== id));
    flash("Combination set deleted.");
  };

  const toggleOption = (groupId, optId) => {
    setForm((prev) => {
      const cur = prev.selections[groupId] || [];
      const next = cur.includes(optId)
        ? cur.filter((x) => x !== optId)
        : [...cur, optId];
      return { ...prev, selections: { ...prev.selections, [groupId]: next } };
    });
  };

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  /* ── generate combinations (cartesian product) ─ */
  const buildCombinations = (f = form) => {
    const activeGroups = attributeGroups.filter(
      (g) => (f.selections[g.id] || []).length > 0
    );
    let rows = [{}];
    for (const g of activeGroups) {
      const next = [];
      for (const row of rows) {
        for (const optId of f.selections[g.id]) {
          next.push({ ...row, [g.id]: optId });
        }
      }
      rows = next;
      if (rows.length > GEN_CAP) {
        rows = rows.slice(0, GEN_CAP);
        break;
      }
    }
    return rows.map((values, i) => ({
      id: `cmb-${Date.now()}-${i}`,
      name: `${f.name || "Combination"} #${i + 1}`,
      category: f.category,
      gender: f.gender,
      displayOrder: (i + 1) * 10,
      values,
    }));
  };

  const handleCreateCombine = () => {
    if (!form.name.trim()) return flash("Please enter a Set Name.");
    if (!form.category) return flash("Please select a Category.");
    if (totalCombinations === 0)
      return flash("Select at least one attribute option.");
    setConfirm({ count: totalCombinations });
  };

  const continueToCombinations = () => {
    setReadOnly(false);
    setCombos(buildCombinations());
    setConfirm(null);
    setView("combinations");
  };

  const deleteCombo = (id) =>
    setCombos((prev) => prev.filter((c) => c.id !== id));

  const bulkDeleteCombos = (ids) => {
    setCombos((prev) => prev.filter((c) => !ids.includes(c.id)));
    flash(`${ids.length} combination(s) deleted.`);
  };

  const saveComboEdit = (updated, addNew) => {
    setCombos((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = updated;
      if (addNew) {
        copy.splice(idx + 1, 0, {
          ...updated,
          id: `cmb-${Date.now()}`,
          name: `${form.name || "Combination"} #${prev.length + 1}`,
          displayOrder: updated.displayOrder + 10,
        });
      }
      return copy;
    });
    setEditingCombo(null);
    flash(addNew ? "Combination saved & new added." : "Combination updated.");
  };

  const saveSet = () => {
    const payload = {
      id: form.id || `set-${Date.now()}`,
      name: form.name,
      category: form.category,
      gender: form.gender,
      description: form.description,
      displayOrder: form.displayOrder,
      status: "Active",
      createdDate: new Date().toISOString().slice(0, 10),
      combinationCount: combos.length,
      selections: form.selections,
    };
    setSets((prev) => {
      const idx = prev.findIndex((s) => s.id === payload.id);
      if (idx === -1) return [payload, ...prev];
      const copy = [...prev];
      copy[idx] = payload;
      return copy;
    });
    flash("Combination set saved successfully.");
    setView("dashboard");
  };

  /* ── derived dashboard stats ───────────────── */
  const stats = useMemo(() => {
    const totalSets = sets.length;
    const activeSets = sets.filter((s) => s.status === "Active").length;
    const totalCombos = sets.reduce(
      (a, s) => a + (s.combinationCount || 0),
      0
    );
    return {
      totalSets,
      activeSets,
      totalCombos,
      totalArticles: totalCombos * 8,
    };
  }, [sets]);

  const filteredSets = sets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── sidebar ───────────────────────────────── */
  const menu = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "combination", label: "Combination Set", icon: Layers },
    { key: "create", label: "Create Set", icon: PlusCircle, sub: true },
    { key: "master", label: "Set Master", icon: Database },
    { key: "article", label: "Article Creation", icon: FileEdit },
    { key: "created", label: "Created Articles", icon: Files },
    { key: "reports", label: "Reports", icon: BarChart3 },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const activeMenu =
    view === "builder" || view === "combinations" ? "create" : "combination";

  const onMenu = (key) => {
    if (key === "create") return startNewSet();
    if (key === "dashboard" || key === "combination") return setView("dashboard");
  };

  return (
    <div className="cmb_app">
      {/* ── Sidebar ── */}
      <aside className="cmb_sidebar">
        <div className="cmb_brand">
          <div className="cmb_brand_logo">
            <Gem size={18} />
          </div>
          <span>Combination Maker</span>
        </div>
        <nav className="cmb_nav">
          {menu.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                className={`cmb_nav_item ${m.sub ? "sub" : ""} ${
                  activeMenu === m.key ? "active" : ""
                }`}
                onClick={() => onMenu(m.key)}
              >
                <Icon size={16} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="cmb_main">
        {view === "dashboard" && (
          <DashboardView
            stats={stats}
            sets={filteredSets}
            search={search}
            setSearch={setSearch}
            onCreate={startNewSet}
            onEdit={editSet}
            onDelete={deleteSet}
            onView={viewSet}
            catName={catName}
          />
        )}

        {view === "builder" && (
          <BuilderView
            form={form}
            setField={setField}
            categories={categories}
            genders={genders}
            attributeGroups={attributeGroups}
            selectedCount={selectedCount}
            toggleOption={toggleOption}
            total={totalCombinations}
            onBack={() => setView("dashboard")}
            onCreateCombine={handleCreateCombine}
          />
        )}

        {view === "combinations" && (
          <CombinationsView
            form={form}
            combos={combos}
            attributeGroups={attributeGroups}
            optName={optName}
            catName={catName}
            onBack={() => setView(readOnly ? "dashboard" : "builder")}
            onEdit={setEditingCombo}
            onDelete={deleteCombo}
            onBulkDelete={bulkDeleteCombos}
            onSave={saveSet}
            readOnly={readOnly}
          />
        )}
      </main>

      {/* ── Confirm generate modal ── */}
      {confirm && (
        <div className="cmb_overlay" onClick={() => setConfirm(null)}>
          <div className="cmb_confirm" onClick={(e) => e.stopPropagation()}>
            <div className="cmb_confirm_icon">
              <Sparkles size={26} />
            </div>
            <h3>Generate Combinations</h3>
            <p>
              This will generate <b>{confirm.count.toLocaleString()}</b>{" "}
              combinations for <b>{form.name}</b>.
            </p>
            <div className="cmb_confirm_actions">
              <button className="cmb_btn ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button className="cmb_btn primary" onClick={continueToCombinations}>
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Single combination edit modal (image 1) ── */}
      {editingCombo && (
        <ComboEditModal
          combo={editingCombo}
          form={form}
          attributeGroups={attributeGroups}
          groupById={groupById}
          categories={categories}
          genders={genders}
          onClose={() => setEditingCombo(null)}
          onSave={saveComboEdit}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="cmb_toast">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   DASHBOARD VIEW  (Image 3)
   ════════════════════════════════════════════════ */
const DashboardView = ({
  stats,
  sets,
  search,
  setSearch,
  onCreate,
  onEdit,
  onDelete,
  onView,
  catName,
}) => {
  const cards = [
    { label: "Total Sets", value: stats.totalSets, icon: Users, cls: "violet" },
    { label: "Active Sets", value: stats.activeSets, icon: Boxes, cls: "green" },
    {
      label: "Total Combinations",
      value: stats.totalCombos.toLocaleString(),
      icon: Layers,
      cls: "blue",
    },
    {
      label: "Total Articles",
      value: stats.totalArticles.toLocaleString(),
      icon: Files,
      cls: "orange",
    },
  ];
  return (
    <div className="cmb_page">
      <div className="cmb_page_head">
        <span className="cmb_step_badge">1</span>
        <h2>Combination Set Dashboard</h2>
      </div>

      <div className="cmb_stat_grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`cmb_stat_card ${c.cls}`}>
              <div className="cmb_stat_ico">
                <Icon size={20} />
              </div>
              <div className="cmb_stat_body">
                <span className="cmb_stat_lbl">{c.label}</span>
                <span className="cmb_stat_val">{c.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cmb_table_head">
        <h3>Existing Combination Sets</h3>
        <div className="cmb_table_actions">
          <div className="cmb_search">
            <Search size={15} />
            <input
              placeholder="Search set name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="cmb_btn primary" onClick={onCreate}>
            <Plus size={16} /> Create Combination Set
          </button>
        </div>
      </div>

      <div className="cmb_table_wrap">
        <table className="cmb_table">
          <thead>
            <tr>
              <th>Set Name</th>
              <th>Category</th>
              <th>Combination Count</th>
              <th>Status</th>
              <th>Created Date</th>
              <th className="ta_c">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s) => (
              <tr key={s.id}>
                <td className="cmb_td_name">{s.name}</td>
                <td>{catName(s.category)}</td>
                <td>{(s.combinationCount || 0).toLocaleString()}</td>
                <td>
                  <span className="cmb_status">{s.status}</span>
                </td>
                <td>{s.createdDate}</td>
                <td>
                  <div className="cmb_row_actions">
                    <button
                      className="ico view"
                      title="View"
                      onClick={() => onView(s)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="ico edit"
                      title="Edit"
                      onClick={() => onEdit(s)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="ico del"
                      title="Delete"
                      onClick={() => onDelete(s.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!sets.length && (
              <tr>
                <td colSpan={6} className="cmb_empty">
                  No combination sets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   BUILDER VIEW  (Image 2)
   ════════════════════════════════════════════════ */
const BuilderView = ({
  form,
  setField,
  categories,
  genders,
  attributeGroups,
  selectedCount,
  toggleOption,
  total,
  onBack,
  onCreateCombine,
}) => {
  return (
    <div className="cmb_page">
      <div className="cmb_page_head">
        <button className="cmb_back" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <span className="cmb_step_badge">2</span>
        <h2>Combination Set Builder</h2>
      </div>

      <div className="cmb_builder">
        {/* left: set info */}
        <div className="cmb_setinfo cmb_panel">
          <label className="cmb_field">
            <span>
              Set Name <b>*</b>
            </span>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Women's Ring Set"
            />
          </label>
          <label className="cmb_field">
            <span>
              Category <b>*</b>
            </span>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="cmb_field">
            <span>Gender</span>
            <select
              value={form.gender}
              onChange={(e) => setField("gender", e.target.value)}
            >
              <option value="">Select</option>
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="cmb_field">
            <span>Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Short description of this set..."
            />
          </label>
          <label className="cmb_field cmb_field_inline">
            <span>Display Order</span>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => setField("displayOrder", +e.target.value)}
            />
          </label>
        </div>

        {/* right: attribute groups + summary */}
        <div className="cmb_attrs">
          <div className="cmb_attr_grid">
            {attributeGroups.map((g) => (
              <div key={g.id} className="cmb_panel cmb_attr_card">
                <h4>{g.label}</h4>
                {g.options.map((o) => {
                  const checked = (form.selections[g.id] || []).includes(o.id);
                  return (
                    <label key={o.id} className="cmb_check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOption(g.id, o.id)}
                      />
                      <span className="cmb_check_box" />
                      <span className="cmb_check_lbl">{o.name}</span>
                    </label>
                  );
                })}
              </div>
            ))}

            {/* selection summary */}
            <div className="cmb_panel cmb_summary">
              <h4>Selection Summary</h4>
              <ul>
                {attributeGroups.map((g) => (
                  <li key={g.id}>
                    <span>{g.label}</span>
                    <b>{selectedCount(g.id)}</b>
                  </li>
                ))}
              </ul>
              <div className="cmb_summary_total">
                <span>Total Possible Combination</span>
                <b>{total.toLocaleString()}</b>
              </div>
            </div>
          </div>

          <div className="cmb_builder_footer">
            <button className="cmb_btn ghost" onClick={onBack}>
              Cancel
            </button>
            <button className="cmb_btn primary" onClick={onCreateCombine}>
              <Sparkles size={15} /> Create Combine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   COMBINATIONS VIEW  (generated list + save)
   ════════════════════════════════════════════════ */
const CombinationsView = ({
  form,
  combos,
  attributeGroups,
  optName,
  catName,
  onBack,
  onEdit,
  onDelete,
  onBulkDelete,
  onSave,
  readOnly,
}) => {
  const activeGroups = attributeGroups.filter(
    (g) => (form.selections[g.id] || []).length > 0
  );

  const [filters, setFilters] = useState({}); // groupId -> optionId
  const [selected, setSelected] = useState([]); // combo ids

  // distinct option values present per group (for the filter dropdowns)
  const filterOptions = useMemo(() => {
    const m = {};
    activeGroups.forEach((g) => {
      m[g.id] = (form.selections[g.id] || []);
    });
    return m;
  }, [activeGroups, form.selections]);

  const filteredCombos = useMemo(
    () =>
      combos.filter((c) =>
        activeGroups.every((g) => {
          const f = filters[g.id];
          return !f || c.values[g.id] === f;
        })
      ),
    [combos, filters, activeGroups]
  );

  const setFilter = (gid, val) =>
    setFilters((prev) => ({ ...prev, [gid]: val }));

  const clearFilters = () => setFilters({});
  const hasFilters = Object.values(filters).some(Boolean);

  const filteredIds = filteredCombos.map((c) => c.id);
  const allSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.includes(id));

  const toggleSelectAll = () =>
    setSelected(allSelected ? [] : filteredIds);

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleBulkDelete = () => {
    onBulkDelete(selected);
    setSelected([]);
  };

  const handleDownload = () => {
    const rows = filteredCombos.map((c, i) => {
      const row = { "#": i + 1, Name: c.name };
      activeGroups.forEach((g) => {
        row[g.label] = optName(g.id, c.values[g.id]);
      });
      row.Category = catName(c.category);
      row.Gender = c.gender || "";
      row.Order = c.displayOrder;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Combinations");
    const safeName = (form.name || "combinations").replace(/[^\w-]+/g, "_");
    XLSX.writeFile(wb, `${safeName}.xlsx`);
  };

  return (
    <div className="cmb_page">
      <div className="cmb_page_head">
        <button className="cmb_back" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <span className="cmb_step_badge">3</span>
        <h2>{readOnly ? "Set Combinations" : "Generated Combinations"}</h2>
        <div className="cmb_head_right">
          <span className="cmb_count_pill">
            {filteredCombos.length.toLocaleString()}
            {hasFilters ? ` / ${combos.length.toLocaleString()}` : ""} combinations
          </span>
          <button className="cmb_btn outline" onClick={handleDownload}>
            <Download size={15} /> Download
          </button>
          {!readOnly && (
            <button className="cmb_btn success" onClick={onSave}>
              <Save size={15} /> Save Set
            </button>
          )}
        </div>
      </div>

      <div className="cmb_combo_meta">
        <span>
          <b>{form.name}</b>
        </span>
        <span>{catName(form.category)}</span>
        {form.gender && <span>{form.gender}</span>}
      </div>

      {/* toolbar: filters + bulk actions */}
      <div className="cmb_combo_toolbar">
        <div className="cmb_filter_row">
          <span className="cmb_filter_lbl">
            <Filter size={14} /> Filters
          </span>
          {activeGroups.map((g) => (
            <select
              key={g.id}
              className="cmb_filter_select"
              value={filters[g.id] || ""}
              onChange={(e) => setFilter(g.id, e.target.value)}
            >
              <option value="">All {g.label}</option>
              {filterOptions[g.id].map((optId) => (
                <option key={optId} value={optId}>
                  {optName(g.id, optId)}
                </option>
              ))}
            </select>
          ))}
          {hasFilters && (
            <button className="cmb_btn ghost sm" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {!readOnly && selected.length > 0 && (
          <button className="cmb_btn danger" onClick={handleBulkDelete}>
            <Trash2 size={15} /> Delete Selected ({selected.length})
          </button>
        )}
      </div>

      <div className="cmb_table_wrap">
        <table className="cmb_table cmb_combo_table">
          <thead>
            <tr>
              <th className="ta_c cmb_chk_col">
                {!readOnly && (
                  <label className="cmb_check cmb_check_center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                    <span className="cmb_check_box" />
                  </label>
                )}
                <span className="cmb_hash">#</span>
              </th>
              {activeGroups.map((g) => (
                <th key={g.id}>{g.label}</th>
              ))}
              <th>Order</th>
              <th className="ta_c">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCombos.map((c, i) => (
              <tr
                key={c.id}
                className={selected.includes(c.id) ? "cmb_row_sel" : ""}
              >
                <td className="ta_c cmb_chk_col">
                  {!readOnly && (
                    <label className="cmb_check cmb_check_center">
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                      <span className="cmb_check_box" />
                    </label>
                  )}
                  <span className="cmb_hash">{i + 1}</span>
                </td>
                {activeGroups.map((g) => (
                  <td key={g.id}>{optName(g.id, c.values[g.id])}</td>
                ))}
                <td>{c.displayOrder}</td>
                <td>
                  <div className="cmb_row_actions">
                    {!readOnly && (
                      <>
                        <button
                          className="ico edit"
                          title="Edit"
                          onClick={() => onEdit(c)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="ico del"
                          title="Delete"
                          onClick={() => onDelete(c.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    {readOnly && (
                      <button
                        className="ico view"
                        title="View"
                        onClick={() => onEdit(c)}
                      >
                        <Eye size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!filteredCombos.length && (
              <tr>
                <td colSpan={activeGroups.length + 3} className="cmb_empty">
                  {combos.length
                    ? "No combinations match the selected filters."
                    : "No combinations left. Go back and generate again."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   SINGLE COMBINATION EDIT MODAL  (Image 1)
   ════════════════════════════════════════════════ */
const ComboEditModal = ({
  combo,
  form,
  attributeGroups,
  categories,
  genders,
  onClose,
  onSave,
}) => {
  const activeGroups = attributeGroups.filter(
    (g) => (form.selections[g.id] || []).length > 0
  );
  const [draft, setDraft] = useState(() => ({
    ...combo,
    values: { ...combo.values },
  }));

  const setVal = (gid, val) =>
    setDraft((d) => ({ ...d, values: { ...d.values, [gid]: val } }));

  return (
    <div className="cmb_overlay" onClick={onClose}>
      <div
        className="cmb_modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmb_modal_head">
          <h3>Edit Combination</h3>
          <button className="cmb_modal_close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cmb_modal_body">
          <label className="cmb_field">
            <span>Name</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>

          {activeGroups.map((g) => (
            <label key={g.id} className="cmb_field">
              <span>{g.label}</span>
              <select
                value={draft.values[g.id] || ""}
                onChange={(e) => setVal(g.id, e.target.value)}
              >
                {g.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="cmb_field">
            <span>Category</span>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="cmb_field">
            <span>Gender</span>
            <select
              value={draft.gender}
              onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
            >
              <option value="">Select</option>
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="cmb_field">
            <span>Display Order</span>
            <input
              type="number"
              value={draft.displayOrder}
              onChange={(e) =>
                setDraft({ ...draft, displayOrder: +e.target.value })
              }
            />
          </label>
        </div>

        <div className="cmb_modal_foot">
          <button className="cmb_btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="cmb_btn outline" onClick={() => onSave(draft, true)}>
            Save &amp; Add New
          </button>
          <button className="cmb_btn primary" onClick={() => onSave(draft, false)}>
            <Save size={15} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombinationMaker;