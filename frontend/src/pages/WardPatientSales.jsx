import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wardPatientAPI, medicineAPI } from '../services/api';
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
  Delete,
  LocalHospital,
  Bed,
  CheckCircle,
  Receipt,
  Save,
  Edit,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const GST_RATE = 18;

function WardPatientSales() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [admitDialog, setAdmitDialog] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [wardNumber, setWardNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [admitDate, setAdmitDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [addMedDialog, setAddMedDialog] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [addQty, setAddQty] = useState(1);

  const [finalizeDialog, setFinalizeDialog] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  useEffect(() => {
    fetchMedicines();
    fetchPatients();
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

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await wardPatientAPI.getAll();
      const data = res.data?.data || res.data || [];
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch ward patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async () => {
    if (!patientName.trim()) {
      setSnackbar({ open: true, message: 'Patient name is required', severity: 'warning' });
      return;
    }
    try {
      const data = {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorName: doctorName.trim(),
        wardNumber: wardNumber.trim(),
        bedNumber: bedNumber.trim(),
        admitDate: admitDate || format(new Date(), 'yyyy-MM-dd'),
        paymentMethod,
      };
      await wardPatientAPI.create(data);
      setSnackbar({ open: true, message: 'Patient admitted successfully', severity: 'success' });
      setAdmitDialog(false);
      resetAdmitForm();
      fetchPatients();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to admit patient';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const resetAdmitForm = () => {
    setPatientName('');
    setPatientPhone('');
    setDoctorName('');
    setWardNumber('');
    setBedNumber('');
    setAdmitDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleAddMedicine = async () => {
    if (!selectedPatient || !selectedMed) {
      setSnackbar({ open: true, message: 'Select a medicine', severity: 'warning' });
      return;
    }
    if (addQty <= 0) {
      setSnackbar({ open: true, message: 'Quantity must be greater than 0', severity: 'warning' });
      return;
    }
    try {
      const itemData = {
        medicineId: selectedMed.id || selectedMed.medicineId,
        medicineName: selectedMed.name,
        quantity: addQty,
        unitPrice: parseFloat(selectedMed.salePrice || selectedMed.sale_price || 0),
        gstRate: parseFloat(selectedMed.gstRate || selectedMed.gst_rate || GST_RATE),
      };
      await wardPatientAPI.addItem(selectedPatient.id, itemData);
      setSnackbar({ open: true, message: 'Medicine added successfully', severity: 'success' });
      setAddMedDialog(false);
      setSelectedMed(null);
      setMedSearch('');
      setAddQty(1);
      refreshPatient(selectedPatient.id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add medicine';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!selectedPatient) return;
    try {
      await wardPatientAPI.removeItem(selectedPatient.id, itemId);
      setSnackbar({ open: true, message: 'Medicine removed', severity: 'success' });
      refreshPatient(selectedPatient.id);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to remove medicine', severity: 'error' });
    }
  };

  const handleFinalize = async () => {
    if (!selectedPatient) return;
    try {
      if (discount !== (selectedPatient.discount || 0)) {
        await wardPatientAPI.updateDiscount(selectedPatient.id, discount);
      }
      await wardPatientAPI.finalize(selectedPatient.id);
      setSnackbar({ open: true, message: 'Bill finalized and sale created successfully!', severity: 'success' });
      setFinalizeDialog(false);
      setSelectedPatient(null);
      setDiscount(0);
      setPaymentMethod('CASH');
      fetchPatients();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to finalize bill';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const refreshPatient = async (id) => {
    try {
      const res = await wardPatientAPI.getById(id);
      const data = res.data?.data || res.data;
      setSelectedPatient(data);
    } catch (err) {
      console.error('Failed to refresh patient');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ward patient?')) return;
    try {
      await wardPatientAPI.delete(id);
      setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
      if (selectedPatient?.id === id) setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  const getPatientTotals = (patient) => {
    let totalAmount = 0;
    let gstAmount = 0;
    (patient.items || []).forEach((item) => {
      const itemTotal = item.total || 0;
      const itemGst = item.gstAmount || 0;
      totalAmount += itemTotal - itemGst;
      gstAmount += itemGst;
    });
    const grandTotal = totalAmount + gstAmount - (patient.discount || 0);
    return { totalAmount, gstAmount, grandTotal: Math.max(0, grandTotal) };
  };

  const patientColumns = [
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 140 },
    { field: 'wardNumber', headerName: 'Ward', width: 70 },
    { field: 'bedNumber', headerName: 'Bed', width: 70 },
    { field: 'doctorName', headerName: 'Doctor', flex: 1, minWidth: 120 },
    { field: 'admitDate', headerName: 'Admit Date', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'ADMITTED' ? 'warning' : 'success'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 60,
      renderCell: (params) => params.value?.length || 0,
    },
    {
      field: 'grandTotal',
      headerName: 'Total',
      width: 110,
      renderCell: (params) => (
        <Typography fontWeight={600}>₹{Number(params.value || 0).toLocaleString('en-IN')}</Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Ward Patient Sales</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAdmitDialog(true)}>
          Admit Patient
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedPatient ? 7 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Admitted Patients</Typography>
              <DataGrid
                rows={patients}
                columns={patientColumns}
                loading={loading}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                sx={{ minHeight: 400, cursor: 'pointer' }}
                getRowId={(row) => row.id}
                onRowClick={(params) => setSelectedPatient(params.row)}
                getRowClassName={(params) =>
                  params.row.id === selectedPatient?.id ? 'Mui-selected' : ''
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {selectedPatient && (
          <Grid item xs={12} md={5}>
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>Patient Details</Typography>
                  <Button size="small" onClick={() => setSelectedPatient(null)}>Close</Button>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Patient:</strong> {selectedPatient.patientName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Phone:</strong> {selectedPatient.patientPhone || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Doctor:</strong> {selectedPatient.doctorName || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ward/Bed:</strong> {selectedPatient.wardNumber || '-'}/{selectedPatient.bedNumber || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Admit:</strong> {selectedPatient.admitDate}
                  </Typography>
                  <Chip
                    label={selectedPatient.status}
                    size="small"
                    color={selectedPatient.status === 'ADMITTED' ? 'warning' : 'success'}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>Medicines</Typography>
                  {selectedPatient.status === 'ADMITTED' && (
                    <Button size="small" startIcon={<Add />} onClick={() => setAddMedDialog(true)}>
                      Add Medicine
                    </Button>
                  )}
                </Box>

                {selectedPatient.items && selectedPatient.items.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                          {selectedPatient.status === 'ADMITTED' && (
                            <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPatient.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{item.medicineName}</Typography>
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600}>₹{Number(item.total || 0).toFixed(2)}</Typography>
                            </TableCell>
                            {selectedPatient.status === 'ADMITTED' && (
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" textAlign="center" py={2}>
                    No medicines added yet
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography>₹{(getPatientTotals(selectedPatient).totalAmount).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">GST</Typography>
                  <Typography>₹{(getPatientTotals(selectedPatient).gstAmount).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    ₹{(selectedPatient.grandTotal || getPatientTotals(selectedPatient).grandTotal).toFixed(2)}
                  </Typography>
                </Box>

                {selectedPatient.status === 'ADMITTED' && (
                  <Box display="flex" gap={1}>
                    <Button
                      fullWidth variant="contained" startIcon={<Receipt />}
                      onClick={() => {
                        setDiscount(selectedPatient.discount || 0);
                        setPaymentMethod(selectedPatient.paymentMethod || 'CASH');
                        setFinalizeDialog(true);
                      }}
                      disabled={!selectedPatient.items || selectedPatient.items.length === 0}
                    >
                      Finalize Bill
                    </Button>
                    <Button
                      fullWidth variant="outlined" color="error" startIcon={<Delete />}
                      onClick={() => handleDelete(selectedPatient.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                )}

                {selectedPatient.status === 'FINALIZED' && (
                  <Alert severity="success">
                    Bill finalized. Sale ID: {selectedPatient.saleId}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={admitDialog} onClose={() => setAdmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalHospital color="primary" />
            Admit New Patient
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Patient Name *" size="small" value={patientName}
                onChange={(e) => setPatientName(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" size="small" value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                inputProps={{ maxLength: 10 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Doctor Name" size="small" value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Ward Number" size="small" value={wardNumber}
                onChange={(e) => setWardNumber(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Bed Number" size="small" value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Admit Date" size="small" type="date" value={admitDate}
                onChange={(e) => setAdmitDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdmitDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdmit}>Admit Patient</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addMedDialog} onClose={() => setAddMedDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Add color="primary" />
            Add Medicine
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Autocomplete
              fullWidth
              options={medicines.filter((m) => (m.stockQuantity || m.stock_quantity || 0) > 0)}
              getOptionLabel={(option) => option.name || ''}
              isOptionEqualToValue={(option, value) => (option.id) === (value?.id)}
              value={selectedMed}
              onInputChange={(_, val) => setMedSearch(val)}
              onChange={(_, val) => setSelectedMed(val)}
              filterOptions={(options, state) => {
                const input = state.inputValue.toLowerCase();
                if (!input) return [];
                return options.filter((m) => {
                  const name = (m.name || '').toLowerCase();
                  const generic = (m.genericName || '').toLowerCase();
                  return name.includes(input) || generic.includes(input);
                });
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stock: {option.stockQuantity || 0} | ₹{Number(option.salePrice || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Search Medicine *" placeholder="Type medicine name..."
                  InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
              )}
              sx={{ mb: 2 }}
            />
            <TextField fullWidth label="Quantity *" size="small" type="number" value={addQty}
              onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddMedDialog(false); setSelectedMed(null); setAddQty(1); }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMedicine} disabled={!selectedMed}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={finalizeDialog} onClose={() => setFinalizeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Finalize Bill
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Patient: {selectedPatient.patientName}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Items: {selectedPatient.items?.length || 0}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <TextField fullWidth label="Discount ₹" size="small" type="number" value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                sx={{ mb: 2 }} inputProps={{ min: 0 }} />

              <Typography variant="subtitle2" mb={1}>Payment Method</Typography>
              <Box display="flex" gap={1} mb={2}>
                {['CASH', 'CARD', 'UPI'].map((method) => (
                  <Chip key={method} label={method}
                    onClick={() => setPaymentMethod(method)}
                    color={paymentMethod === method ? 'primary' : 'default'}
                    variant={paymentMethod === method ? 'filled' : 'outlined'} sx={{ flex: 1 }} />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{getPatientTotals(selectedPatient).totalAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>GST:</Typography>
                <Typography>₹{getPatientTotals(selectedPatient).gstAmount.toFixed(2)}</Typography>
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
                <Typography variant="h6" fontWeight={700} color="primary">
                  ₹{(getPatientTotals(selectedPatient).grandTotal - discount).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFinalize} startIcon={<CheckCircle />}>
            Finalize & Create Sale
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WardPatientSales;
