import React, { useState, useEffect } from 'react';
import { returnsAPI, salesAPI } from '../services/api';
import { format } from 'date-fns';
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
  Paper,
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
} from '@mui/material';
import { AssignmentReturn, Search, CheckCircle } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

function Returns() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [invoiceSearch, setInvoiceSearch] = useState('');

  useEffect(() => {
    fetchReturnsHistory();
  }, []);

  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const res = await salesAPI.getAll({ limit: 200 });
      const data = res.data?.data || res.data?.content || res.data || [];
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch sales', severity: 'error' });
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchReturnsHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await returnsAPI.getAll({ limit: 100 });
      const data = res.data?.data || res.data?.content || res.data || [];
      setReturnsHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch returns history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearchSale = () => {
    fetchSales();
  };

  const filteredSales = sales.filter((s) => {
    if (!invoiceSearch) return true;
    const inv = s.invoiceNumber || s.invoice_number || `INV-${s.id}`;
    return inv.toLowerCase().includes(invoiceSearch.toLowerCase());
  });

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    const items = sale.items || sale.saleItems || sale.sale_items || [];
    setReturnItems(
      items.map((item) => ({
        ...item,
        medicineId: item.medicineId || item.medicine_id,
        medicineName: item.medicineName || item.medicine_name || item.name,
        quantity: item.quantity || item.qty || 0,
        unitPrice: item.unitPrice || item.unit_price || item.price || 0,
        maxReturnQty: item.quantity || item.qty || 0,
        returnQty: 0,
        subtotal: 0,
      }))
    );
  };

  const handleReturnQtyChange = (index, qty) => {
    const newItems = [...returnItems];
    const maxQty = newItems[index].maxReturnQty;
    const returnQty = Math.min(Math.max(0, parseInt(qty) || 0), maxQty);
    newItems[index].returnQty = returnQty;
    newItems[index].subtotal = returnQty * newItems[index].unitPrice;
    setReturnItems(newItems);
  };

  const totalRefund = returnItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleConfirmReturn = async () => {
    const itemsToReturn = returnItems.filter((item) => item.returnQty > 0);
    if (itemsToReturn.length === 0) {
      setSnackbar({ open: true, message: 'Please select items to return', severity: 'warning' });
      return;
    }

    setConfirmLoading(true);
    try {
      const returnData = {
        saleId: selectedSale.id,
        reason: reason || 'Customer request',
        items: itemsToReturn.map((item) => ({
          saleItemId: item.id || item.saleItemId,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.returnQty,
          unitPrice: item.unitPrice,
          refundAmount: item.subtotal,
        })),
      };

      await returnsAPI.create(returnData);
      setSnackbar({ open: true, message: 'Return processed successfully!', severity: 'success' });
      setSelectedSale(null);
      setReturnItems([]);
      setReason('');
      setConfirmDialog(false);
      fetchReturnsHistory();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process return';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const historyColumns = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'invoiceNumber', headerName: 'Invoice #', flex: 1, minWidth: 130,
      valueGetter: (params) => {
        const sale = params.row.sale || params.row;
        return sale.invoiceNumber || sale.invoice_number || `INV-${sale.saleId || sale.sale_id || params.row.id}`;
      },
    },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 150,
      valueGetter: (params) => params.row.reason || '' },
    { field: 'refundAmount', headerName: 'Refund', width: 120, type: 'number',
      valueGetter: (params) => params.row.refundAmount || params.row.refund_amount || params.row.totalRefund || 0,
      renderCell: (params) => (
        <Typography fontWeight={600} color="error">
          -₹{Number(params.value).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    { field: 'status', headerName: 'Status', width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.status || 'COMPLETED'}
          size="small"
          color={params.row.status === 'COMPLETED' ? 'success' : 'warning'}
        />
      ),
    },
    { field: 'createdAt', headerName: 'Date', width: 130,
      valueGetter: (params) => params.row.createdAt || params.row.created_at || params.row.returnDate,
      valueFormatter: (params) => {
        try { return format(new Date(params.value), 'dd MMM yyyy HH:mm'); }
        catch { return '-'; }
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Returns</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Find Sale</Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth size="small" placeholder="Search by invoice number..."
                  value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)}
                />
                <Button variant="contained" startIcon={<Search />} onClick={handleSearchSale} disabled={salesLoading}>
                  Search
                </Button>
              </Box>

              {salesLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary" py={2}>
                              Click Search to find sales
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSales.map((sale) => (
                          <TableRow
                            key={sale.id}
                            hover
                            sx={{ cursor: 'pointer', backgroundColor: selectedSale?.id === sale.id ? 'action.selected' : 'inherit' }}
                            onClick={() => handleSelectSale(sale)}
                          >
                            <TableCell>
                              {sale.invoiceNumber || sale.invoice_number || `INV-${sale.id}`}
                            </TableCell>
                            <TableCell>{sale.customerName || sale.customer_name || 'Walk-in'}</TableCell>
                            <TableCell align="right">
                              ₹{Number(sale.grandTotal || sale.grand_total || sale.totalAmount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              {format(new Date(sale.createdAt || sale.created_at || sale.saleDate), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant={selectedSale?.id === sale.id ? 'contained' : 'outlined'}>
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                {selectedSale ? `Return Items - ${selectedSale.invoiceNumber || selectedSale.invoice_number || `INV-${selectedSale.id}`}` : 'Select a sale to process return'}
              </Typography>

              {!selectedSale ? (
                <Box py={6} textAlign="center">
                  <AssignmentReturn sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Select a sale from the list to process returns</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Purchased</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Return Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Refund</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {returnItems.map((item, index) => (
                          <TableRow key={item.medicineId || index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{item.medicineName}</Typography>
                            </TableCell>
                            <TableCell align="center">{item.maxReturnQty}</TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small" type="number"
                                value={item.returnQty}
                                onChange={(e) => handleReturnQtyChange(index, e.target.value)}
                                inputProps={{ min: 0, max: item.maxReturnQty, style: { textAlign: 'center' } }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600} color={item.subtotal > 0 ? 'error' : 'inherit'}>
                                ₹{item.subtotal.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ my: 2 }} />

                  <TextField
                    fullWidth size="small" label="Reason for Return"
                    value={reason} onChange={(e) => setReason(e.target.value)}
                    multiline rows={2} sx={{ mb: 2 }}
                    placeholder="e.g., Product expired, customer changed mind..."
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      Total Refund: <span style={{ color: '#d32f2f' }}>₹{totalRefund.toFixed(2)}</span>
                    </Typography>
                    <Button
                      variant="contained" color="error"
                      startIcon={<AssignmentReturn />}
                      onClick={() => setConfirmDialog(true)}
                      disabled={totalRefund === 0}
                    >
                      Process Return
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Returns History</Typography>
          <DataGrid
            rows={returnsHistory}
            columns={historyColumns}
            loading={historyLoading}
            pageSize={10}
            rowsPerPageOptions={[10, 25]}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentReturn color="error" />
            Confirm Return
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography mb={1}>
            Invoice: {selectedSale?.invoiceNumber || selectedSale?.invoice_number || `INV-${selectedSale?.id}`}
          </Typography>
          <Typography mb={2}>
            Items to return: {returnItems.filter((i) => i.returnQty > 0).length}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>Total Refund:</Typography>
            <Typography variant="h6" fontWeight={700} color="error">₹{totalRefund.toFixed(2)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={handleConfirmReturn} disabled={confirmLoading}
            startIcon={confirmLoading ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {confirmLoading ? 'Processing...' : 'Confirm Return'}
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

export default Returns;
