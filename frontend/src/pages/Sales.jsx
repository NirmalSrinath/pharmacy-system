import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, medicineAPI } from '../services/api';
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
  InputAdornment,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Delete,
  Edit,
  Receipt,
  Download,
  ShoppingCart,
  CheckCircle,
  Print,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const GST_RATE = 18;

function Sales() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [printDialog, setPrintDialog] = useState(false);
  const [printSale, setPrintSale] = useState(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [viewSale, setViewSale] = useState(null);
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchMedicines();
    fetchSalesHistory();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await medicineAPI.getAll({ limit: 1000 });
      const data = res.data?.data || res.data?.content || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setMedicines(list.filter((m) => m.active !== false));
    } catch (err) {
      console.error('Failed to fetch medicines');
    }
  };

  const fetchSalesHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await salesAPI.getAll(params);
      const data = res.data?.data || res.data?.content || res.data || [];
      setSalesHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sales history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const dailyStats = React.useMemo(() => {
    let totalSalesCount = 0;
    let totalSalesAmount = 0;
    let totalGST = 0;
    let totalDiscount = 0;
    let cashPaid = 0;
    let cardPaid = 0;
    let upiPaid = 0;

    salesHistory.forEach((s) => {
      const amt = Number(s.total || 0);
      const gst = Number(s.gstAmount || 0);
      const disc = Number(s.discount || 0);
      totalSalesCount += 1;
      totalSalesAmount += amt;
      totalGST += gst;
      totalDiscount += disc;

      const method = (s.paymentMethod || 'CASH').toUpperCase();
      if (method === 'CASH') cashPaid += amt;
      else if (method === 'CARD') cardPaid += amt;
      else if (method === 'UPI') upiPaid += amt;
    });

    return {
      totalSalesCount,
      totalSalesAmount,
      totalGST,
      totalDiscount,
      cashPaid,
      cardPaid,
      upiPaid,
    };
  }, [salesHistory]);

  const filteredHistory = salesHistory;

  const addToCart = (medicine) => {
    const medId = medicine.id || medicine.medicineId;
    const existing = cart.find((item) => item.medicineId === medId);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.medicineId === medId
            ? { ...item, quantity: Math.min(item.quantity + 1, item.availableStock) }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          medicineId: medId,
          name: medicine.name,
          genericName: medicine.genericName || '',
          salePrice: parseFloat(medicine.salePrice || medicine.sale_price || 0),
          gstRate: parseFloat(medicine.gstRate || medicine.gst_rate || GST_RATE),
          quantity: 1,
          availableStock: medicine.stockQuantity || medicine.stock_quantity || 0,
          batchNumber: medicine.batchNumber || medicine.batch_number || '',
          rackNumber: medicine.rackNumber || medicine.rack_number || '',
          type: medicine.type || '',
        },
      ]);
    }
  };

  const updateCartQuantity = (medicineId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setCart(cart.filter((item) => item.medicineId !== medicineId));
      return;
    }
    setCart(
      cart.map((item) =>
        item.medicineId === medicineId
          ? { ...item, quantity: Math.min(qty, item.availableStock) }
          : item
      )
    );
  };

  const incrementQty = (medicineId) => {
    setCart(
      cart.map((item) =>
        item.medicineId === medicineId
          ? { ...item, quantity: Math.min(item.quantity + 1, item.availableStock) }
          : item
      )
    );
  };

  const decrementQty = (medicineId) => {
    setCart(
      cart
        .map((item) => {
          if (item.medicineId !== medicineId) return item;
          if (item.quantity <= 1) return undefined;
          return { ...item, quantity: item.quantity - 1 };
        })
        .filter((item) => item !== undefined)
    );
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const startEditQty = (item) => {
    setEditingItemId(item.medicineId);
    setEditQty(String(item.quantity));
  };

  const saveEditQty = (medicineId) => {
    const qty = parseInt(editQty, 10);
    if (!isNaN(qty) && qty > 0) {
      updateCartQuantity(medicineId, qty);
    }
    setEditingItemId(null);
    setEditQty('');
  };

  const cancelEditQty = () => {
    setEditingItemId(null);
    setEditQty('');
  };

  const handlePrintSale = (sale) => {
    setPrintSale(sale);
    setPrintDialog(true);
  };

  const handleViewDetails = (sale) => {
    setViewSale(sale);
    setViewDetailsDialog(true);
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const sale = printSale;
    const items = sale.saleItems || [];
    const itemRows = items.map((item, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${item.medicineName || ''}${item.rackNumber ? ' (Rack: ' + item.rackNumber + ')' : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.unitPrice || 0).toFixed(2)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${item.gstRate || 18}%</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.total || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 12px; margin-bottom: 16px; }
          .header img { height: 60px; margin-bottom: 6px; }
          .header h1 { margin: 0; color: #1976d2; font-size: 22px; }
          .header p { margin: 2px 0 0; color: #666; font-size: 12px; }
          .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #ddd; }
          .details-row .info-label { font-weight: 600; color: #555; margin-right: 6px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .info-label { font-weight: 600; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #ddd; }
          th:not(:first-child) { text-align: right; }
          .totals { margin-top: 12px; text-align: right; }
          .totals div { display: flex; justify-content: space-between; max-width: 280px; margin-left: auto; padding: 3px 0; font-size: 13px; }
          .totals .grand { font-size: 16px; font-weight: 700; border-top: 2px solid #1976d2; padding-top: 6px; color: #1976d2; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${window.location.origin}${import.meta.env.VITE_PHARMACY_LOGO || '/logo.svg'}" alt="Logo" />
          <h1>${import.meta.env.VITE_PHARMACY_NAME || 'PharmaCare'}</h1>
          <p>${import.meta.env.VITE_PHARMACY_ADDRESS || ''}</p>
          <p>${import.meta.env.VITE_PHARMACY_GSTIN ? 'GSTIN: ' + import.meta.env.VITE_PHARMACY_GSTIN : ''}</p>
        </div>
        <div class="details-row">
          <div><span class="info-label">Customer:</span> ${sale.customerName || 'Walk-in'}</div>
          <div><span class="info-label">Contact:</span> ${sale.customerPhone || '-'}</div>
          <div><span class="info-label">Invoice:</span> ${sale.invoiceNumber || 'N/A'}</div>
        </div>
        <div class="info-row">
          <div><span class="info-label">Payment:</span> ${sale.paymentMethod || 'CASH'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th style="text-align:right">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">GST%</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal:</span><span>₹${Number(sale.subtotal || 0).toFixed(2)}</span></div>
          <div><span>GST:</span><span>₹${Number(sale.gstAmount || 0).toFixed(2)}</span></div>
          ${Number(sale.discount || 0) > 0 ? `<div><span>Discount:</span><span style="color:red">-₹${Number(sale.discount).toFixed(2)}</span></div>` : ''}
          <div class="grand"><span>Grand Total:</span><span>₹${Number(sale.total || 0).toFixed(2)}</span></div>
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setCustomerPhone(cleaned);
    if (cleaned && !/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Enter valid 10-digit Indian mobile number');
    } else {
      setPhoneError('');
    }
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.salePrice * item.quantity;
    const gstAmount = (subtotal * (item.gstRate || GST_RATE)) / 100;
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const calculateCartTotals = () => {
    let subtotal = 0;
    let totalGST = 0;
    cart.forEach((item) => {
      const { subtotal: itemSub, gstAmount } = calculateItemTotal(item);
      subtotal += itemSub;
      totalGST += gstAmount;
    });
    const grandTotal = subtotal + totalGST - discount;
    return { subtotal, totalGST, grandTotal: Math.max(0, grandTotal) };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setSnackbar({ open: true, message: 'Cart is empty', severity: 'warning' });
      return;
    }
    if (!customerName.trim()) {
      setSnackbar({ open: true, message: 'Customer name is required', severity: 'warning' });
      return;
    }
    if (!customerPhone.trim() || !/^[6-9]\d{9}$/.test(customerPhone)) {
      setSnackbar({ open: true, message: 'Valid 10-digit phone number is required', severity: 'warning' });
      return;
    }

    setCheckoutLoading(true);
    try {
      const saleData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        discount: String(discount || 0),
        saleItems: cart.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.name,
          quantity: item.quantity,
          unitPrice: String(item.salePrice),
          gstRate: String(item.gstRate || GST_RATE),
        })),
      };

      const res = await salesAPI.create(saleData);
      const createdSale = res.data?.data || res.data;
      const saleForPrint = {
        ...createdSale,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        discount,
        saleItems: cart.map((item) => {
          const { total } = calculateItemTotal(item);
          return {
            medicineId: item.medicineId,
            medicineName: item.name,
            quantity: item.quantity,
            unitPrice: item.salePrice,
            gstRate: item.gstRate || GST_RATE,
            total,
          };
        }),
        subtotal,
        gstAmount: totalGST,
        total: grandTotal,
        saleDate: new Date().toISOString(),
      };
      setSnackbar({ open: true, message: 'Sale completed successfully!', severity: 'success' });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setPaymentMethod('CASH');
      setCheckoutDialog(false);
      fetchSalesHistory();
      fetchMedicines();
      handlePrintSale(saleForPrint);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create sale';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(
      filteredHistory.map((s) => ({
        'Invoice #': s.invoiceNumber || `INV-${s.id}`,
        Customer: s.customerName || '',
        Phone: s.customerPhone || '',
        'Items': s.saleItems?.length || 0,
        Subtotal: Number(s.subtotal || 0).toFixed(2),
        GST: Number(s.gstAmount || 0).toFixed(2),
        Discount: Number(s.discount || 0).toFixed(2),
        'Grand Total': Number(s.total || 0).toFixed(2),
        Payment: s.paymentMethod || 'CASH',
        Date: s.saleDate ? format(new Date(s.saleDate), 'dd/MM/yyyy') : '',
      }))
    );
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `sales_${dateFrom}_to_${dateTo}.csv`);
  };

  const exportXLS = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredHistory.map((s) => ({
        'Invoice #': s.invoiceNumber || `INV-${s.id}`,
        Customer: s.customerName || '',
        Phone: s.customerPhone || '',
        Items: s.saleItems?.length || 0,
        Subtotal: Number(s.subtotal || 0).toFixed(2),
        GST: Number(s.gstAmount || 0).toFixed(2),
        Discount: Number(s.discount || 0).toFixed(2),
        'Grand Total': Number(s.total || 0).toFixed(2),
        Payment: s.paymentMethod || 'CASH',
        Date: s.saleDate ? format(new Date(s.saleDate), 'dd/MM/yyyy') : '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales_${dateFrom}_to_${dateTo}.xlsx`);
  };

  const { subtotal, totalGST, grandTotal } = calculateCartTotals();

  const historyColumns = [
    { field: 'invoiceNumber', headerName: 'Invoice #', flex: 1, minWidth: 160 },
    { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 120 },
    { field: 'customerPhone', headerName: 'Phone', width: 110 },
    { field: 'saleItems', headerName: 'Items', width: 60,
      renderCell: (params) => params.value?.length || 0 },
    { field: 'total', headerName: 'Total', width: 110, type: 'number',
      renderCell: (params) => (
        <Typography fontWeight={600}>₹{Number(params.value || 0).toLocaleString('en-IN')}</Typography>
      ),
    },
    { field: 'paymentMethod', headerName: 'Payment', width: 90,
      renderCell: (params) => (
        <Chip
          label={params.value || 'CASH'}
          size="small"
          color={params.value === 'CASH' ? 'success' : params.value === 'CARD' ? 'primary' : 'secondary'}
        />
      ),
    },
    { field: 'saleDate', headerName: 'Date', width: 140,
      valueFormatter: (params) => {
        try { return format(new Date(params.value), 'dd MMM yyyy HH:mm'); }
        catch { return '-'; }
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" color="secondary" onClick={() => handleViewDetails(params.row)}>
              <Receipt fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Invoice">
            <IconButton size="small" color="primary" onClick={() => handlePrintSale(params.row)}>
              <Print fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Sales</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportXLS} size="small">XLS</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Search Medicines</Typography>
              <Autocomplete
                fullWidth
                options={medicines.filter((m) => (m.stockQuantity || m.stock_quantity || 0) > 0)}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => (option.id || option.medicineId) === (value.id || value.medicineId)}
                onChange={(_, val) => { if (val) addToCart(val); }}
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  if (!input) return [];
                  return options.filter((m) => {
                    const name = (m.name || '').toLowerCase();
                    const generic = (m.genericName || '').toLowerCase();
                    const batch = (m.batchNumber || '').toLowerCase();
                    return name.includes(input) || generic.includes(input) || batch.includes(input);
                  });
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id || option.medicineId}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.genericName || ''} | Batch: {option.batchNumber || 'N/A'} | Rack: {option.rackNumber || 'N/A'} | Stock: {option.stockQuantity || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        ₹{Number(option.salePrice || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Type medicine name, generic, or batch number..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Cart ({cart.length} items)
              </Typography>
              {cart.length === 0 ? (
                <Box py={4} textAlign="center">
                  <ShoppingCart sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Search and add medicines to cart</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rack</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">GST</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => {
                        const { subtotal: itemSub, gstAmount, total } = calculateItemTotal(item);
                        const isEditing = editingItemId === item.medicineId;
                        return (
                          <TableRow key={item.medicineId}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.genericName}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">{item.rackNumber || '-'}</Typography>
                            </TableCell>
                            <TableCell align="right">₹{item.salePrice.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              {isEditing ? (
                                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditQty(item.medicineId);
                                      if (e.key === 'Escape') cancelEditQty();
                                    }}
                                    inputProps={{ min: 1, max: item.availableStock, style: { textAlign: 'center', width: 50 } }}
                                    autoFocus
                                  />
                                  <IconButton size="small" color="primary" onClick={() => saveEditQty(item.medicineId)}>
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={cancelEditQty}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                  <IconButton size="small" onClick={() => decrementQty(item.medicineId)}>
                                    <Remove sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <Typography
                                    fontWeight={600}
                                    minWidth={24}
                                    textAlign="center"
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => startEditQty(item)}
                                  >
                                    {item.quantity}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => incrementQty(item.medicineId)}
                                    disabled={item.quantity >= item.availableStock}
                                  >
                                    <Add sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell align="right">₹{gstAmount.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600}>₹{total.toFixed(2)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeFromCart(item.medicineId)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Order Summary</Typography>

              <TextField
                fullWidth
                label="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
                placeholder="Enter customer name"
                required
              />
              <TextField
                fullWidth
                label="Customer Phone *"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                size="small"
                sx={{ mb: 1 }}
                placeholder="10-digit mobile number"
                error={!!phoneError}
                helperText={phoneError || 'e.g. 9876543210'}
                inputProps={{ maxLength: 10 }}
                required
              />

              <Typography variant="subtitle2" mb={1} mt={1}>Payment Method</Typography>
              <Box display="flex" gap={1} mb={3}>
                {['CASH', 'CARD', 'UPI'].map((method) => (
                  <Chip
                    key={method}
                    label={method}
                    onClick={() => setPaymentMethod(method)}
                    color={paymentMethod === method ? 'primary' : 'default'}
                    variant={paymentMethod === method ? 'filled' : 'outlined'}
                    sx={{ flex: 1 }}
                  />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">GST (CGST + SGST)</Typography>
                <Typography>₹{totalGST.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography color="text.secondary" whiteSpace="nowrap">Discount ₹</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  sx={{ width: 100 }}
                  inputProps={{ min: 0 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  ₹{grandTotal.toFixed(2)}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Receipt />}
                onClick={() => {
                  if (!customerName.trim()) {
                    setSnackbar({ open: true, message: 'Customer name is required', severity: 'warning' });
                    return;
                  }
                  if (!customerPhone.trim() || !/^[6-9]\d{9}$/.test(customerPhone)) {
                    setSnackbar({ open: true, message: 'Valid phone number is required', severity: 'warning' });
                    return;
                  }
                  if (cart.length === 0) {
                    setSnackbar({ open: true, message: 'Cart is empty', severity: 'warning' });
                    return;
                  }
                  setCheckoutDialog(true);
                }}
                disabled={cart.length === 0}
                sx={{ py: 1.5 }}
              >
                Checkout
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>Sales History</Typography>
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
              <Button variant="outlined" onClick={fetchSalesHistory} size="small">
                Filter
              </Button>
              <Button variant="text" size="small" onClick={() => {
                setDateFrom(format(new Date(), 'yyyy-MM-dd'));
                setDateTo(format(new Date(), 'yyyy-MM-dd'));
              }}>
                Today
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} sx={{ backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Sales</Typography>
                <Typography variant="h5" fontWeight={700} color="primary">
                  ₹{dailyStats.totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dailyStats.totalSalesCount} transaction(s)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} sx={{ backgroundColor: '#e8f5e9', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">GST Collected</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  ₹{dailyStats.totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Discount: ₹{dailyStats.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} sx={{ backgroundColor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Cash Received</Typography>
                <Typography variant="h5" fontWeight={700} color="warning.main">
                  ₹{dailyStats.cashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dailyStats.cashPaid > 0 ? Math.round((dailyStats.cashPaid / dailyStats.totalSalesAmount) * 100) || 0 : 0}% of total
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box p={2} sx={{ backgroundColor: '#f3e5f5', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Card / UPI</Typography>
                <Typography variant="h5" fontWeight={700} color="secondary.main">
                  ₹{(dailyStats.cardPaid + dailyStats.upiPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Card: ₹{dailyStats.cardPaid.toLocaleString('en-IN')} | UPI: ₹{dailyStats.upiPaid.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <DataGrid
            rows={filteredHistory}
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

      <Dialog open={checkoutDialog} onClose={() => setCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Confirm Sale
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">Customer: {customerName}</Typography>
            <Typography variant="body2" color="text.secondary">Phone: {customerPhone}</Typography>
            <Typography variant="body2" color="text.secondary">Payment: {paymentMethod}</Typography>
            <Typography variant="body2" color="text.secondary">Items: {cart.length}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Subtotal:</Typography>
            <Typography>₹{subtotal.toFixed(2)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>GST:</Typography>
            <Typography>₹{totalGST.toFixed(2)}</Typography>
          </Box>
          {discount > 0 && (
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Discount:</Typography>
              <Typography color="error">-₹{discount.toFixed(2)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>Grand Total:</Typography>
            <Typography variant="h6" fontWeight={700} color="primary">₹{grandTotal.toFixed(2)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCheckout}
            disabled={checkoutLoading}
            startIcon={checkoutLoading ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {checkoutLoading ? 'Processing...' : 'Confirm Sale'}
          </Button>
        </DialogActions>
      </Dialog>

      {viewSale && (
        <Dialog open={viewDetailsDialog} onClose={() => setViewDetailsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Box component="img" src={import.meta.env.VITE_PHARMACY_LOGO || '/logo.svg'} alt="Logo" sx={{ height: 48 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{import.meta.env.VITE_PHARMACY_NAME || 'PharmaCare'}</Typography>
                <Typography variant="caption" color="text.secondary">Sale Details - {viewSale.invoiceNumber || 'N/A'}</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Typography variant="body2"><strong>Customer:</strong> {viewSale.customerName || 'Walk-in'}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {viewSale.customerPhone || '-'}</Typography>
                <Typography variant="body2"><strong>Payment:</strong> {viewSale.paymentMethod || 'CASH'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2"><strong>Date:</strong> {viewSale.saleDate ? format(new Date(viewSale.saleDate), 'dd MMM yyyy, hh:mm a') : '-'}</Typography>
                <Typography variant="body2"><strong>Items:</strong> {viewSale.saleItems?.length || 0}</Typography>
                <Typography variant="body2"><strong>Total:</strong> ₹{Number(viewSale.total || 0).toFixed(2)}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} mb={1}>Items</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rack</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">GST%</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(viewSale.saleItems || []).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item.medicineName}</Typography>
                        {item.medicineType && <Typography variant="caption" color="text.secondary" display="block">{item.medicineType}</Typography>}
                      </TableCell>
                      <TableCell>{item.rackNumber || '-'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">₹{Number(item.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{item.gstRate || 18}%</TableCell>
                      <TableCell align="right">₹{Number(item.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">₹{Number(viewSale.subtotal || 0).toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">GST:</Typography>
              <Typography variant="body2">₹{Number(viewSale.gstAmount || 0).toFixed(2)}</Typography>
            </Box>
            {Number(viewSale.discount || 0) > 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2" color="error">-₹{Number(viewSale.discount).toFixed(2)}</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>Grand Total:</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">₹{Number(viewSale.total || 0).toFixed(2)}</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDetailsDialog(false)}>Close</Button>
            <Button variant="contained" startIcon={<Print />} onClick={() => { setViewDetailsDialog(false); handlePrintSale(viewSale); }}>
              Print
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {printSale && (
        <Dialog open={printDialog} onClose={() => setPrintDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Box component="img" src={import.meta.env.VITE_PHARMACY_LOGO || '/logo.svg'} alt="Logo" sx={{ height: 48 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{import.meta.env.VITE_PHARMACY_NAME || 'PharmaCare'}</Typography>
                <Typography variant="caption" color="text.secondary">Invoice - {printSale.invoiceNumber || 'N/A'}</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box mb={2}>
              <Typography variant="body2"><strong>Customer:</strong> {printSale.customerName || 'Walk-in'}</Typography>
              <Typography variant="body2"><strong>Phone:</strong> {printSale.customerPhone || '-'}</Typography>
              <Typography variant="body2"><strong>Payment:</strong> {printSale.paymentMethod || 'CASH'}</Typography>
              <Typography variant="body2"><strong>Date:</strong> {printSale.saleDate ? format(new Date(printSale.saleDate), 'dd MMM yyyy, hh:mm a') : '-'}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rack</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">GST%</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(printSale.saleItems || []).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{item.medicineName}</TableCell>
                      <TableCell>{item.rackNumber || '-'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">₹{Number(item.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{item.gstRate || 18}%</TableCell>
                      <TableCell align="right">₹{Number(item.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">₹{Number(printSale.subtotal || 0).toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">GST:</Typography>
              <Typography variant="body2">₹{Number(printSale.gstAmount || 0).toFixed(2)}</Typography>
            </Box>
            {Number(printSale.discount || 0) > 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2" color="error">-₹{Number(printSale.discount).toFixed(2)}</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>Grand Total:</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">₹{Number(printSale.total || 0).toFixed(2)}</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPrintDialog(false)}>Close</Button>
            <Button variant="contained" startIcon={<Print />} onClick={printInvoice}>
              Print
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Sales;
