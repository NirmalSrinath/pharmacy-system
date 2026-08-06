import React, { useState, useEffect } from 'react';
import { authAPI, doctorAPI, staffAPI } from '../services/api';
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
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Switch,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  People,
  PersonAdd,
  LocalHospital,
  Badge,
  Delete,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const ROLES = ['ADMIN', 'PHARMACIST', 'SALESPERSON'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const GENDERS = ['Male', 'Female', 'Other'];

const initialDoctor = {
  fullName: '', gender: '', dateOfBirth: '', phone: '', email: '',
  address: '', state: '', pincode: '', aadhaarNumber: '', panNumber: '',
  registrationNumber: '', registrationCouncil: '', qualification: '', specialization: '',
};

const initialStaff = {
  fullName: '', gender: '', dateOfBirth: '', phone: '', email: '',
  address: '', state: '', pincode: '', aadhaarNumber: '', panNumber: '',
  employeeId: '', designation: '', department: '', qualification: '', dateOfJoining: '',
};

const initialUser = {
  username: '', password: '', fullName: '', roles: ['SALESPERSON'],
};

function Users() {
  const [mainTab, setMainTab] = useState(0);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState(initialDoctor);
  const [doctorFormLoading, setDoctorFormLoading] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState(initialStaff);
  const [staffFormLoading, setStaffFormLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(initialUser);
  const [userFormLoading, setUserFormLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDoctors();
    fetchStaff();
    fetchUsers();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const res = await doctorAPI.getAll();
      const data = res.data?.data || res.data || [];
      setDoctors(Array.isArray(data) ? data : []);
    } catch { setDoctors([]); } finally { setDoctorsLoading(false); }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await staffAPI.getAll();
      const data = res.data?.data || res.data || [];
      setStaffList(Array.isArray(data) ? data : []);
    } catch { setStaffList([]); } finally { setStaffLoading(false); }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await authAPI.getUsers();
      const data = res.data?.data || res.data?.content || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); } finally { setUsersLoading(false); }
  };

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'error';
    if (role === 'PHARMACIST') return 'primary';
    return 'success';
  };

  const handleDoctorFormChange = (field, value) => {
    setDoctorForm((prev) => ({ ...prev, [field]: value }));
  };

  const openDoctorDialog = (doctor = null) => {
    setEditingDoctor(doctor);
    setDoctorForm(doctor ? {
      fullName: doctor.fullName || '',
      gender: doctor.gender || '',
      dateOfBirth: doctor.dateOfBirth || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      address: doctor.address || '',
      state: doctor.state || '',
      pincode: doctor.pincode || '',
      aadhaarNumber: doctor.aadhaarNumber || '',
      panNumber: doctor.panNumber || '',
      registrationNumber: doctor.registrationNumber || '',
      registrationCouncil: doctor.registrationCouncil || '',
      qualification: doctor.qualification || '',
      specialization: doctor.specialization || '',
    } : { ...initialDoctor });
    setDoctorDialogOpen(true);
  };

  const handleDoctorSubmit = async () => {
    if (!doctorForm.fullName.trim() || !doctorForm.phone.trim()) {
      showSnackbar('Full name and phone are required', 'warning');
      return;
    }
    if (!editingDoctor && (!doctorForm.passcode || !doctorForm.passcode.trim())) {
      showSnackbar('Passcode is required for new doctors', 'warning');
      return;
    }
    setDoctorFormLoading(true);
    try {
      const payload = { ...doctorForm };
      if (editingDoctor) {
        await doctorAPI.update(editingDoctor.id, payload);
        showSnackbar('Doctor updated successfully');
      } else {
        await doctorAPI.create(payload);
        showSnackbar('Doctor created successfully');
      }
      setDoctorDialogOpen(false);
      fetchDoctors();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to save doctor', 'error');
    } finally { setDoctorFormLoading(false); }
  };

  const handleDoctorToggle = async (doctor) => {
    try {
      await doctorAPI.toggle(doctor.id);
      showSnackbar(`Doctor ${doctor.active ? 'deactivated' : 'activated'} successfully`);
      fetchDoctors();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to toggle doctor', 'error');
    }
  };

  const handleDoctorDelete = async (doctor) => {
    if (!window.confirm(`Delete doctor "${doctor.fullName}"?`)) return;
    try {
      await doctorAPI.delete(doctor.id);
      showSnackbar('Doctor deleted successfully');
      fetchDoctors();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to delete doctor', 'error');
    }
  };

  const handleStaffFormChange = (field, value) => {
    setStaffForm((prev) => ({ ...prev, [field]: value }));
  };

  const openStaffDialog = (staff = null) => {
    setEditingStaff(staff);
    setStaffForm(staff ? {
      fullName: staff.fullName || '',
      gender: staff.gender || '',
      dateOfBirth: staff.dateOfBirth || '',
      phone: staff.phone || '',
      email: staff.email || '',
      address: staff.address || '',
      state: staff.state || '',
      pincode: staff.pincode || '',
      aadhaarNumber: staff.aadhaarNumber || '',
      panNumber: staff.panNumber || '',
      employeeId: staff.employeeId || '',
      designation: staff.designation || '',
      department: staff.department || '',
      qualification: staff.qualification || '',
      dateOfJoining: staff.dateOfJoining || '',
    } : { ...initialStaff });
    setStaffDialogOpen(true);
  };

  const handleStaffSubmit = async () => {
    if (!staffForm.fullName.trim() || !staffForm.phone.trim()) {
      showSnackbar('Full name and phone are required', 'warning');
      return;
    }
    if (!editingStaff && (!staffForm.passcode || !staffForm.passcode.trim())) {
      showSnackbar('Passcode is required for new staff', 'warning');
      return;
    }
    setStaffFormLoading(true);
    try {
      const payload = { ...staffForm };
      if (editingStaff) {
        await staffAPI.update(editingStaff.id, payload);
        showSnackbar('Staff updated successfully');
      } else {
        await staffAPI.create(payload);
        showSnackbar('Staff created successfully');
      }
      setStaffDialogOpen(false);
      fetchStaff();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to save staff', 'error');
    } finally { setStaffFormLoading(false); }
  };

  const handleStaffToggle = async (staff) => {
    try {
      await staffAPI.toggle(staff.id);
      showSnackbar(`Staff ${staff.active ? 'deactivated' : 'activated'} successfully`);
      fetchStaff();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to toggle staff', 'error');
    }
  };

  const handleStaffDelete = async (staff) => {
    if (!window.confirm(`Delete staff "${staff.fullName}"?`)) return;
    try {
      await staffAPI.delete(staff.id);
      showSnackbar('Staff deleted successfully');
      fetchStaff();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to delete staff', 'error');
    }
  };

  const handleUserFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const openUserDialog = (user = null) => {
    setEditingUser(user);
    setUserForm(user ? {
      username: user.username || '',
      password: '',
      fullName: user.fullName || user.full_name || '',
      roles: user.roles || (user.role ? [user.role] : ['SALESPERSON']),
    } : { ...initialUser });
    setUserDialogOpen(true);
  };

  const handleUserSubmit = async () => {
    if (!userForm.username.trim() || !userForm.fullName.trim()) {
      showSnackbar('Username and full name are required', 'warning');
      return;
    }
    if (!editingUser && !userForm.password.trim()) {
      showSnackbar('Password is required for new users', 'warning');
      return;
    }
    if (!userForm.roles || userForm.roles.length === 0) {
      showSnackbar('At least one role is required', 'warning');
      return;
    }
    setUserFormLoading(true);
    try {
      const payload = { username: userForm.username, fullName: userForm.fullName, roles: userForm.roles };
      if (userForm.password) payload.password = userForm.password;
      if (editingUser) {
        await authAPI.updateUser(editingUser.id, payload);
        showSnackbar('User updated successfully');
      } else {
        await authAPI.register(payload);
        showSnackbar('User created successfully');
      }
      setUserDialogOpen(false);
      fetchUsers();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to save user', 'error');
    } finally { setUserFormLoading(false); }
  };

  const handleUserToggle = async (user) => {
    try {
      await authAPI.toggleUser(user.id);
      showSnackbar(`User ${user.enabled !== false ? 'disabled' : 'enabled'} successfully`);
      fetchUsers();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to toggle user', 'error');
    }
  };

  const doctorColumns = [
    { field: 'fullName', headerName: 'Full Name', flex: 1.5, minWidth: 160 },
    { field: 'gender', headerName: 'Gender', width: 80 },
    { field: 'phone', headerName: 'Phone', width: 120 },
    { field: 'specialization', headerName: 'Specialization', flex: 1, minWidth: 140 },
    { field: 'registrationNumber', headerName: 'Reg. No.', flex: 1, minWidth: 120 },
    { field: 'qualification', headerName: 'Qualification', flex: 1, minWidth: 120 },
    {
      field: 'active', headerName: 'Status', width: 90,
      renderCell: (params) => (
        <Chip label={params.value ? 'Active' : 'Inactive'} size="small" color={params.value ? 'success' : 'default'} />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openDoctorDialog(params.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={params.row.active ? 'Deactivate' : 'Activate'}><IconButton size="small" color={params.row.active ? 'warning' : 'success'} onClick={() => handleDoctorToggle(params.row)}><Block fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDoctorDelete(params.row)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const staffColumns = [
    { field: 'fullName', headerName: 'Full Name', flex: 1.5, minWidth: 160 },
    { field: 'gender', headerName: 'Gender', width: 80 },
    { field: 'phone', headerName: 'Phone', width: 120 },
    { field: 'designation', headerName: 'Designation', flex: 1, minWidth: 120 },
    { field: 'department', headerName: 'Department', flex: 1, minWidth: 120 },
    { field: 'employeeId', headerName: 'Emp ID', width: 100 },
    {
      field: 'active', headerName: 'Status', width: 90,
      renderCell: (params) => (
        <Chip label={params.value ? 'Active' : 'Inactive'} size="small" color={params.value ? 'success' : 'default'} />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openStaffDialog(params.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={params.row.active ? 'Deactivate' : 'Activate'}><IconButton size="small" color={params.row.active ? 'warning' : 'success'} onClick={() => handleStaffToggle(params.row)}><Block fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleStaffDelete(params.row)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const userColumns = [
    {
      field: 'username', headerName: 'Username', flex: 1, minWidth: 120,
      renderCell: (params) => <Typography variant="body2" fontWeight={600}>{params.value}</Typography>,
    },
    {
      field: 'fullName', headerName: 'Full Name', flex: 1.5, minWidth: 180,
      valueGetter: (params) => params.row.fullName || params.row.full_name || '',
    },
    {
      field: 'roles', headerName: 'Roles', flex: 1, minWidth: 200,
      valueGetter: (params) => params.row.roles || (params.row.role ? [params.row.role] : []),
      renderCell: (params) => (
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {(params.value || []).map((role) => (
            <Chip key={role} label={role} size="small" color={getRoleColor(role)} variant="outlined" />
          ))}
        </Box>
      ),
    },
    {
      field: 'enabled', headerName: 'Status', width: 120,
      renderCell: (params) => (
        <Chip label={params.value !== false ? 'Active' : 'Disabled'} size="small" color={params.value !== false ? 'success' : 'default'} />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openUserDialog(params.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={params.row.enabled !== false ? 'Disable' : 'Enable'}>
            <Switch size="small" checked={params.row.enabled !== false} onChange={() => handleUserToggle(params.row)} color="primary" />
          </Tooltip>
        </Box>
      ),
    },
  ];

  const renderDoctorFormFields = () => (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Full Name *" value={doctorForm.fullName} onChange={(e) => handleDoctorFormChange('fullName', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Gender</InputLabel>
          <Select value={doctorForm.gender} label="Gender" onChange={(e) => handleDoctorFormChange('gender', e.target.value)}>
            {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Date of Birth" type="date" value={doctorForm.dateOfBirth} onChange={(e) => handleDoctorFormChange('dateOfBirth', e.target.value)} InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Phone *" value={doctorForm.phone} onChange={(e) => handleDoctorFormChange('phone', e.target.value)} inputProps={{ maxLength: 10 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Email" type="email" value={doctorForm.email} onChange={(e) => handleDoctorFormChange('email', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Aadhaar Number" value={doctorForm.aadhaarNumber} onChange={(e) => handleDoctorFormChange('aadhaarNumber', e.target.value)} inputProps={{ maxLength: 12 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="PAN Number" value={doctorForm.panNumber} onChange={(e) => handleDoctorFormChange('panNumber', e.target.value)} inputProps={{ maxLength: 10 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Pincode" value={doctorForm.pincode} onChange={(e) => handleDoctorFormChange('pincode', e.target.value)} inputProps={{ maxLength: 6 }} />
      </Grid>
      <Grid item xs={12}>
        <Autocomplete
          options={INDIAN_STATES}
          value={doctorForm.state || null}
          onChange={(_, v) => handleDoctorFormChange('state', v || '')}
          isOptionEqualToValue={(option, value) => option === value}
          renderInput={(params) => <TextField {...params} size="small" label="State" />}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth size="small" label="Address" multiline rows={2} value={doctorForm.address} onChange={(e) => handleDoctorFormChange('address', e.target.value)} />
      </Grid>
      <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" mt={1}>Medical Details</Typography></Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Registration Number" value={doctorForm.registrationNumber} onChange={(e) => handleDoctorFormChange('registrationNumber', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Registration Council" value={doctorForm.registrationCouncil} onChange={(e) => handleDoctorFormChange('registrationCouncil', e.target.value)} placeholder="e.g. Medical Council of India" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Qualification" value={doctorForm.qualification} onChange={(e) => handleDoctorFormChange('qualification', e.target.value)} placeholder="e.g. MBBS, MD" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Specialization" value={doctorForm.specialization} onChange={(e) => handleDoctorFormChange('specialization', e.target.value)} placeholder="e.g. Cardiology" />
      </Grid>
      <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" mt={1}>Security</Typography></Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label={editingDoctor ? 'Passcode (leave blank to keep)' : 'Passcode *'} type="password" value={doctorForm.passcode || ''} onChange={(e) => handleDoctorFormChange('passcode', e.target.value)} />
      </Grid>
    </Grid>
  );

  const renderStaffFormFields = () => (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Full Name *" value={staffForm.fullName} onChange={(e) => handleStaffFormChange('fullName', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Gender</InputLabel>
          <Select value={staffForm.gender} label="Gender" onChange={(e) => handleStaffFormChange('gender', e.target.value)}>
            {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Date of Birth" type="date" value={staffForm.dateOfBirth} onChange={(e) => handleStaffFormChange('dateOfBirth', e.target.value)} InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Phone *" value={staffForm.phone} onChange={(e) => handleStaffFormChange('phone', e.target.value)} inputProps={{ maxLength: 10 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Email" type="email" value={staffForm.email} onChange={(e) => handleStaffFormChange('email', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Aadhaar Number" value={staffForm.aadhaarNumber} onChange={(e) => handleStaffFormChange('aadhaarNumber', e.target.value)} inputProps={{ maxLength: 12 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="PAN Number" value={staffForm.panNumber} onChange={(e) => handleStaffFormChange('panNumber', e.target.value)} inputProps={{ maxLength: 10 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Pincode" value={staffForm.pincode} onChange={(e) => handleStaffFormChange('pincode', e.target.value)} inputProps={{ maxLength: 6 }} />
      </Grid>
      <Grid item xs={12}>
        <Autocomplete
          options={INDIAN_STATES}
          value={staffForm.state || null}
          onChange={(_, v) => handleStaffFormChange('state', v || '')}
          isOptionEqualToValue={(option, value) => option === value}
          renderInput={(params) => <TextField {...params} size="small" label="State" />}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth size="small" label="Address" multiline rows={2} value={staffForm.address} onChange={(e) => handleStaffFormChange('address', e.target.value)} />
      </Grid>
      <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" mt={1}>Employment Details</Typography></Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Employee ID" value={staffForm.employeeId} onChange={(e) => handleStaffFormChange('employeeId', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Designation" value={staffForm.designation} onChange={(e) => handleStaffFormChange('designation', e.target.value)} placeholder="e.g. Pharmacist, Accountant" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Department" value={staffForm.department} onChange={(e) => handleStaffFormChange('department', e.target.value)} placeholder="e.g. Sales, Inventory" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Qualification" value={staffForm.qualification} onChange={(e) => handleStaffFormChange('qualification', e.target.value)} placeholder="e.g. B.Pharm, D.Pharm" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label="Date of Joining" type="date" value={staffForm.dateOfJoining} onChange={(e) => handleStaffFormChange('dateOfJoining', e.target.value)} InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" mt={1}>Security</Typography></Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" label={editingStaff ? 'Passcode (leave blank to keep)' : 'Passcode *'} type="password" value={staffForm.passcode || ''} onChange={(e) => handleStaffFormChange('passcode', e.target.value)} />
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>User Management</Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<LocalHospital />} iconPosition="start" label="Doctor Details" />
          <Tab icon={<Badge />} iconPosition="start" label="Staff Details" />
          <Tab icon={<People />} iconPosition="start" label="User Permissions" />
        </Tabs>
      </Paper>

      {mainTab === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Doctors</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => openDoctorDialog()}>Add Doctor</Button>
            </Box>
            <DataGrid
              rows={doctors}
              columns={doctorColumns}
              loading={doctorsLoading}
              pageSize={25}
              rowsPerPageOptions={[25, 50]}
              disableRowSelectionOnClick
              autoHeight
              sx={{ minHeight: 400 }}
              getRowId={(row) => row.id}
            />
          </CardContent>
        </Card>
      )}

      {mainTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Staff</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => openStaffDialog()}>Add Staff</Button>
            </Box>
            <DataGrid
              rows={staffList}
              columns={staffColumns}
              loading={staffLoading}
              pageSize={25}
              rowsPerPageOptions={[25, 50]}
              disableRowSelectionOnClick
              autoHeight
              sx={{ minHeight: 400 }}
              getRowId={(row) => row.id}
            />
          </CardContent>
        </Card>
      )}

      {mainTab === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>User Accounts & Permissions</Typography>
              <Button variant="contained" startIcon={<PersonAdd />} onClick={() => openUserDialog()}>Add User</Button>
            </Box>
            <DataGrid
              rows={users}
              columns={userColumns}
              loading={usersLoading}
              pageSize={25}
              rowsPerPageOptions={[25, 50]}
              disableRowSelectionOnClick
              autoHeight
              sx={{ minHeight: 400 }}
              getRowId={(row) => row.id}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={doctorDialogOpen} onClose={() => setDoctorDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalHospital color="primary" />
            {editingDoctor ? 'Edit Doctor' : 'Add Doctor'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderDoctorFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDoctorDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDoctorSubmit} disabled={doctorFormLoading}
            startIcon={doctorFormLoading ? <CircularProgress size={16} /> : null}>
            {doctorFormLoading ? 'Saving...' : editingDoctor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={staffDialogOpen} onClose={() => setStaffDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge color="primary" />
            {editingStaff ? 'Edit Staff' : 'Add Staff'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderStaffFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStaffSubmit} disabled={staffFormLoading}
            startIcon={staffFormLoading ? <CircularProgress size={16} /> : null}>
            {staffFormLoading ? 'Saving...' : editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <People color="primary" />
            {editingUser ? 'Edit User' : 'Add User'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Username *" value={userForm.username} onChange={(e) => handleUserFormChange('username', e.target.value)} disabled={!!editingUser} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Full Name *" value={userForm.fullName} onChange={(e) => handleUserFormChange('fullName', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label={editingUser ? 'New Password (leave blank to keep)' : 'Password *'} type="password" value={userForm.password} onChange={(e) => handleUserFormChange('password', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple options={ROLES} value={userForm.roles}
                onChange={(_, newValue) => handleUserFormChange('roles', newValue)}
                renderTags={(value, getTagProps) => value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" color={getRoleColor(option)} {...getTagProps({ index })} key={option} />
                ))}
                renderInput={(params) => <TextField {...params} variant="outlined" label="Roles *" size="small" placeholder="Select roles" />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUserSubmit} disabled={userFormLoading}
            startIcon={userFormLoading ? <CircularProgress size={16} /> : null}>
            {userFormLoading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Users;
