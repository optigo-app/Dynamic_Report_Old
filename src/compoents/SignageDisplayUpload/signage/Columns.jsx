"use client";
export const Columns = () => [
    { id: 'Id', label: 'Sr#', align: "", sortable: false, style: { width: '60px', fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'setName', label: 'Tv Set Name', align: "", sortable: true, style: { fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'orientation', label: 'Orientation', align: "", sortable: true, style: { fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'entryDate', label: 'Entry Date', align: "", sortable: true, style: { fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'isDefault', label: 'Is Default', align: "center", sortable: true, style: { fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'isActive', label: 'Is Active', align: "center", sortable: true, style: { fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'Actions', label: 'Actions', align: "center", sortable: false, style: { width: '100px', fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
];

export const LocationColumns = () => [
    { id: 'Id', label: 'Sr#', align: "left", sortable: false, style: { width: 100, fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'Title', label: 'Location Name', align: "", sortable: true, style: { fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
    { id: 'Actions', label: 'Actions', align: "center", sortable: false, style: { width: '100px', fontWeight: 'bold', color: '#555', backgroundColor: '#f9fafb' } },
];