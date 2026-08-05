import React, { useState, useEffect } from 'react';
import { purchaseAPI, medicineAPI } from '../services/api';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Autocomplete,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ShoppingCart,
  CheckCircle,
  Download,
  Upload,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const GST_RATES = [0, 5, 12, 18, 28];

const emptyForm = {
  selectedMedicine: null,
  newMedicine: false,
  medicineName: '',
  genericName: '',
  batchNumber: '',
  rackNumber: '',
  medicineType: '',
  quantity: '',
  unitPrice: '',
  gstRate: 18,
  supplierName: '',
  invoiceNumber: '',
  expiryDate: '',
  lowStockThreshold: 10,
};

function Purchases() {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [purchaseList, setPurchaseList] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMedicines();
    fetchPurchaseHistory();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchMedicines = async () => {
    try {
      const res = await medicineAPI.getAll({ limit: 1000 });
      const data = res.data?.data || res.data?.content || res.data || [];
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch medicines');
    }
  };

  const fetchPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await purchaseAPI.getAll(params);
      const data = res.data?.data || res.data?.content || res.data || [];
      setPurchaseHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch purchase history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const calculateGST = (price, qty, gst) => {
    const subtotal = price * qty;
    const gstAmount = (subtotal * gst) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    return { subtotal, gstAmount, cgst, sgst, total: subtotal + gstAmount };
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleAddToPurchase = () => {
    if (form.newMedicine) {
      if (!form.medicineName.trim() || !form.quantity || !form.unitPrice) {
        setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' });
        return;
      }
    } else {
      if (!form.selectedMedicine || !form.quantity || !form.unitPrice) {
        setSnackbar({ open: true, message: 'Please select medicine and fill quantities', severity: 'warning' });
        return;
      }
    }

    const qty = parseInt(form.quantity, 10);
    const price = parseFloat(form.unitPrice);
    const { subtotal, gstAmount, cgst, sgst, total } = calculateGST(price, qty, form.gstRate);

    const item = {
      id: editingId || Date.now(),
      medicineId: form.newMedicine ? null : (form.selectedMedicine.id || form.selectedMedicine.medicineId),
      medicineName: form.newMedicine ? form.medicineName : form.selectedMedicine.name,
      genericName: form.newMedicine ? form.genericName : (form.selectedMedicine.genericName || ''),
      batchNumber: form.batchNumber || (form.newMedicine ? '' : (form.selectedMedicine.batchNumber || '')),
      rackNumber: form.rackNumber || (form.newMedicine ? '' : (form.selectedMedicine.rackNumber || '')),
      medicineType: form.medicineType || (form.newMedicine ? '' : (form.selectedMedicine.type || '')),
      quantity: qty,
      unitPrice: price,
      gstRate: form.gstRate,
      cgst,
      sgst,
      gstAmount,
      subtotal,
      total,
      isNew: form.newMedicine,
      supplierName: form.supplierName,
      invoiceNumber: form.invoiceNumber,
      expiryDate: form.expiryDate,
      lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 10,
    };

    if (editingId) {
      setPurchaseList((prev) => prev.map((i) => (i.id === editingId ? item : i)));
      setSnackbar({ open: true, message: 'Item updated', severity: 'success' });
    } else {
      setPurchaseList((prev) => [...prev, item]);
      setSnackbar({ open: true, message: 'Item added', severity: 'success' });
    }

    resetForm();
  };

  const handleEditItem = (item) => {
    setEditingId(item.id);
    setForm({
      selectedMedicine: item.isNew ? null : medicines.find((m) => m.id === item.medicineId) || null,
      newMedicine: item.isNew,
      medicineName: item.isNew ? item.medicineName : '',
      genericName: item.isNew ? (item.genericName || '') : '',
      batchNumber: item.batchNumber || '',
      rackNumber: item.rackNumber || '',
      medicineType: item.medicineType || '',
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      gstRate: item.gstRate,
      supplierName: item.supplierName || '',
      invoiceNumber: item.invoiceNumber || '',
      expiryDate: item.expiryDate || '',
      lowStockThreshold: item.lowStockThreshold || 10,
    });
  };

  const handleRemoveFromList = (id) => {
    setPurchaseList(purchaseList.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  const handleConfirmPurchase = async () => {
    setConfirmLoading(true);
    try {
      let createdCount = 0;
      for (const item of purchaseList) {
        let medicineId = item.medicineId;

        if (item.isNew || medicineId == null) {
          const medRes = await medicineAPI.create({
            name: item.medicineName,
            genericName: item.genericName || '',
            batchNumber: item.batchNumber || '',
            rackNumber: item.rackNumber || '',
            type: item.medicineType || '',
            salePrice: item.unitPrice * 1.1,
            purchasePrice: item.unitPrice,
            stockQuantity: 0,
            gstRate: item.gstRate,
            expiryDate: item.expiryDate || '2027-12-31',
            lowStockThreshold: item.lowStockThreshold || 10,
          });
          const createdMed = medRes.data?.data || medRes.data;
          medicineId = createdMed.id || createdMed.medicineId;
        }

        await purchaseAPI.create({
          medicineId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          gstRate: String(item.gstRate),
          supplierName: item.supplierName || '',
          invoiceNumber: item.invoiceNumber || '',
          rackNumber: item.rackNumber || '',
          medicineType: item.medicineType || '',
        });
        createdCount++;
      }

      setSnackbar({ open: true, message: `${createdCount} purchase(s) recorded successfully!`, severity: 'success' });
      setPurchaseList([]);
      setConfirmDialog(false);
      fetchPurchaseHistory();
      fetchMedicines();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record purchase';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const listTotals = purchaseList.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.subtotal,
      gstAmount: acc.gstAmount + item.gstAmount,
      total: acc.total + item.total,
    }),
    { subtotal: 0, gstAmount: 0, total: 0 }
  );

  const exportCSV = () => {
    const csv = Papa.unparse(
      purchaseHistory.map((p) => ({
        ID: p.id,
        Medicine: p.medicineName || p.medicine_name || '',
        Quantity: p.quantity,
        'Unit Price': p.unitPrice || p.unit_price || 0,
        'GST Rate': p.gstRate || p.gst_rate || 0,
        Total: p.totalAmount || p.total_amount || p.total || 0,
        Supplier: p.supplierName || p.supplier_name || '',
        'Invoice #': p.invoiceNumber || p.invoice_number || '',
        Date: format(new Date(p.createdAt || p.created_at || p.purchaseDate), 'yyyy-MM-dd'),
      }))
    );
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'purchases.csv');
  };

  const exportXLS = () => {
    const ws = XLSX.utils.json_to_sheet(
      purchaseHistory.map((p) => ({
        ID: p.id,
        Medicine: p.medicineName || p.medicine_name || '',
        Quantity: p.quantity,
        'Unit Price': p.unitPrice || p.unit_price || 0,
        'GST Rate': p.gstRate || p.gst_rate || 0,
        Total: p.totalAmount || p.total_amount || p.total || 0,
        Supplier: p.supplierName || p.supplier_name || '',
        'Invoice #': p.invoiceNumber || p.invoice_number || '',
        Date: format(new Date(p.createdAt || p.created_at || p.purchaseDate), 'yyyy-MM-dd'),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
    XLSX.writeFile(wb, 'purchases.xlsx');
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const parseRows = (rows) => {
      const getVal = (row, ...keys) => {
        for (const k of keys) {
          const match = Object.keys(row).find((rk) => rk.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, ''));
          if (match && row[match] !== undefined && row[match] !== '') return row[match];
        }
        return '';
      };

      const imported = rows
        .filter((r) => getVal(r, 'name', 'medicinename', 'medicine_name', 'productname', 'itemname') !== '')
        .map((r, idx) => {
          const name = String(getVal(r, 'name', 'medicinename', 'medicine_name', 'productname', 'itemname')).trim();
          const genericName = String(getVal(r, 'genericname', 'generic_name', 'composition')).trim();
          const batchNumber = String(getVal(r, 'batchnumber', 'batch_number', 'batch', 'batchno')).trim();
          const rackNumber = String(getVal(r, 'racknumber', 'rack_number', 'rack', 'rackno')).trim();
          const medicineType = String(getVal(r, 'medicinetype', 'medicine_type', 'type', 'form')).trim().toLowerCase();
          const qty = parseInt(getVal(r, 'quantity', 'qty', 'stock', 'stockquantity'), 10) || 0;
          const price = parseFloat(getVal(r, 'unitprice', 'unit_price', 'price', 'cost', 'purchaseprice', 'purchase_price', 'mrp')) || 0;
          const gst = parseFloat(getVal(r, 'strate', 'gst_rate', 'gst', 'gstpercent', 'gst_percent', 'tax')) || 18;
          const supplier = String(getVal(r, 'suppliername', 'supplier_name', 'supplier', 'vendor')).trim();
          const invoice = String(getVal(r, 'invoicenumber', 'invoice_number', 'invoice', 'invoiceno')).trim();
          const expiry = String(getVal(r, 'expirydate', 'expiry_date', 'expiry', 'expdate')).trim();
          const lowStock = parseInt(getVal(r, 'minstock', 'min_stock', 'lowstockthreshold', 'low_stock_threshold', 'reorderlevel', 'reorder_level'), 10) || 10;

          const qtyNum = qty > 0 ? qty : 1;
          const { subtotal, gstAmount, cgst, sgst, total } = calculateGST(price, qtyNum, gst);

          return {
            id: Date.now() + idx,
            medicineId: null,
            medicineName: name,
            genericName,
            batchNumber,
            rackNumber,
            medicineType,
            quantity: qtyNum,
            unitPrice: price,
            gstRate: gst,
            cgst,
            sgst,
            gstAmount,
            subtotal,
            total,
            isNew: true,
            supplierName: supplier,
            invoiceNumber: invoice,
            expiryDate: expiry,
            lowStockThreshold: lowStock,
          };
        });

      if (imported.length > 0) {
        setPurchaseList((prev) => [...prev, ...imported]);
        setSnackbar({ open: true, message: `${imported.length} item(s) imported successfully`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'No valid rows found in file. Required columns: Name, Quantity, Unit Price', severity: 'warning' });
      }
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => parseRows(results.data),
        error: () => setSnackbar({ open: true, message: 'Failed to parse CSV file', severity: 'error' }),
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          parseRows(data);
        } catch {
          setSnackbar({ open: true, message: 'Failed to parse XLS file', severity: 'error' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setSnackbar({ open: true, message: 'Unsupported file format. Use CSV or XLS/XLSX', severity: 'warning' });
    }
    event.target.value = '';
  };

  const historyColumns = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'medicineName', headerName: 'Medicine', flex: 1, minWidth: 150,
      valueGetter: (params) => params.row.medicineName || params.row.medicine_name || '' },
    { field: 'rackNumber', headerName: 'Rack', width: 80,
      valueGetter: (params) => params.row.rackNumber || params.row.rack_number || '' },
    { field: 'quantity', headerName: 'Qty', width: 70 },
    { field: 'unitPrice', headerName: 'Unit Price', width: 100, type: 'number',
      valueGetter: (params) => params.row.unitPrice || params.row.unit_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}` },
    { field: 'gstRate', headerName: 'GST%', width: 70,
      valueGetter: (params) => params.row.gstRate || params.row.gst_rate || 0,
      renderCell: (params) => `${params.value}%` },
    { field: 'total', headerName: 'Total', width: 120, type: 'number',
      valueGetter: (params) => params.row.totalAmount || params.row.total_amount || params.row.total || 0,
      renderCell: (params) => <Typography fontWeight={600}>₹{Number(params.value).toLocaleString('en-IN')}</Typography> },
    { field: 'supplierName', headerName: 'Supplier', flex: 1, minWidth: 120,
      valueGetter: (params) => params.row.supplierName || params.row.supplier_name || '' },
    { field: 'createdAt', headerName: 'Date', width: 120,
      valueGetter: (params) => params.row.createdAt || params.row.created_at || params.row.purchaseDate,
      valueFormatter: (params) => {
        try { return format(new Date(params.value), 'dd MMM yyyy'); }
        catch { return '-'; }
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Purchases</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button
            variant="contained"
            component="label"
            startIcon={<Upload />}
            size="small"
          >
            Import XLS/CSV
            <input
              type="file"
              hidden
              accept=".csv,.xlsx,.xls"
              onChange={handleImportFile}
            />
          </Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportXLS} size="small">XLS</Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            {editingId ? 'Edit Purchase Item' : 'Add Purchase Item'}
          </Typography>

          <Box display="flex" gap={1} mb={2}>
            <Button
              variant={!form.newMedicine ? 'contained' : 'outlined'}
              onClick={() => { updateForm('newMedicine', false); updateForm('selectedMedicine', null); }}
              size="small"
            >
              Existing Medicine
            </Button>
            <Button
              variant={form.newMedicine ? 'contained' : 'outlined'}
              onClick={() => { updateForm('newMedicine', true); updateForm('selectedMedicine', null); }}
              size="small"
            >
              New Medicine
            </Button>
          </Box>

          <Grid container spacing={2}>
            {!form.newMedicine ? (
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={medicines}
                  getOptionLabel={(option) => option.name || ''}
                  value={form.selectedMedicine}
                  onChange={(_, val) => updateForm('selectedMedicine', val)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Medicine" size="small" fullWidth />
                  )}
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth size="small" label="Medicine Name *"
                    value={form.medicineName} onChange={(e) => updateForm('medicineName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth size="small" label="Generic Name"
                    value={form.genericName} onChange={(e) => updateForm('genericName', e.target.value)}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Batch No."
                value={form.batchNumber} onChange={(e) => updateForm('batchNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Quantity *" type="number"
                value={form.quantity} onChange={(e) => updateForm('quantity', e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Unit Price (₹) *" type="number"
                value={form.unitPrice} onChange={(e) => updateForm('unitPrice', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="GST Rate" select
                value={form.gstRate} onChange={(e) => updateForm('gstRate', parseInt(e.target.value, 10))}
              >
                {GST_RATES.map((rate) => (
                  <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Expiry Date" type="date"
                value={form.expiryDate} onChange={(e) => updateForm('expiryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Supplier Name"
                value={form.supplierName} onChange={(e) => updateForm('supplierName', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Invoice No."
                value={form.invoiceNumber} onChange={(e) => updateForm('invoiceNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Rack Number"
                value={form.rackNumber} onChange={(e) => updateForm('rackNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Medicine Type" select
                value={form.medicineType} onChange={(e) => updateForm('medicineType', e.target.value)}
              >
                <MenuItem value="">Select</MenuItem>
                {['tablet', 'capsule', 'syrup', 'ointment', 'injection', 'drops', 'inhaler', 'powder', 'gel', 'spray'].map((t) => (
                  <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth size="small" label="Min Stock" type="number"
                value={form.lowStockThreshold} onChange={(e) => updateForm('lowStockThreshold', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={2} display="flex" gap={1}>
              <Button
                fullWidth variant="contained" startIcon={<Add />}
                onClick={handleAddToPurchase}
                sx={{ height: 40 }}
              >
                {editingId ? 'Update' : 'Add'}
              </Button>
              {editingId && (
                <Button
                  fullWidth variant="outlined" color="inherit"
                  onClick={resetForm}
                  sx={{ height: 40 }}
                >
                  Cancel
                </Button>
              )}
            </Grid>
          </Grid>

          {form.quantity && form.unitPrice && (
            <Box mt={2} p={1.5} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                GST Breakdown: CGST ({form.gstRate / 2}%) = ₹{((parseFloat(form.unitPrice || 0) * parseInt(form.quantity || 0) * form.gstRate / 2) / 100).toFixed(2)} |
                SGST ({form.gstRate / 2}%) = ₹{((parseFloat(form.unitPrice || 0) * parseInt(form.quantity || 0) * form.gstRate / 2) / 100).toFixed(2)} |
                Total with GST = ₹{(parseFloat(form.unitPrice || 0) * parseInt(form.quantity || 0) * (1 + form.gstRate / 100)).toFixed(2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {purchaseList.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Purchase Items ({purchaseList.length})
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<ShoppingCart />}
                onClick={() => setConfirmDialog(true)}
              >
                Confirm Purchase
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rack</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">GST%</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">CGST</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">SGST</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item.medicineName}</Typography>
                        {item.isNew && <Chip label="New" size="small" color="info" sx={{ mt: 0.5 }} />}
                      </TableCell>
                      <TableCell>{item.batchNumber || '-'}</TableCell>
                      <TableCell>{item.rackNumber || '-'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.gstRate}%</TableCell>
                      <TableCell align="right">₹{item.cgst.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{item.sgst.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>₹{item.total.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleEditItem(item)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleRemoveFromList(item.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={3}>
              <Typography variant="body2" color="text.secondary">
                Subtotal: ₹{listTotals.subtotal.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                GST: ₹{listTotals.gstAmount.toFixed(2)}
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                Total: ₹{listTotals.total.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>Purchase History</Typography>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small" type="date" label="From"
                value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <TextField
                size="small" type="date" label="To"
                value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Button variant="outlined" onClick={fetchPurchaseHistory} size="small">
                Filter
              </Button>
            </Box>
          </Box>
          <DataGrid
            rows={purchaseHistory}
            columns={historyColumns}
            loading={historyLoading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Confirm Purchase
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography mb={1}>Items: {purchaseList.length}</Typography>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Subtotal:</Typography><Typography>₹{listTotals.subtotal.toFixed(2)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>GST (CGST + SGST):</Typography><Typography>₹{listTotals.gstAmount.toFixed(2)}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>Grand Total:</Typography>
            <Typography variant="h6" fontWeight={700} color="primary">₹{listTotals.total.toFixed(2)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button
            variant="contained" onClick={handleConfirmPurchase} disabled={confirmLoading}
            startIcon={confirmLoading ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {confirmLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Purchases;
