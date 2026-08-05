import React, { useState, useEffect } from 'react';
import { medicineAPI } from '../services/api';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Download,
  FilterList,
  Warning,
  Error,
  CheckCircle,
  Edit,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

function Stock() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
      setSnackbar({ open: true, message: 'Failed to fetch stock data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Unknown', color: 'default' };
    try {
      const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : new Date(expiryDate);
      const daysLeft = differenceInDays(expiry, new Date());
      if (daysLeft < 0) return { label: 'Expired', color: 'error' };
      if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'error' };
      if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: 'warning' };
      return { label: `${daysLeft}d left`, color: 'success' };
    } catch {
      return { label: 'Unknown', color: 'default' };
    }
  };

  const getStockStatus = (qty, lowThreshold = 10) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'error' };
    if (qty <= lowThreshold) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
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

    const stockQty = m.stockQuantity || m.stock_quantity || 0;
    const matchesLowStock = !lowStockOnly || stockQty <= 10;

    const expiryDate = m.expiryDate || m.expiry_date;
    let matchesExpiry = true;
    if (expiringSoon && expiryDate) {
      try {
        const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : new Date(expiryDate);
        const daysLeft = differenceInDays(expiry, new Date());
        matchesExpiry = daysLeft <= 90;
      } catch {
        matchesExpiry = false;
      }
    }

    let matchesDateRange = true;
    if (dateFrom && expiryDate) {
      matchesDateRange = new Date(expiryDate) >= new Date(dateFrom);
    }
    if (dateTo && expiryDate) {
      matchesDateRange = matchesDateRange && new Date(expiryDate) <= new Date(dateTo);
    }

    return matchesSearch && matchesLowStock && matchesExpiry && matchesDateRange;
  });

  const columns = [
    {
      field: 'name',
      headerName: 'Medicine Name',
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
    {
      field: 'batchNumber',
      headerName: 'Batch No',
      width: 120,
      valueGetter: (params) => params.row.batchNumber || params.row.batch_number || '',
    },
    {
      field: 'stockQuantity',
      headerName: 'Stock Qty',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.stockQuantity || params.row.stock_quantity || 0,
      renderCell: (params) => {
        const status = getStockStatus(params.value);
        return (
          <Chip
            label={params.value}
            size="small"
            color={status.color}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'salePrice',
      headerName: 'Sale Price',
      width: 110,
      type: 'number',
      valueGetter: (params) => params.row.salePrice || params.row.sale_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}`,
    },
    {
      field: 'purchasePrice',
      headerName: 'Purchase Price',
      width: 120,
      type: 'number',
      valueGetter: (params) => params.row.purchasePrice || params.row.purchase_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}`,
    },
    {
      field: 'gstRate',
      headerName: 'GST%',
      width: 70,
      valueGetter: (params) => params.row.gstRate || params.row.gst_rate || 0,
      renderCell: (params) => `${params.value}%`,
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 130,
      valueGetter: (params) => params.row.expiryDate || params.row.expiry_date,
      renderCell: (params) => {
        if (!params.value) return '-';
        const status = getExpiryStatus(params.value);
        return (
          <Box>
            <Typography variant="body2">
              {format(new Date(params.value), 'dd MMM yyyy')}
            </Typography>
            <Chip label={status.label} size="small" color={status.color} sx={{ mt: 0.5 }} />
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const stock = params.row.stockQuantity || params.row.stock_quantity || 0;
        const stockStatus = getStockStatus(stock);
        const expiryStatus = getExpiryStatus(params.row.expiryDate || params.row.expiry_date);
        const worstStatus = stockStatus.color === 'error' || expiryStatus.color === 'error' ? 'error' :
                           stockStatus.color === 'warning' || expiryStatus.color === 'warning' ? 'warning' : 'success';
        const label = stockStatus.color === 'error' ? stockStatus.label :
                     expiryStatus.color === 'error' ? expiryStatus.label :
                     stockStatus.color === 'warning' ? stockStatus.label :
                     expiryStatus.color === 'warning' ? expiryStatus.label : 'OK';
        return <Chip label={label} size="small" color={worstStatus} />;
      },
    },
  ];

  const exportCSV = () => {
    const csv = Papa.unparse(
      filteredMedicines.map((m) => ({
        Name: m.name || m.medicineName || '',
        'Generic Name': m.genericName || m.generic_name || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        'Stock Qty': m.stockQuantity || m.stock_quantity || 0,
        'Sale Price': m.salePrice || m.sale_price || 0,
        'Purchase Price': m.purchasePrice || m.purchase_price || 0,
        'GST%': m.gstRate || m.gst_rate || 0,
        'Expiry Date': m.expiryDate || m.expiry_date || '',
      }))
    );
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'stock-report.csv');
    setSnackbar({ open: true, message: 'Stock report exported successfully', severity: 'success' });
  };

  const exportXLS = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredMedicines.map((m) => ({
        Name: m.name || m.medicineName || '',
        'Generic Name': m.genericName || m.generic_name || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        'Stock Qty': m.stockQuantity || m.stock_quantity || 0,
        'Sale Price': m.salePrice || m.sale_price || 0,
        'Purchase Price': m.purchasePrice || m.purchase_price || 0,
        'GST%': m.gstRate || m.gst_rate || 0,
        'Expiry Date': m.expiryDate || m.expiry_date || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    XLSX.writeFile(wb, 'stock-report.xlsx');
    setSnackbar({ open: true, message: 'Stock report exported successfully', severity: 'success' });
  };

  const lowStockCount = medicines.filter(
    (m) => (m.stockQuantity || m.stock_quantity || 0) <= 10 && (m.stockQuantity || m.stock_quantity || 0) > 0
  ).length;
  const outOfStockCount = medicines.filter(
    (m) => (m.stockQuantity || m.stock_quantity || 0) <= 0
  ).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Stock Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Total medicines: {medicines.length} | Low stock: {lowStockCount} | Out of stock: {outOfStockCount}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportXLS} size="small">XLS</Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField
              size="small" placeholder="Search medicines..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ minWidth: 250 }}
            />
            <TextField
              size="small" type="date" label="Expiry From"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />
            <TextField
              size="small" type="date" label="Expiry To"
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  color="warning"
                />
              }
              label="Low Stock Only"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={expiringSoon}
                  onChange={(e) => setExpiringSoon(e.target.checked)}
                  color="error"
                />
              }
              label="Expiring Soon"
            />
            <Button variant="outlined" size="small" onClick={fetchMedicines}>
              Refresh
            </Button>
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
          sx={{
            minHeight: 500,
            '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' },
          }}
          getRowId={(row) => row.id || row.medicineId}
        />
      </Card>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
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

export default Stock;
