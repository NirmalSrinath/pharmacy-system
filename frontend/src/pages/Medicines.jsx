import React, { useState, useEffect, useRef } from 'react';
import { medicineAPI } from '../services/api';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Download,
  Upload,
  Search,
  Medication,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const GST_RATES = [0, 5, 12, 18, 28];

const initialMedicine = {
  name: '',
  genericName: '',
  batchNumber: '',
  manufacturer: '',
  salePrice: '',
  purchasePrice: '',
  stockQuantity: '',
  gstRate: 18,
  expiryDate: '',
  description: '',
  category: '',
  dosageForm: '',
  strength: '',
  rackNumber: '',
  type: '',
};

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState(initialMedicine);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expiryFilter, setExpiryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await medicineAPI.getAll({ limit: 1000 });
      const data = res.data?.data || res.data?.content || res.data || [];
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch medicines', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openAddDialog = () => {
    setEditingMedicine(null);
    setFormData(initialMedicine);
    setDialogOpen(true);
  };

  const openEditDialog = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name || medicine.medicineName || '',
      genericName: medicine.genericName || medicine.generic_name || '',
      batchNumber: medicine.batchNumber || medicine.batch_number || '',
      manufacturer: medicine.manufacturer || '',
      salePrice: medicine.salePrice || medicine.sale_price || '',
      purchasePrice: medicine.purchasePrice || medicine.purchase_price || '',
      stockQuantity: medicine.stockQuantity || medicine.stock_quantity || '',
      gstRate: medicine.gstRate || medicine.gst_rate || 18,
      expiryDate: medicine.expiryDate || medicine.expiry_date || '',
      description: medicine.description || '',
      category: medicine.category || '',
      dosageForm: medicine.dosageForm || medicine.dosage_form || '',
      strength: medicine.strength || '',
      version: medicine.version,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Medicine name is required', severity: 'warning' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        salePrice: parseFloat(formData.salePrice) || 0,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        gstRate: parseInt(formData.gstRate) || 0,
      };

      if (editingMedicine) {
        await medicineAPI.update(editingMedicine.id || editingMedicine.medicineId, payload);
        setSnackbar({ open: true, message: 'Medicine updated successfully', severity: 'success' });
      } else {
        await medicineAPI.create(payload);
        setSnackbar({ open: true, message: 'Medicine added successfully', severity: 'success' });
      }

      setDialogOpen(false);
      fetchMedicines();
    } catch (err) {
      if (err.response?.status === 409) {
        setSnackbar({ open: true, message: 'Record was modified by another user. Refreshing...', severity: 'warning' });
        fetchMedicines();
      } else {
        const msg = err.response?.data?.message || 'Failed to save medicine';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await medicineAPI.delete(deleteTarget.id || deleteTarget.medicineId);
      setSnackbar({ open: true, message: 'Medicine deleted successfully', severity: 'success' });
      setDeleteDialog(false);
      setDeleteTarget(null);
      fetchMedicines();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete medicine';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            await medicineAPI.importCSV(results.data.filter((r) => r.name || r.Name));
            setSnackbar({ open: true, message: 'Medicines imported successfully', severity: 'success' });
            fetchMedicines();
          } catch (err) {
            setSnackbar({ open: true, message: 'Failed to import medicines', severity: 'error' });
          }
        },
        error: () => {
          setSnackbar({ open: true, message: 'Failed to parse CSV file', severity: 'error' });
        },
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          await medicineAPI.importCSV(data);
          setSnackbar({ open: true, message: 'Medicines imported successfully', severity: 'success' });
          fetchMedicines();
        } catch (err) {
          setSnackbar({ open: true, message: 'Failed to import XLS file', severity: 'error' });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
  };

  const exportCSV = () => {
    const csv = Papa.unparse(
      medicines.map((m) => ({
        Name: m.name || m.medicineName || '',
        'Generic Name': m.genericName || m.generic_name || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        Manufacturer: m.manufacturer || '',
        'Sale Price': m.salePrice || m.sale_price || 0,
        'Purchase Price': m.purchasePrice || m.purchase_price || 0,
        'Stock Qty': m.stockQuantity || m.stock_quantity || 0,
        'GST%': m.gstRate || m.gst_rate || 0,
        'Expiry Date': m.expiryDate || m.expiry_date || '',
        Category: m.category || '',
      }))
    );
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'medicines.csv');
  };

  const exportXLS = () => {
    const ws = XLSX.utils.json_to_sheet(
      medicines.map((m) => ({
        Name: m.name || m.medicineName || '',
        'Generic Name': m.genericName || m.generic_name || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        Manufacturer: m.manufacturer || '',
        'Sale Price': m.salePrice || m.sale_price || 0,
        'Purchase Price': m.purchasePrice || m.purchase_price || 0,
        'Stock Qty': m.stockQuantity || m.stock_quantity || 0,
        'GST%': m.gstRate || m.gst_rate || 0,
        'Expiry Date': m.expiryDate || m.expiry_date || '',
        Category: m.category || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medicines');
    XLSX.writeFile(wb, 'medicines.xlsx');
  };

  const filteredMedicines = medicines.filter((m) => {
    const name = m.name || m.medicineName || '';
    const generic = m.genericName || m.generic_name || '';
    const batch = m.batchNumber || m.batch_number || '';
    const matchesSearch =
      !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      generic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.toLowerCase().includes(searchQuery.toLowerCase());

    const stock = m.stockQuantity || m.stock_quantity || 0;
    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = stock <= 10 && stock > 0;
    else if (stockFilter === 'out') matchesStock = stock <= 0;
    else if (stockFilter === 'available') matchesStock = stock > 10;

    let matchesExpiry = true;
    if (expiryFilter) {
      const exp = m.expiryDate || m.expiry_date;
      if (exp) {
        const daysLeft = Math.ceil((new Date(exp) - new Date()) / (1000 * 60 * 60 * 24));
        if (expiryFilter === 'expired') matchesExpiry = daysLeft < 0;
        else if (expiryFilter === '30days') matchesExpiry = daysLeft >= 0 && daysLeft <= 30;
        else if (expiryFilter === '90days') matchesExpiry = daysLeft >= 0 && daysLeft <= 90;
      } else {
        matchesExpiry = false;
      }
    }

    return matchesSearch && matchesStock && matchesExpiry;
  });

  const columns = [
    {
      field: 'name',
      headerName: 'Medicine',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => params.row.name || params.row.medicineName || '',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.genericName || params.row.generic_name || ''}
          </Typography>
        </Box>
      ),
    },
    { field: 'batchNumber', headerName: 'Batch No', width: 120,
      valueGetter: (params) => params.row.batchNumber || params.row.batch_number || '' },
    { field: 'manufacturer', headerName: 'Manufacturer', width: 140,
      valueGetter: (params) => params.row.manufacturer || '' },
    { field: 'stockQuantity', headerName: 'Stock', width: 80, type: 'number',
      valueGetter: (params) => params.row.stockQuantity || params.row.stock_quantity || 0 },
    { field: 'salePrice', headerName: 'Sale Price', width: 100, type: 'number',
      valueGetter: (params) => params.row.salePrice || params.row.sale_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}` },
    { field: 'purchasePrice', headerName: 'Purchase Price', width: 120, type: 'number',
      valueGetter: (params) => params.row.purchasePrice || params.row.purchase_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}` },
    { field: 'gstRate', headerName: 'GST%', width: 70,
      valueGetter: (params) => params.row.gstRate || params.row.gst_rate || 0,
      renderCell: (params) => `${params.value}%` },
    { field: 'expiryDate', headerName: 'Expiry', width: 120,
      valueGetter: (params) => params.row.expiryDate || params.row.expiry_date,
      renderCell: (params) => {
        if (!params.value) return '-';
        try { return format(new Date(params.value), 'MMM yyyy'); }
        catch { return '-'; }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => openEditDialog(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => { setDeleteTarget(params.row); setDeleteDialog(true); }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Medicines</Typography>
        <Box display="flex" gap={1}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <Button variant="outlined" startIcon={<Upload />} onClick={() => fileInputRef.current?.click()} size="small">
            Import
          </Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportXLS} size="small">XLS</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add Medicine
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField
              size="small" placeholder="Search medicines..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ minWidth: 250 }}
            />
            <TextField
              size="small" label="Stock Filter" select
              value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="available">Available (&gt;10)</MenuItem>
              <MenuItem value="low">Low Stock (&lt;10)</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </TextField>
            <TextField
              size="small" label="Expiry Filter" select
              value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="30days">Within 30 Days</MenuItem>
              <MenuItem value="90days">Within 90 Days</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={filteredMedicines}
          columns={columns}
          loading={loading}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ minHeight: 500 }}
          getRowId={(row) => row.id || row.medicineId}
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Medication color="primary" />
            {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Medicine Name *"
                value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Generic Name"
                value={formData.genericName} onChange={(e) => handleFormChange('genericName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Batch Number"
                value={formData.batchNumber} onChange={(e) => handleFormChange('batchNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Manufacturer"
                value={formData.manufacturer} onChange={(e) => handleFormChange('manufacturer', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Category"
                value={formData.category} onChange={(e) => handleFormChange('category', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Sale Price (₹)" type="number"
                value={formData.salePrice} onChange={(e) => handleFormChange('salePrice', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Purchase Price (₹)" type="number"
                value={formData.purchasePrice} onChange={(e) => handleFormChange('purchasePrice', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Stock Quantity" type="number"
                value={formData.stockQuantity} onChange={(e) => handleFormChange('stockQuantity', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="GST Rate" select
                value={formData.gstRate} onChange={(e) => handleFormChange('gstRate', parseInt(e.target.value))}
              >
                {GST_RATES.map((rate) => (
                  <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Expiry Date" type="date"
                value={formData.expiryDate} onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Dosage Form"
                value={formData.dosageForm} onChange={(e) => handleFormChange('dosageForm', e.target.value)}
                placeholder="e.g., Tablet, Syrup, Injection"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Strength"
                value={formData.strength} onChange={(e) => handleFormChange('strength', e.target.value)}
                placeholder="e.g., 500mg, 10ml"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Description" multiline rows={2}
                value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSubmit} disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} /> : null}
          >
            {formLoading ? 'Saving...' : editingMedicine ? 'Update' : 'Add Medicine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Medicine</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name || deleteTarget?.medicineName}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
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

export default Medicines;
