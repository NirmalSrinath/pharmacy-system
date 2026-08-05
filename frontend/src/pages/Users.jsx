import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
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
} from '@mui/material';
import {
  Add,
  Edit,
  People,
  PersonAdd,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const ROLES = ['ADMIN', 'PHARMACIST', 'SALESPERSON'];

const initialUser = {
  username: '',
  password: '',
  fullName: '',
  roles: ['SALESPERSON'],
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(initialUser);
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers();
      const data = res.data?.data || res.data?.content || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData(initialUser);
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      password: '',
      fullName: user.fullName || user.full_name || '',
      roles: user.roles || (user.role ? [user.role] : ['SALESPERSON']),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.fullName.trim()) {
      setSnackbar({ open: true, message: 'Username and full name are required', severity: 'warning' });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setSnackbar({ open: true, message: 'Password is required for new users', severity: 'warning' });
      return;
    }

    if (!formData.roles || formData.roles.length === 0) {
      setSnackbar({ open: true, message: 'At least one role is required', severity: 'warning' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        username: formData.username,
        fullName: formData.fullName,
        roles: formData.roles,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await authAPI.updateUser(editingUser.id, payload);
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      } else {
        await authAPI.register(payload);
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
      }

      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save user';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleUser = async (user) => {
    try {
      await authAPI.toggleUser(user.id);
      setSnackbar({
        open: true,
        message: `User ${user.enabled ? 'disabled' : 'enabled'} successfully`,
        severity: 'success',
      });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to toggle user status';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'error';
    if (role === 'PHARMACIST') return 'primary';
    return 'success';
  };

  const columns = [
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => params.row.fullName || params.row.full_name || '',
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.row.roles || (params.row.role ? [params.row.role] : []),
      renderCell: (params) => {
        const roles = params.value || [];
        return (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {roles.map((role) => (
              <Chip
                key={role}
                label={role}
                size="small"
                color={getRoleColor(role)}
                variant="outlined"
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value !== false ? 'Active' : 'Disabled'}
          size="small"
          color={params.value !== false ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => openEditDialog(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.enabled !== false ? 'Disable' : 'Enable'}>
            <Switch
              size="small"
              checked={params.row.enabled !== false}
              onChange={() => handleToggleUser(params.row)}
              color="primary"
            />
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>User Management</Typography>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={openAddDialog}>
          Add User
        </Button>
      </Box>

      <Card>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSize={25}
          rowsPerPageOptions={[25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ minHeight: 500 }}
          getRowId={(row) => row.id}
        />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <People color="primary" />
            {editingUser ? 'Edit User' : 'Add User'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Username *"
                value={formData.username} onChange={(e) => handleFormChange('username', e.target.value)}
                disabled={!!editingUser}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Full Name *"
                value={formData.fullName} onChange={(e) => handleFormChange('fullName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label={editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
                type="password"
                value={formData.password} onChange={(e) => handleFormChange('password', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={ROLES}
                value={formData.roles}
                onChange={(_, newValue) => handleFormChange('roles', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      color={getRoleColor(option)}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Roles *" size="small" placeholder="Select roles" />
                )}
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
            {formLoading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
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

export default Users;
