import React, { useState, useCallback, useRef, useEffect } from 'react';
import { purchaseAPI, medicineAPI } from '../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  Grid,
  LinearProgress,
  Tooltip,
  MenuItem,
  Tab,
  Tabs,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Edit,
  CheckCircle,
  Download,
  Upload,
  Warning,
  ShoppingCart,
  Summarize,
  Search,
  Save,
  Refresh,
  Block,
  CheckCircleOutline,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const GST_RATES = [0, 5, 12, 18, 28];
const MEDICINE_TYPES = ['tablet', 'capsule', 'syrup', 'ointment', 'injection', 'drops', 'inhaler', 'powder', 'gel', 'spray', 'solution'];

const COLUMN_ALIASES = {
  name: ['name', 'medicinename', 'medicine_name', 'productname', 'product_name', 'itemname', 'item_name', 'drug'],
  genericName: ['genericname', 'generic_name', 'composition', 'salt', 'activesalt'],
  batchNumber: ['batchnumber', 'batch_number', 'batch', 'batchno', 'batch_no', 'lot'],
  rackNumber: ['racknumber', 'rack_number', 'rack', 'rackno', 'rack_no', 'shelf'],
  type: ['type', 'form', 'dosageform', 'dosage_form', 'medicinetype', 'medicine_type', 'category'],
  quantity: ['quantity', 'qty', 'stock', 'stockquantity', 'stock_quantity', 'units', 'pack'],
  unitPrice: ['unitprice', 'unit_price', 'price', 'cost', 'purchaseprice', 'purchase_price', 'mrp', 'rate', 'unitcost'],
  gstRate: ['strate', 'gst_rate', 'gst', 'gstpercent', 'gst_percent', 'tax', 'gstrate'],
  supplier: ['suppliername', 'supplier_name', 'supplier', 'vendor', 'company', 'distributor'],
  invoice: ['invoicenumber', 'invoice_number', 'invoice', 'invoiceno', 'invoice_no', 'billno'],
  expiry: ['expirydate', 'expiry_date', 'expiry', 'expdate', 'exp_date', 'validity'],
  minStock: ['minstock', 'min_stock', 'lowstockthreshold', 'low_stock_threshold', 'reorderlevel', 'reorder_level', 'reorder'],
};

function matchColumn(header, aliases) {
  const norm = header.toLowerCase().replace(/[\s_\-]/g, '');
  return aliases.some((a) => a.toLowerCase().replace(/[\s_\-]/g, '') === norm);
}

function mapHeaders(headers) {
  const mapping = {};
  for (const key of Object.keys(COLUMN_ALIASES)) {
    const found = headers.find((h) => matchColumn(h, COLUMN_ALIASES[key]));
    if (found) mapping[key] = found;
  }
  return mapping;
}

function PurchaseImport() {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [allMedicines, setAllMedicines] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [editMedDialog, setEditMedDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteMedConfirm, setDeleteMedConfirm] = useState(null);
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [saveConfirmDialog, setSaveConfirmDialog] = useState(false);

  useEffect(() => {
    if (activeTab === 1 && allMedicines.length === 0) {
      loadAllMedicines();
    }
  }, [activeTab]);

  const loadAllMedicines = async () => {
    setSearchLoading(true);
    try {
      const res = await medicineAPI.getAll({ limit: 1000 });
      const data = res.data?.data || res.data?.content || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setAllMedicines(list);
      setSearchResults(list);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load medicines', severity: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  const getAvailableMedicines = () => {
    return searchResults.filter((m) => (m.stockQuantity || 0) > 0);
  };

  const exportAvailableCSV = () => {
    const available = getAvailableMedicines();
    if (available.length === 0) {
      setSnackbar({ open: true, message: 'No available medicines to export', severity: 'warning' });
      return;
    }
    const csv = Papa.unparse(
      available.map((m) => ({
        ID: m.id || m.medicineId,
        Name: m.name || '',
        'Generic Name': m.genericName || '',
        'Batch Number': m.batchNumber || '',
        'Rack Number': m.rackNumber || '',
        Type: m.type || '',
        'Stock Quantity': m.stockQuantity ?? 0,
        'Purchase Price': m.purchasePrice || 0,
        'Sale Price': m.salePrice || 0,
        'GST Rate': m.gstRate || 0,
        'Low Stock Threshold': m.lowStockThreshold || 10,
        'Expiry Date': m.expiryDate || '',
      }))
    );
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'available_medicines.csv');
    setSnackbar({ open: true, message: `Exported ${available.length} available medicines (CSV)`, severity: 'success' });
  };

  const exportAvailableXLS = () => {
    const available = getAvailableMedicines();
    if (available.length === 0) {
      setSnackbar({ open: true, message: 'No available medicines to export', severity: 'warning' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      available.map((m) => ({
        ID: m.id || m.medicineId,
        Name: m.name || '',
        'Generic Name': m.genericName || '',
        'Batch Number': m.batchNumber || '',
        'Rack Number': m.rackNumber || '',
        Type: m.type || '',
        'Stock Quantity': m.stockQuantity ?? 0,
        'Purchase Price': m.purchasePrice || 0,
        'Sale Price': m.salePrice || 0,
        'GST Rate': m.gstRate || 0,
        'Low Stock Threshold': m.lowStockThreshold || 10,
        'Expiry Date': m.expiryDate || '',
      }))
    );
    ws['!cols'] = Array(12).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Available Medicines');
    XLSX.writeFile(wb, 'available_medicines.xlsx');
    setSnackbar({ open: true, message: `Exported ${available.length} available medicines (XLS)`, severity: 'success' });
  };

  const calculateGST = (price, qty, gst) => {
    const subtotal = price * qty;
    const gstAmount = (subtotal * gst) / 100;
    return { subtotal, gstAmount, cgst: gstAmount / 2, sgst: gstAmount / 2, total: subtotal + gstAmount };
  };

  const parseFile = useCallback((f) => {
    setParsing(true);
    setFile(f);

    const processRows = (rows) => {
      if (!rows || rows.length === 0) {
        setSnackbar({ open: true, message: 'File is empty or has no valid rows', severity: 'warning' });
        setParsing(false);
        return;
      }
      const allHeaders = Object.keys(rows[0]);
      const detected = mapHeaders(allHeaders);
      setHeaders(allHeaders);
      setColumnMap(detected);

      const mapped = rows
        .filter((r) => {
          const nameKey = detected.name;
          return nameKey && r[nameKey] && String(r[nameKey]).trim() !== '';
        })
        .map((r, idx) => {
          const get = (key) => {
            const col = detected[key];
            return col ? r[col] : '';
          };
          const name = String(get('name')).trim();
          const qty = Math.max(1, parseInt(get('quantity'), 10) || 1);
          const price = Math.max(0, parseFloat(get('unitPrice')) || 0);
          const gst = parseFloat(get('gstRate')) || 18;
          const { subtotal, gstAmount, cgst, sgst, total } = calculateGST(price, qty, gst);

          return {
            _rowId: idx, name, genericName: String(get('genericName')).trim(),
            batchNumber: String(get('batchNumber')).trim(), rackNumber: String(get('rackNumber')).trim(),
            type: String(get('type')).trim().toLowerCase(), quantity: qty, unitPrice: price, gstRate: gst,
            cgst, sgst, gstAmount, subtotal, total, supplier: String(get('supplier')).trim(),
            invoice: String(get('invoice')).trim(), expiry: String(get('expiry')).trim(),
            minStock: parseInt(get('minStock'), 10) || 10, isNew: true,
          };
        });

      setRawData(mapped);
      setParsing(false);
      if (mapped.length > 0) {
        setSnackbar({ open: true, message: `Parsed ${mapped.length} items from file`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'No valid rows found. Required: Name column', severity: 'warning' });
      }
    };

    if (f.name.endsWith('.csv')) {
      Papa.parse(f, {
        header: true, skipEmptyLines: true,
        complete: (results) => processRows(results.data),
        error: () => { setSnackbar({ open: true, message: 'Failed to parse CSV', severity: 'error' }); setParsing(false); },
      });
    } else if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          processRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
        } catch { setSnackbar({ open: true, message: 'Failed to parse XLS file', severity: 'error' }); setParsing(false); }
      };
      reader.readAsArrayBuffer(f);
    } else {
      setSnackbar({ open: true, message: 'Unsupported format. Use CSV or XLS/XLSX', severity: 'warning' });
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }, [parseFile]);
  const handleDragOver = (e) => e.preventDefault();
  const handleFileSelect = (e) => { const f = e.target.files[0]; if (f) parseFile(f); e.target.value = ''; };

  const updateRow = (rowId, field, value) => {
    setRawData((prev) => prev.map((r) => {
      if (r._rowId !== rowId) return r;
      const updated = { ...r, [field]: value };
      const qty = Math.max(1, updated.quantity || 1);
      const price = Math.max(0, updated.unitPrice || 0);
      const gst = updated.gstRate || 0;
      const { subtotal, gstAmount, cgst, sgst, total } = calculateGST(price, qty, gst);
      return { ...updated, quantity: qty, unitPrice: price, gstRate: gst, cgst, sgst, gstAmount, subtotal, total };
    }));
  };

  const deleteRow = (rowId) => { setRawData((prev) => prev.filter((r) => r._rowId !== rowId)); setDeleteConfirm(null); };

  const openEditDialog = (row) => { setEditRow({ ...row }); setEditDialog(true); };

  const saveEdit = () => {
    const qty = Math.max(1, editRow.quantity || 1);
    const price = Math.max(0, editRow.unitPrice || 0);
    const gst = editRow.gstRate || 0;
    const { subtotal, gstAmount, cgst, sgst, total } = calculateGST(price, qty, gst);
    const updated = { ...editRow, quantity: qty, unitPrice: price, gstRate: gst, cgst, sgst, gstAmount, subtotal, total };
    setRawData((prev) => prev.map((r) => (r._rowId === updated._rowId ? updated : r)));
    setEditDialog(false);
    setEditRow(null);
  };

  const handleColumnMapChange = (field, headerValue) => {
    setColumnMap((prev) => ({ ...prev, [field]: headerValue || undefined }));
  };

  const remapData = () => {
    if (!file) return;
    setParsing(true);
    const process = (rows) => {
      const mapped = rows
        .filter((r) => { const nameKey = columnMap.name; return nameKey && r[nameKey] && String(r[nameKey]).trim() !== ''; })
        .map((r, idx) => {
          const get = (key) => { const col = columnMap[key]; return col ? r[col] : ''; };
          const name = String(get('name')).trim();
          const qty = Math.max(1, parseInt(get('quantity'), 10) || 1);
          const price = Math.max(0, parseFloat(get('unitPrice')) || 0);
          const gst = parseFloat(get('gstRate')) || 18;
          const { subtotal, gstAmount, cgst, sgst, total } = calculateGST(price, qty, gst);
          return {
            _rowId: idx, name, genericName: String(get('genericName')).trim(),
            batchNumber: String(get('batchNumber')).trim(), rackNumber: String(get('rackNumber')).trim(),
            type: String(get('type')).trim().toLowerCase(), quantity: qty, unitPrice: price, gstRate: gst,
            cgst, sgst, gstAmount, subtotal, total, supplier: String(get('supplier')).trim(),
            invoice: String(get('invoice')).trim(), expiry: String(get('expiry')).trim(),
            minStock: parseInt(get('minStock'), 10) || 10, isNew: true,
          };
        });
      setRawData(mapped);
      setParsing(false);
      setSnackbar({ open: true, message: `Remapped ${mapped.length} items`, severity: 'success' });
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: (results) => process(results.data) });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        process(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress({ current: 0, total: rawData.length });
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];
      setImportProgress({ current: i + 1, total: rawData.length });
      try {
        const medRes = await medicineAPI.create({
          name: item.name, genericName: item.genericName || '', batchNumber: item.batchNumber || '',
          rackNumber: item.rackNumber || '', type: item.type || '', salePrice: item.unitPrice * 1.1,
          purchasePrice: item.unitPrice, stockQuantity: 0, gstRate: item.gstRate,
          expiryDate: item.expiry || '2027-12-31', lowStockThreshold: item.minStock || 10,
        });
        const createdMed = medRes.data?.data || medRes.data;
        const medicineId = createdMed.id || createdMed.medicineId;

        await purchaseAPI.create({
          medicineId, quantity: item.quantity, unitPrice: String(item.unitPrice),
          gstRate: String(item.gstRate), supplierName: item.supplier || '',
          invoiceNumber: item.invoice || '', rackNumber: item.rackNumber || '', medicineType: item.type || '',
        });
        successCount++;
      } catch (err) {
        failCount++;
        errors.push({ row: i + 1, name: item.name, error: err.response?.data?.message || 'Failed' });
      }
    }

    setImportProgress({ current: rawData.length, total: rawData.length });
    setImportResult({ successCount, failCount, errors });
    setResultDialog(true);
    setImporting(false);
    if (failCount === 0) {
      setSnackbar({ open: true, message: `All ${successCount} items imported!`, severity: 'success' });
      setRawData([]);
      setFile(null);
    } else {
      setSnackbar({ open: true, message: `${successCount} imported, ${failCount} failed`, severity: 'warning' });
    }
  };

  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Generic Name', 'Batch Number', 'Rack Number', 'Type', 'Quantity', 'Unit Price', 'GST Rate', 'Supplier', 'Invoice Number', 'Expiry Date', 'Min Stock'],
      ['Paracetamol 500mg', 'Paracetamol', 'BATCH001', 'A1', 'tablet', 500, 2.50, 12, 'MedSupply Co', 'INV-001', '2027-06-30', 50],
      ['Amoxicillin 250mg', 'Amoxicillin', 'BATCH002', 'A2', 'capsule', 200, 8.75, 12, 'PharmaDist Ltd', 'INV-002', '2027-03-15', 30],
      ['Cetirizine 10mg', 'Cetirizine HCl', 'BATCH003', 'B1', 'tablet', 300, 3.20, 12, 'MedSupply Co', 'INV-003', '2027-09-20', 40],
    ]);
    ws['!cols'] = Array(12).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, 'sample_purchase_import.xlsx');
  };

  const stats = {
    totalItems: rawData.length,
    totalQty: rawData.reduce((s, r) => s + r.quantity, 0),
    totalValue: rawData.reduce((s, r) => s + r.subtotal, 0),
    totalGST: rawData.reduce((s, r) => s + r.gstAmount, 0),
    grandTotal: rawData.reduce((s, r) => s + r.total, 0),
  };

  const importColumns = [
    { field: '_rowId', headerName: '#', width: 50 },
    { field: 'name', headerName: 'Medicine', flex: 1, minWidth: 160 },
    { field: 'batchNumber', headerName: 'Batch', width: 100 },
    { field: 'rackNumber', headerName: 'Rack', width: 70 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'quantity', headerName: 'Qty', width: 70, type: 'number' },
    { field: 'unitPrice', headerName: 'Price', width: 90, type: 'number', renderCell: (p) => `₹${Number(p.value).toFixed(2)}` },
    { field: 'gstRate', headerName: 'GST%', width: 65, renderCell: (p) => `${p.value}%` },
    { field: 'total', headerName: 'Total', width: 110, type: 'number', renderCell: (p) => <Typography fontWeight={600}>₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography> },
    { field: 'supplier', headerName: 'Supplier', width: 130 },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEditDialog(params.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(params.row)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const handleSearch = async (query) => {
    if (!query && query !== '') return;
    const q = (query || searchQuery || '').trim().toLowerCase();
    if (!q) {
      setSearchResults(allMedicines);
      return;
    }
    setSearchLoading(true);
    try {
      let results = allMedicines;
      if (allMedicines.length === 0) {
        const res = await medicineAPI.getAll({ limit: 1000 });
        const data = res.data?.data || res.data?.content || res.data || [];
        results = Array.isArray(data) ? data : [];
        setAllMedicines(results);
      }
      const filtered = results.filter((m) => {
        const name = (m.name || '').toLowerCase();
        const generic = (m.genericName || '').toLowerCase();
        const batch = (m.batchNumber || '').toLowerCase();
        const id = String(m.id || m.medicineId || '');
        return name.includes(q) || generic.includes(q) || batch.includes(q) || id === q;
      });
      setSearchResults(filtered);
    } catch {
      setSnackbar({ open: true, message: 'Search failed', severity: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAutocompleteSearch = (_, value, reason) => {
    if (reason === 'input') {
      const q = value.toLowerCase();
      if (!q) { setSearchResults(allMedicines); return; }
      const filtered = allMedicines.filter((m) => {
        const name = (m.name || '').toLowerCase();
        const generic = (m.genericName || '').toLowerCase();
        const batch = (m.batchNumber || '').toLowerCase();
        return name.includes(q) || generic.includes(q) || batch.includes(q);
      });
      setSearchResults(filtered);
    }
  };

  const openEditMedDialog = (med) => {
    setEditMedicine({ ...med });
    setEditMedDialog(true);
  };

  const saveMedicine = async () => {
    if (!editMedicine) return;
    setSaving(true);
    try {
      await medicineAPI.update(editMedicine.id || editMedicine.medicineId, {
        name: editMedicine.name,
        genericName: editMedicine.genericName || '',
        batchNumber: editMedicine.batchNumber || '',
        rackNumber: editMedicine.rackNumber || '',
        type: editMedicine.type || '',
        salePrice: editMedicine.salePrice,
        purchasePrice: editMedicine.purchasePrice,
        stockQuantity: editMedicine.stockQuantity,
        gstRate: editMedicine.gstRate,
        expiryDate: editMedicine.expiryDate,
        lowStockThreshold: editMedicine.lowStockThreshold || 10,
        active: editMedicine.active !== false,
        version: editMedicine.version,
      });
      setSnackbar({ open: true, message: `${editMedicine.name} updated successfully`, severity: 'success' });
      setEditMedDialog(false);
      setEditMedicine(null);
      setSelectedMed(null);
      setSelectedBatch(null);
      loadAllMedicines();
    } catch (err) {
      if (err.response?.status === 409) {
        setSnackbar({ open: true, message: 'Record was modified by another user. Refreshing...', severity: 'warning' });
        loadAllMedicines();
      } else {
        setSnackbar({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteMedicine = async (med) => {
    try {
      await medicineAPI.delete(med.id || med.medicineId);
      setSnackbar({ open: true, message: `${med.name} deleted`, severity: 'success' });
      setSearchResults((prev) => prev.filter((m) => (m.id || m.medicineId) !== (med.id || med.medicineId)));
      setDeleteMedConfirm(null);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('constraint') || err.response?.status === 500) {
        setSnackbar({ open: true, message: `Cannot delete "${med.name}" — it has existing purchase or sales records. Remove associated records first.`, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: msg || 'Delete failed', severity: 'error' });
      }
    }
  };

  const toggleMedicineStatus = async (med) => {
    const newStatus = med.active === false ? true : false;
    try {
      await medicineAPI.update(med.id || med.medicineId, {
        name: med.name,
        genericName: med.genericName || '',
        batchNumber: med.batchNumber || '',
        rackNumber: med.rackNumber || '',
        type: med.type || '',
        salePrice: med.salePrice,
        purchasePrice: med.purchasePrice,
        stockQuantity: med.stockQuantity,
        gstRate: med.gstRate,
        expiryDate: med.expiryDate,
        lowStockThreshold: med.lowStockThreshold || 10,
        active: newStatus,
        version: med.version,
      });
      loadAllMedicines();
      setSnackbar({ open: true, message: `${med.name} ${newStatus ? 'activated' : 'stopped'}`, severity: newStatus ? 'success' : 'warning' });
    } catch (err) {
      if (err.response?.status === 409) {
        setSnackbar({ open: true, message: 'Record was modified by another user. Refreshing...', severity: 'warning' });
        loadAllMedicines();
      } else {
        setSnackbar({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' });
      }
    }
  };

  const medColumns = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: 'Medicine', flex: 1, minWidth: 180 },
    { field: 'genericName', headerName: 'Generic', flex: 1, minWidth: 130, renderCell: (p) => p.value || '-' },
    { field: 'batchNumber', headerName: 'Batch', width: 100, renderCell: (p) => p.value || '-' },
    { field: 'rackNumber', headerName: 'Rack', width: 70, renderCell: (p) => p.value || '-' },
    { field: 'type', headerName: 'Type', width: 90, renderCell: (p) => p.value ? <Chip label={p.value} size="small" variant="outlined" /> : '-' },
    { field: 'stockQuantity', headerName: 'Stock', width: 70, type: 'number' },
    { field: 'purchasePrice', headerName: 'Purchase', width: 90, type: 'number', renderCell: (p) => `₹${Number(p.value || 0).toFixed(2)}` },
    { field: 'salePrice', headerName: 'Sale', width: 90, type: 'number', renderCell: (p) => `₹${Number(p.value || 0).toFixed(2)}` },
    { field: 'gstRate', headerName: 'GST%', width: 65, renderCell: (p) => `${p.value || 0}%` },
    {
      field: 'active', headerName: 'Status', width: 110, sortable: false, filterable: false,
      renderCell: (params) => {
        const isActive = params.value !== false;
        return (
          <Tooltip title={isActive ? 'Active — click to stop' : 'Stopped — click to activate'}>
            <IconButton size="small" onClick={() => toggleMedicineStatus(params.row)} color={isActive ? 'success' : 'error'}>
              {isActive ? <CheckCircleOutline fontSize="small" /> : <Block fontSize="small" />}
              <Typography variant="caption" sx={{ ml: 0.5 }}>{isActive ? 'Active' : 'Stopped'}</Typography>
            </IconButton>
          </Tooltip>
        );
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEditMedDialog(params.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteMedConfirm(params.row)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Purchase Management</Typography>
        {activeTab === 0 && (
          <Button variant="outlined" startIcon={<Download />} onClick={downloadSample} size="small">Sample Template</Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<Upload />} iconPosition="start" label="Purchase Import" />
          <Tab icon={<Search />} iconPosition="start" label="Search & Update Medicine" />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                onDrop={handleDrop} onDragOver={handleDragOver}
                onClick={() => fileRef.current?.click()}
                sx={{
                  border: '2px dashed', borderColor: file ? 'primary.main' : 'grey.400',
                  borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
                  bgcolor: file ? 'primary.50' : 'grey.50',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                  transition: 'all 0.2s',
                }}
              >
                <input ref={fileRef} type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileSelect} />
                {parsing ? <CircularProgress size={40} sx={{ mb: 1 }} /> : <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />}
                <Typography variant="h6" gutterBottom>{file ? file.name : 'Drop CSV/XLS file here or click to browse'}</Typography>
                <Typography variant="body2" color="text.secondary">Supports .csv, .xlsx, .xls formats</Typography>
              </Box>
            </CardContent>
          </Card>

          {rawData.length > 0 && (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>Column Mapping</Typography>
                  <Grid container spacing={1.5}>
                    {Object.keys(COLUMN_ALIASES).map((field) => (
                      <Grid item xs={6} md={3} key={field}>
                        <TextField
                          size="small" fullWidth select
                          label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          value={columnMap[field] || ''}
                          onChange={(e) => handleColumnMapChange(field, e.target.value)}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {headers.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </TextField>
                      </Grid>
                    ))}
                  </Grid>
                  <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={remapData}>Apply Mapping</Button>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>Preview ({rawData.length} items)</Typography>
                    <Button
                      variant="contained" color="success"
                      startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <ShoppingCart />}
                      onClick={() => setConfirmDialog(true)} disabled={importing || rawData.length === 0}
                    >
                      {importing ? `Importing ${importProgress.current}/${importProgress.total}...` : 'Import All'}
                    </Button>
                  </Box>
                  {importing && (
                    <LinearProgress variant="determinate" value={(importProgress.current / importProgress.total) * 100} sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                  )}
                  <DataGrid rows={rawData} columns={importColumns} getRowId={(r) => r._rowId} autoHeight disableRowSelectionOnClick pageSize={25} rowsPerPageOptions={[25, 50, 100]} sx={{ minHeight: 400 }} />
                  <Box display="flex" justifyContent="flex-end" mt={2} gap={3} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">Items: {stats.totalItems}</Typography>
                    <Typography variant="body2" color="text.secondary">Qty: {stats.totalQty.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">Subtotal: ₹{stats.totalValue.toFixed(2)}</Typography>
                    <Typography variant="body2" color="text.secondary">GST: ₹{stats.totalGST.toFixed(2)}</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">Total: ₹{stats.grandTotal.toFixed(2)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}

          {rawData.length === 0 && !parsing && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Summarize sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No data to display</Typography>
                <Typography variant="body2" color="text.secondary">Upload a CSV or XLS file to get started</Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1} color="primary">Search by Name / Generic</Typography>
                  <Autocomplete
                    fullWidth
                    options={searchResults}
                    loading={searchLoading}
                    loadingText="Loading medicines..."
                    noOptionsText="No medicines found"
                    getOptionLabel={(option) =>
                      `${option.name || ''}${option.genericName ? ' - ' + option.genericName : ''}`
                    }
                    isOptionEqualToValue={(option, value) => (option.id || option.medicineId) === (value.id || value.medicineId)}
                    value={selectedMed}
                    onChange={(_, val) => {
                      setSelectedMed(val);
                      if (val) openEditMedDialog(val);
                    }}
                    filterOptions={(options, state) => {
                      const input = state.inputValue.toLowerCase();
                      if (!input) return options;
                      return options.filter((m) => {
                        const name = (m.name || '').toLowerCase();
                        const generic = (m.genericName || '').toLowerCase();
                        return name.includes(input) || generic.includes(input);
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Type medicine name or generic name..."
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id || option.medicineId}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {option.name}
                            {option.active === false && <Chip label="Stopped" size="small" color="error" sx={{ ml: 1, height: 18 }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.genericName && `Generic: ${option.genericName}`}
                            {option.genericName && ' | '}
                            Stock: {option.stockQuantity ?? 0}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1} color="secondary">Search by Batch Number</Typography>
                  <Autocomplete
                    fullWidth
                    options={searchResults}
                    loading={searchLoading}
                    loadingText="Loading medicines..."
                    noOptionsText="No batch found"
                    getOptionLabel={(option) =>
                      `${option.batchNumber || 'No Batch'} - ${option.name || ''}`
                    }
                    isOptionEqualToValue={(option, value) => (option.id || option.medicineId) === (value.id || value.medicineId)}
                    value={selectedBatch}
                    onChange={(_, val) => {
                      setSelectedBatch(val);
                      if (val) openEditMedDialog(val);
                    }}
                    filterOptions={(options, state) => {
                      const input = state.inputValue.toLowerCase();
                      if (!input) return options;
                      return options.filter((m) => {
                        const batch = (m.batchNumber || '').toLowerCase();
                        const name = (m.name || '').toLowerCase();
                        return batch.includes(input) || name.includes(input);
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Type batch number..."
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id || option.medicineId}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {option.batchNumber || 'No Batch'}
                            {option.active === false && <Chip label="Stopped" size="small" color="error" sx={{ ml: 1, height: 18 }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.name}
                            {option.rackNumber && ` | Rack: ${option.rackNumber}`}
                            {` | Stock: ${option.stockQuantity ?? 0}`}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                Select a medicine from either dropdown to open the edit dialog.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>All Medicines ({searchResults.length})</Typography>
                <Box display="flex" gap={1}>
                  <Button variant="outlined" startIcon={<Download />} onClick={exportAvailableCSV} disabled={searchLoading} size="small">CSV</Button>
                  <Button variant="outlined" startIcon={<Download />} onClick={exportAvailableXLS} disabled={searchLoading} size="small">XLS</Button>
                  <Button variant="outlined" startIcon={<Refresh />} onClick={loadAllMedicines} disabled={searchLoading} size="small">Refresh</Button>
                </Box>
              </Box>
              <DataGrid
                rows={searchResults} columns={medColumns}
                getRowId={(r) => r.id || r.medicineId}
                autoHeight disableRowSelectionOnClick
                pageSize={25} rowsPerPageOptions={[25, 50, 100]}
                sx={{ minHeight: 400 }}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Import Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Import Item</DialogTitle>
        <DialogContent>
          {editRow && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Name" value={editRow.name} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Generic Name" value={editRow.genericName} onChange={(e) => setEditRow({ ...editRow, genericName: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Batch" value={editRow.batchNumber} onChange={(e) => setEditRow({ ...editRow, batchNumber: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Rack" value={editRow.rackNumber} onChange={(e) => setEditRow({ ...editRow, rackNumber: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}>
                <TextField fullWidth size="small" label="Type" select value={editRow.type} onChange={(e) => setEditRow({ ...editRow, type: e.target.value })}>
                  <MenuItem value="">Select</MenuItem>
                  {MEDICINE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Quantity" type="number" value={editRow.quantity} onChange={(e) => setEditRow({ ...editRow, quantity: parseInt(e.target.value, 10) || 1 })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Unit Price" type="number" value={editRow.unitPrice} onChange={(e) => setEditRow({ ...editRow, unitPrice: parseFloat(e.target.value) || 0 })} inputProps={{ step: 0.01 }} /></Grid>
              <Grid item xs={6} md={2}>
                <TextField fullWidth size="small" label="GST%" select value={editRow.gstRate} onChange={(e) => setEditRow({ ...editRow, gstRate: parseInt(e.target.value, 10) })}>
                  {GST_RATES.map((r) => <MenuItem key={r} value={r}>{r}%</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Supplier" value={editRow.supplier} onChange={(e) => setEditRow({ ...editRow, supplier: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Invoice" value={editRow.invoice} onChange={(e) => setEditRow({ ...editRow, invoice: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Expiry" type="date" value={editRow.expiry} onChange={(e) => setEditRow({ ...editRow, expiry: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Min Stock" type="number" value={editRow.minStock} onChange={(e) => setEditRow({ ...editRow, minStock: parseInt(e.target.value, 10) || 10 })} /></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Medicine Edit Dialog */}
      <Dialog open={editMedDialog} onClose={() => setEditMedDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Medicine</DialogTitle>
        <DialogContent>
          {editMedicine && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Name" value={editMedicine.name || ''} onChange={(e) => setEditMedicine({ ...editMedicine, name: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Generic Name" value={editMedicine.genericName || ''} onChange={(e) => setEditMedicine({ ...editMedicine, genericName: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Batch" value={editMedicine.batchNumber || ''} onChange={(e) => setEditMedicine({ ...editMedicine, batchNumber: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Rack" value={editMedicine.rackNumber || ''} onChange={(e) => setEditMedicine({ ...editMedicine, rackNumber: e.target.value })} /></Grid>
              <Grid item xs={6} md={2}>
                <TextField fullWidth size="small" label="Type" select value={editMedicine.type || ''} onChange={(e) => setEditMedicine({ ...editMedicine, type: e.target.value })}>
                  <MenuItem value="">Select</MenuItem>
                  {MEDICINE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Stock" type="number" value={editMedicine.stockQuantity ?? 0} onChange={(e) => setEditMedicine({ ...editMedicine, stockQuantity: parseInt(e.target.value, 10) || 0 })} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Purchase Price" type="number" value={editMedicine.purchasePrice ?? ''} onChange={(e) => setEditMedicine({ ...editMedicine, purchasePrice: parseFloat(e.target.value) || 0 })} inputProps={{ step: 0.01 }} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Sale Price" type="number" value={editMedicine.salePrice ?? ''} onChange={(e) => setEditMedicine({ ...editMedicine, salePrice: parseFloat(e.target.value) || 0 })} inputProps={{ step: 0.01 }} /></Grid>
              <Grid item xs={6} md={2}>
                <TextField fullWidth size="small" label="GST%" select value={editMedicine.gstRate ?? 18} onChange={(e) => setEditMedicine({ ...editMedicine, gstRate: parseInt(e.target.value, 10) })}>
                  {GST_RATES.map((r) => <MenuItem key={r} value={r}>{r}%</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Expiry Date" type="date" value={editMedicine.expiryDate || ''} onChange={(e) => setEditMedicine({ ...editMedicine, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Min Stock" type="number" value={editMedicine.lowStockThreshold ?? 10} onChange={(e) => setEditMedicine({ ...editMedicine, lowStockThreshold: parseInt(e.target.value, 10) || 10 })} /></Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth size="small" label="Status" select
                  value={editMedicine.active !== false ? 'active' : 'stopped'}
                  onChange={(e) => setEditMedicine({ ...editMedicine, active: e.target.value === 'active' })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMedDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={() => setSaveConfirmDialog(true)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={saveConfirmDialog} onClose={() => setSaveConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}><CheckCircle color="primary" />Confirm Save</Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Save changes to <strong>{editMedicine?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveConfirmDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={() => { setSaveConfirmDialog(false); saveMedicine(); }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Confirm Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><CheckCircle color="success" />Confirm Import</Box></DialogTitle>
        <DialogContent>
          <Typography mb={1}>This will create {rawData.length} new medicines and purchase records.</Typography>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" mb={1}><Typography>Items:</Typography><Typography fontWeight={600}>{rawData.length}</Typography></Box>
          <Box display="flex" justifyContent="space-between" mb={1}><Typography>Total Quantity:</Typography><Typography fontWeight={600}>{stats.totalQty.toLocaleString()}</Typography></Box>
          <Box display="flex" justifyContent="space-between" mb={1}><Typography>Subtotal:</Typography><Typography>₹{stats.totalValue.toFixed(2)}</Typography></Box>
          <Box display="flex" justifyContent="space-between" mb={1}><Typography>GST:</Typography><Typography>₹{stats.totalGST.toFixed(2)}</Typography></Box>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>Grand Total:</Typography>
            <Typography variant="h6" fontWeight={700} color="primary">₹{stats.grandTotal.toFixed(2)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setConfirmDialog(false); handleImport(); }} disabled={importing}
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}>
            {importing ? 'Importing...' : 'Confirm Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Delete Dialog */}
      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
        <DialogTitle>Delete Row?</DialogTitle>
        <DialogContent><Typography>Remove <strong>{deleteConfirm?.name}</strong> from the list?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteRow(deleteConfirm._rowId)}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Medicine Delete Dialog */}
      <Dialog open={deleteMedConfirm !== null} onClose={() => setDeleteMedConfirm(null)} maxWidth="xs">
        <DialogTitle>Delete Medicine?</DialogTitle>
        <DialogContent>
          <Typography mb={1}>Are you sure you want to delete <strong>{deleteMedConfirm?.name}</strong>?</Typography>
          <Alert severity="warning" sx={{ mt: 1 }}>
            If this medicine has purchase or sales records, deletion will fail. You must remove associated records first.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteMedConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMedicine(deleteMedConfirm)}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={resultDialog} onClose={() => setResultDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {importResult?.failCount === 0 ? <CheckCircle color="success" /> : <Warning color="warning" />}
            Import Complete
          </Box>
        </DialogTitle>
        <DialogContent>
          {importResult && (
            <>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>Successful:</Typography><Chip label={importResult.successCount} color="success" size="small" /></Box>
              <Box display="flex" justifyContent="space-between" mb={2}><Typography>Failed:</Typography><Chip label={importResult.failCount} color={importResult.failCount > 0 ? 'error' : 'default'} size="small" /></Box>
              {importResult.errors.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" mb={1}>Errors:</Typography>
                  {importResult.errors.map((e, i) => (
                    <Alert key={i} severity="error" sx={{ mb: 0.5 }}>Row {e.row}: {e.name} — {e.error}</Alert>
                  ))}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setResultDialog(false); setImportResult(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default PurchaseImport;
