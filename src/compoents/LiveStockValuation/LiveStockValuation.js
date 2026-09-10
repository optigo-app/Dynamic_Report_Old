// http://localhost:3001/testreport/?sp=9&ifid=AdvanceCRM&pid=18604

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import './LiveStockValuation.scss'


const API_URL = 'http://nzen/jo/api-lib/App/CentralApi'
const TOKEN = '9065471700535651'

const POLICY_OPTIONS = {
  diamond:    ['Premium Diamond Policy', 'Standard Diamond Policy', 'Basic Diamond Policy'],
  colorstone: ['Standard Colorstone Policy', 'Premium Colorstone Policy'],
  labour:     ['HO Labour Policy', 'Standard Labour Policy'],
  setting:    ['Multi Labour Policy', 'Single Labour Policy'],
}

const REPAIR_TABS = ['IN REPAIR / ALTERATION', 'IN MEMO']

const fmt = (n, d = 3) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

const groupByEvent = (rows) => {
  const map = {}
  rows.forEach((row) => {
    const evt = (row.EventName || 'unknown').toLowerCase().replace(/\s+/g, '_')
    if (!map[evt]) map[evt] = []
    map[evt].push(row)
  })
  return map
}

const summariseGroup = (rows) => {
  const itemMap = {}
  rows.forEach((row) => {
    const key = row.ItemName
    if (!itemMap[key]) itemMap[key] = { ItemName: key, Weight: 0, Amount: 0, Pcs: 0, PurchaseCost: 0, CurrentPrice: 0, materials: {} }
    itemMap[key].Weight        += Number(row.Weight || 0)
    itemMap[key].Amount        += Number(row.Amount || 0)
    itemMap[key].Pcs           += Number(row.Pcs || 0)
    itemMap[key].PurchaseCost  += Number(row.PurchaseCost || 0)
    itemMap[key].CurrentPrice  += Number(row.CurrentPrice || 0)
    const mat = row.materialtypename || '—'
    if (!itemMap[key].materials[mat]) itemMap[key].materials[mat] = { Weight: 0, Amount: 0 }
    itemMap[key].materials[mat].Weight += Number(row.Weight || 0)
    itemMap[key].materials[mat].Amount += Number(row.Amount || 0)
  })
  return Object.values(itemMap)
}

// ─── DrillIcon ────────────────────────────────────────────────────────────────

const DrillIcon = ({ expanded }) => (
  <div className={`drill-icon${expanded ? ' expanded' : ''}`}>
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polygon points="2,1 9,5 2,9" fill="white" />
    </svg>
  </div>
)

// ─── SectionTable ─────────────────────────────────────────────────────────────

const SectionTable = ({ items, showPcs = false, showCost = false }) => {
  const [expanded, setExpanded] = useState({})
  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  return (
    <table className="stock-table">
      <thead>
        <tr>
          <th className="col-icon"></th>
          <th className="col-name">Item Name</th>
          {showPcs  && <th className="col-num">Pcs</th>}
          <th className="col-num">Weight</th>
          <th className="col-num">Amount</th>
          {showCost && <th className="col-num">Purchase Cost</th>}
          {showCost && <th className="col-num">Current Price</th>}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const mats  = Object.entries(item.materials || {})
          const isOpen = expanded[item.ItemName]
          return (
            <React.Fragment key={item.ItemName}>
              <tr className="row-parent" onClick={() => toggle(item.ItemName)}>
                <td><DrillIcon expanded={isOpen} /></td>
                <td className="col-name"><strong>{item.ItemName}</strong></td>
                {showPcs  && <td className="col-num">{item.Pcs ? fmt(item.Pcs, 0) : '—'}</td>}
                <td className="col-num">{fmt(item.Weight)}</td>
                <td className="col-num">{fmt(item.Amount, 2)}</td>
                {showCost && <td className="col-num">{fmt(item.PurchaseCost, 2)}</td>}
                {showCost && <td className="col-num">{fmt(item.CurrentPrice, 2)}</td>}
              </tr>
              {isOpen && mats.map(([matName, matData]) => (
                <tr key={matName} className="row-child">
                  <td></td>
                  <td className="col-name mat-link">{matName}</td>
                  {showPcs  && <td className="col-num">—</td>}
                  <td className="col-num">{fmt(matData.Weight)}</td>
                  <td className="col-num">{fmt(matData.Amount, 2)}</td>
                  {showCost && <td className="col-num">—</td>}
                  {showCost && <td className="col-num">—</td>}
                </tr>
              ))}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── CalcModal ────────────────────────────────────────────────────────────────

const CalcModal = ({ onClose }) => {
  const [policies, setPolicies] = useState({
    diamond:    POLICY_OPTIONS.diamond[0],
    colorstone: POLICY_OPTIONS.colorstone[0],
    labour:     POLICY_OPTIONS.labour[0],
    setting:    POLICY_OPTIONS.setting[0],
  })

  const fields = [
    { label: 'Diamond Policy',              key: 'diamond'    },
    { label: 'Color Stone Policy',          key: 'colorstone' },
    { label: 'Labour Policy',               key: 'labour'     },
    { label: 'Setting / Multi Labour Policy', key: 'setting'  },
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Calculate Current Value</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {fields.map(({ label, key }) => (
            <div className="policy-row" key={key}>
              <label>{label}</label>
              <select
                value={policies[key]}
                onChange={(e) => setPolicies((p) => ({ ...p, [key]: e.target.value }))}
              >
                {POLICY_OPTIONS[key].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Calculate</button>
        </div>
      </div>
    </div>
  )
}

// ─── SimpleSection (RM Stock / Assign to Vendor) ──────────────────────────────

const SimpleSection = ({ label, rows, collapsed, onToggle }) => {
  const items = summariseGroup(rows)
  return (
    <div className="section-card">
      <div className="section-header" onClick={onToggle}>
        <span className="chevron">{collapsed ? '▶' : '▼'}</span>
        <span className="section-label">{label}</span>
      </div>
      {!collapsed && (
        <div className="section-body">
          <SectionTable items={items} />
        </div>
      )}
    </div>
  )
}

// ─── StockInHand ──────────────────────────────────────────────────────────────

const StockInHandSection = ({ rows, collapsed, onToggle }) => {
  const items = summariseGroup(rows)
  return (
    <div className="section-card full-width">
      <div className="section-header" onClick={onToggle}>
        <span className="chevron">{collapsed ? '▶' : '▼'}</span>
        <span className="section-label">3. STOCK IN HAND</span>
      </div>
      {!collapsed && (
        <div className="section-body">
          <SectionTable items={items} showPcs showCost />
        </div>
      )}
    </div>
  )
}

// ─── RepairSection (tabbed) ───────────────────────────────────────────────────

const RepairSection = ({ rows, collapsed, onToggle }) => {
  const [activeTab, setActiveTab] = useState(0)

  // Split rows by sub-event or just show all in both tabs for now
  // Tab 0 = IN REPAIR/ALTERATION, Tab 1 = IN MEMO
  const tabRows = [
    rows.filter((r) => !(r.SubEvent || '').toLowerCase().includes('memo')),
    rows.filter((r)  => (r.SubEvent || '').toLowerCase().includes('memo')),
  ]
  // Fallback: if no SubEvent field, show same data in both tabs
  const displayRows = (tabRows[activeTab].length > 0 ? tabRows[activeTab] : rows)
  const items = summariseGroup(displayRows)

  return (
    <div className="section-card full-width">
      <div className="section-header" onClick={onToggle}>
        <span className="chevron">{collapsed ? '▶' : '▼'}</span>
        <span className="section-label">4. IN REPAIR / IN ALTERATION / IN MEMO</span>
      </div>
      {!collapsed && (
        <div className="section-body no-pad-top">
          <div className="tab-bar">
            {REPAIR_TABS.map((t, i) => (
              <button
                key={t}
                className={`tab-btn${activeTab === i ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveTab(i) }}
              >
                {t}
              </button>
            ))}
          </div>
          <SectionTable items={items} showPcs showCost />
        </div>
      )}
    </div>
  )
}

// ─── Spinner / Error ──────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="spinner-wrap">
    <div className="spinner" />
    <span>Loading valuation data…</span>
  </div>
)

const ErrorBox = ({ msg }) => (
  <div className="error-box">
    <span className="error-icon">⚠</span>
    <span>{msg}</span>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

const LiveStockValuation = () => {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [showCalc, setShowCalc] = useState(false)
  const [collapsed, setCollapsed] = useState({})

  const toggleSection = (key) => setCollapsed((p) => ({ ...p, [key]: !p[key] }))

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await axios.post(API_URL, {
        Token:   TOKEN,
        SpNo:    '10',
        SpVer:   'Live',
        ReqData: JSON.stringify([{ Token: TOKEN, Evt: 'GetDetails' }]),
      })
      const payload = res.data
      if (payload?.Status !== '200') throw new Error(payload?.Message || 'API error')
      setData(payload.Data?.DT || [])
    } catch (err) {
      setError(err?.response?.data?.Message || err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const grouped = data ? groupByEvent(data) : {}

  const rmRows     = grouped['rm_stock']          || []
  const vendorRows = grouped['assign_to_vendor']  || []
  const handRows   = grouped['stock_in_hand']     || []
  const repairRows = grouped['repair_alteration'] || grouped['in_repair'] || []

  return (
    <div className="lsv-root">
      {/* ── Header ── */}
      <div className="lsv-header">
        <h1 className="lsv-title">LIVE STOCK VALUATION REPORT</h1>
        <button className="btn btn-primary calc-btn" onClick={() => setShowCalc(true)}>
          ⊞ Calculate Current Value
        </button>
      </div>

      {/* ── Body ── */}
      <div className="lsv-body">
        {loading && <Spinner />}
        {error   && <ErrorBox msg={error} />}

        {!loading && !error && data && (
          <>
            {/* Row 1: RM Stock + Assign to Vendor side by side */}
            <div className="sections-row">
              {rmRows.length > 0 && (
                <SimpleSection
                  label="1. RM STOCK"
                  rows={rmRows}
                  collapsed={!!collapsed['rm_stock']}
                  onToggle={() => toggleSection('rm_stock')}
                />
              )}
              {vendorRows.length > 0 && (
                <SimpleSection
                  label="2. ASSIGN TO VENDOR"
                  rows={vendorRows}
                  collapsed={!!collapsed['assign_to_vendor']}
                  onToggle={() => toggleSection('assign_to_vendor')}
                />
              )}
            </div>

            {/* Row 2: Stock in Hand – full width */}
            {handRows.length > 0 && (
              <StockInHandSection
                rows={handRows}
                collapsed={!!collapsed['stock_in_hand']}
                onToggle={() => toggleSection('stock_in_hand')}
              />
            )}

            {/* Row 3: Repair/Alteration/Memo – tabbed, full width */}
            {repairRows.length > 0 && (
              <RepairSection
                rows={repairRows}
                collapsed={!!collapsed['repair']}
                onToggle={() => toggleSection('repair')}
              />
            )}

            {/* Any other event groups */}
            {Object.entries(grouped)
              .filter(([k]) => !['rm_stock','assign_to_vendor','stock_in_hand','repair_alteration','in_repair'].includes(k))
              .map(([evt, rows]) => (
                <div className="section-card full-width" key={evt}>
                  <div className="section-header" onClick={() => toggleSection(evt)}>
                    <span className="chevron">{collapsed[evt] ? '▶' : '▼'}</span>
                    <span className="section-label">{evt.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  {!collapsed[evt] && (
                    <div className="section-body">
                      <SectionTable items={summariseGroup(rows)} />
                    </div>
                  )}
                </div>
              ))
            }
          </>
        )}
      </div>

      {showCalc && <CalcModal onClose={() => setShowCalc(false)} />}
    </div>
  )
}

export default LiveStockValuation