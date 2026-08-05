import React, { useState, useEffect } from 'react';
import { backupAPI } from '../services/api';
import { format } from 'date-fns';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Download,
  Delete,
  Refresh,
  CheckCircle,
  Error,
  CloudUpload,
  Email,
  Schedule,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

function Backup() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await backupAPI.getAll();
      const data = res.data?.data || res.data || [];
      setBackups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await backupAPI.create();
      setSnackbar({ open: true, message: 'Backup created successfully!', severity: 'success' });
      fetchBackups();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create backup';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backup) => {
    try {
      const res = await backupAPI.download(backup.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to download backup', severity: 'error' });
    }
  };

  const handleDeleteClick = (backup) => {
    setDeleteTarget(backup);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await backupAPI.delete(deleteTarget.id);
      setSnackbar({ open: true, message: 'Backup deleted', severity: 'success' });
      setDeleteDialog(false);
      setDeleteTarget(null);
      fetchBackups();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete backup', severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const stats = React.useMemo(() => {
    const totalBackups = backups.length;
    const successful = backups.filter(b => b.status === 'SUCCESS').length;
    const failed = backups.filter(b => b.status === 'FAILED').length;
    const lastBackup = backups.length > 0 ? backups[0] : null;

    return { totalBackups, successful, failed, lastBackup };
  }, [backups]);

  const columns = [
    {
      field: 'filename',
      headerName: 'Filename',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.filename || '',
    },
    {
      field: 'backupType',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'SCHEDULED' ? <Schedule fontSize="small" /> : <BackupIcon fontSize="small" />}
          label={params.value}
          size="small"
          color={params.value === 'SCHEDULED' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'SUCCESS' ? <CheckCircle fontSize="small" /> : <Error fontSize="small" />}
          label={params.value}
          size="small"
          color={params.value === 'SUCCESS' ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'fileSize',
      headerName: 'Size',
      width: 100,
      valueGetter: (params) => formatFileSize(params.value),
    },
    {
      field: 'emailSent',
      headerName: 'Email',
      width: 80,
      renderCell: (params) => (
        params.value ? <Email color="success" fontSize="small" /> : <Email color="disabled" fontSize="small" />
      ),
    },
    {
      field: 'onedriveUploaded',
      headerName: 'Cloud',
      width: 80,
      renderCell: (params) => (
        params.value ? <CloudUpload color="success" fontSize="small" /> : <CloudUpload color="disabled" fontSize="small" />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 180,
      valueGetter: (params) => {
        try { return format(new Date(params.value), 'dd MMM yyyy, hh:mm a'); }
        catch { return '-'; }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Download">
            <IconButton size="small" color="primary" onClick={() => handleDownload(params.row)}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row)}>
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
        <Typography variant="h4" fontWeight={700}>Database Backups</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchBackups}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} /> : <BackupIcon />}
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Backup'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Backups</Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.totalBackups}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Successful</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats.successful}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Failed</Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Last Backup</Typography>
              <Typography variant="body1" fontWeight={600}>
                {stats.lastBackup
                  ? format(new Date(stats.lastBackup.createdAt), 'dd MMM, hh:mm a')
                  : 'Never'}
              </Typography>
              {stats.lastBackup && (
                <Chip
                  label={stats.lastBackup.status}
                  size="small"
                  color={stats.lastBackup.status === 'SUCCESS' ? 'success' : 'error'}
                  sx={{ mt: 0.5 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <DataGrid
            rows={backups}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Backup</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.filename}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Backup;
