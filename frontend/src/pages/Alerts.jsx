import React, { useState, useEffect } from 'react';
import { medicineAPI } from '../services/api';
import { format, differenceInDays, parseISO } from 'date-fns';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Download,
  Warning,
  Error,
  AccessTime,
  Search,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

function Alerts() {
  const [activeTab, setActiveTab] = useState(0);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expiryDays, setExpiryDays] = useState(30);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [appliedExpiryDays, setAppliedExpiryDays] = useState(30);
  const [appliedLowStockThreshold, setAppliedLowStockThreshold] = useState(10);

  useEffect(() => {
    fetchAlerts();
  }, [appliedExpiryDays, appliedLowStockThreshold]);

  const handleApplyFilter = () => {
    setAppliedExpiryDays(expiryDays);
    setAppliedLowStockThreshold(lowStockThreshold);
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [expiryRes, lowStockRes] = await Promise.allSettled([
        medicineAPI.getExpiryAlerts({ days: appliedExpiryDays }),
        medicineAPI.getLowStock({ threshold: appliedLowStockThreshold }),
      ]);

      if (expiryRes.status === 'fulfilled') {
        const data = expiryRes.value.data?.data || expiryRes.value.data?.content || expiryRes.value.data || [];
        setExpiryAlerts(Array.isArray(data) ? data : []);
      } else {
        setExpiryAlerts([]);
      }

      if (lowStockRes.status === 'fulfilled') {
        const data = lowStockRes.value.data?.data || lowStockRes.value.data?.content || lowStockRes.value.data || [];
        setLowStockAlerts(Array.isArray(data) ? data : []);
      } else {
        setLowStockAlerts([]);
      }
    } catch (err) {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Unknown', color: 'default', severity: 'info' };
    try {
      const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : new Date(expiryDate);
      const daysLeft = differenceInDays(expiry, new Date());
      if (daysLeft < 0) return { label: 'Expired', color: 'error', severity: 'error', daysLeft };
      if (daysLeft <= 30) return { label: `${daysLeft} days`, color: 'error', severity: 'warning', daysLeft };
      if (daysLeft <= 90) return { label: `${daysLeft} days`, color: 'warning', severity: 'info', daysLeft };
      return { label: `${daysLeft} days`, color: 'success', severity: 'success', daysLeft };
    } catch {
      return { label: 'Invalid', color: 'default', severity: 'info', daysLeft: 999 };
    }
  };

  const filteredExpiry = expiryAlerts.filter((m) => {
    if (!searchQuery) return true;
    const name = m.name || m.medicineName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    const statusA = getExpiryStatus(a.expiryDate || a.expiry_date);
    const statusB = getExpiryStatus(b.expiryDate || b.expiry_date);
    return statusA.daysLeft - statusB.daysLeft;
  });

  const filteredLowStock = lowStockAlerts.filter((m) => {
    if (!searchQuery) return true;
    const name = m.name || m.medicineName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    const qtyA = a.stockQuantity || a.stock_quantity || 0;
    const qtyB = b.stockQuantity || b.stock_quantity || 0;
    return qtyA - qtyB;
  });

  const expiryColumns = [
    {
      field: 'name',
      headerName: 'Medicine',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.name || params.row.medicineName || '',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            Batch: {params.row.batchNumber || params.row.batch_number || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 150,
      valueGetter: (params) => params.row.expiryDate || params.row.expiry_date,
      renderCell: (params) => {
        if (!params.value) return '-';
        const status = getExpiryStatus(params.value);
        return (
          <Box>
            <Typography variant="body2">{format(new Date(params.value), 'dd MMM yyyy')}</Typography>
            <Chip
              label={status.label}
              size="small"
              color={status.color}
              sx={{ mt: 0.5 }}
            />
          </Box>
        );
      },
    },
    {
      field: 'stockQuantity',
      headerName: 'Stock',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.stockQuantity || params.row.stock_quantity || 0,
    },
    {
      field: 'salePrice',
      headerName: 'Price',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.salePrice || params.row.sale_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}`,
    },
    {
      field: 'urgency',
      headerName: 'Urgency',
      width: 120,
      renderCell: (params) => {
        const status = getExpiryStatus(params.row.expiryDate || params.row.expiry_date);
        if (status.daysLeft < 0) return <Chip label="Expired" color="error" size="small" />;
        if (status.daysLeft <= 30) return <Chip label="Critical" color="error" size="small" />;
        if (status.daysLeft <= 60) return <Chip label="Warning" color="warning" size="small" />;
        return <Chip label="Monitor" color="info" size="small" />;
      },
    },
  ];

  const lowStockColumns = [
    {
      field: 'name',
      headerName: 'Medicine',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.name || params.row.medicineName || '',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            Batch: {params.row.batchNumber || params.row.batch_number || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'stockQuantity',
      headerName: 'Current Stock',
      width: 120,
      type: 'number',
      valueGetter: (params) => params.row.stockQuantity || params.row.stock_quantity || 0,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value <= 0 ? 'error' : params.value <= 5 ? 'error' : 'warning'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'minStockLevel',
      headerName: 'Min Level',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.lowStockThreshold || params.row.low_stock_threshold || params.row.minStockLevel || 10,
    },
    {
      field: 'shortage',
      headerName: 'Shortage',
      width: 100,
      type: 'number',
      renderCell: (params) => {
        const stock = params.row.stockQuantity || params.row.stock_quantity || 0;
        const min = params.row.lowStockThreshold || params.row.low_stock_threshold || params.row.minStockLevel || 10;
        const shortage = Math.max(0, min - stock);
        return (
          <Typography color="error" fontWeight={600}>
            {shortage > 0 ? `-${shortage}` : '-'}
          </Typography>
        );
      },
    },
    {
      field: 'salePrice',
      headerName: 'Price',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.salePrice || params.row.sale_price || 0,
      renderCell: (params) => `₹${Number(params.value).toFixed(2)}`,
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => {
        const stock = params.row.stockQuantity || params.row.stock_quantity || 0;
        const min = params.row.lowStockThreshold || params.row.low_stock_threshold || params.row.minStockLevel || 10;
        if (stock <= 0) return <Chip label="Out of Stock" color="error" size="small" />;
        if (stock <= min * 0.2) return <Chip label="Critical" color="error" size="small" />;
        if (stock <= min * 0.5) return <Chip label="Low" color="warning" size="small" />;
        return <Chip label="Monitor" color="info" size="small" />;
      },
    },
  ];

  const exportAlerts = () => {
    const allAlerts = [
      ...filteredExpiry.map((m) => ({
        Type: 'Expiry Alert',
        Medicine: m.name || m.medicineName || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        'Expiry Date': m.expiryDate || m.expiry_date || '',
        Stock: m.stockQuantity || m.stock_quantity || 0,
        Status: getExpiryStatus(m.expiryDate || m.expiry_date).label,
      })),
      ...filteredLowStock.map((m) => ({
        Type: 'Low Stock',
        Medicine: m.name || m.medicineName || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        Stock: m.stockQuantity || m.stock_quantity || 0,
        'Min Level': m.minStockLevel || m.min_stock_level || 10,
        Status: 'Low Stock',
      })),
    ];
    const csv = Papa.unparse(allAlerts);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'alerts.csv');
    setSnackbar({ open: true, message: 'Alerts exported', severity: 'success' });
  };

  const exportXLS = () => {
    const allAlerts = [
      ...filteredExpiry.map((m) => ({
        Type: 'Expiry Alert',
        Medicine: m.name || m.medicineName || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        'Expiry Date': m.expiryDate || m.expiry_date || '',
        Stock: m.stockQuantity || m.stock_quantity || 0,
        Status: getExpiryStatus(m.expiryDate || m.expiry_date).label,
      })),
      ...filteredLowStock.map((m) => ({
        Type: 'Low Stock',
        Medicine: m.name || m.medicineName || '',
        'Batch No': m.batchNumber || m.batch_number || '',
        Stock: m.stockQuantity || m.stock_quantity || 0,
        'Min Level': m.minStockLevel || m.min_stock_level || 10,
        Status: 'Low Stock',
      })),
    ];
    const ws = XLSX.utils.json_to_sheet(allAlerts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alerts');
    XLSX.writeFile(wb, 'alerts.xlsx');
    setSnackbar({ open: true, message: 'Alerts exported', severity: 'success' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Alerts</Typography>
          <Typography variant="body2" color="text.secondary">
            Expiry: {expiryAlerts.length} | Low Stock: {lowStockAlerts.length}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportAlerts} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportXLS} size="small">XLS</Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab
                icon={<AccessTime />}
                iconPosition="start"
                label={`Expiry Alerts (${filteredExpiry.length})`}
              />
              <Tab
                icon={<Warning />}
                iconPosition="start"
                label={`Low Stock (${filteredLowStock.length})`}
              />
            </Tabs>
            <Box sx={{ flex: 1 }} />
            {activeTab === 0 && (
              <TextField
                size="small"
                label="Expiry Within (days)"
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Math.max(1, parseInt(e.target.value, 10) || 30))}
                inputProps={{ min: 1 }}
                sx={{ width: 160 }}
              />
            )}
            {activeTab === 1 && (
              <TextField
                size="small"
                label="Min Stock Threshold"
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 10))}
                inputProps={{ min: 0 }}
                sx={{ width: 160 }}
              />
            )}
            <Button variant="contained" size="small" onClick={handleApplyFilter}>
              Filter
            </Button>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        </CardContent>
      </Card>

      {activeTab === 0 && (
        <Card>
          <DataGrid
            rows={filteredExpiry}
            columns={expiryColumns}
            pageSize={25}
            rowsPerPageOptions={[25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              minHeight: 400,
              '& .MuiDataGrid-row': {
                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
              },
            }}
            getRowId={(row) => row.id}
          />
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <DataGrid
            rows={filteredLowStock}
            columns={lowStockColumns}
            pageSize={25}
            rowsPerPageOptions={[25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              minHeight: 400,
              '& .MuiDataGrid-row': {
                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
              },
            }}
            getRowId={(row) => row.id}
          />
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default Alerts;
