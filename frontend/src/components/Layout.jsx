import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Divider,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  PointOfSale,
  ShoppingCart,
  AssignmentReturn,
  Inventory,
  Medication,
  Assessment,
  NotificationsActive,
  People,
  Logout,
  AccountCircle,
  ChevronLeft,
  LocalPharmacy,
  ArrowBack,
  Backup,
  Upload,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', roles: ['ADMIN', 'PHARMACIST', 'SALESPERSON'] },
  { text: 'Sales', icon: <PointOfSale />, path: '/sales', roles: ['ADMIN', 'PHARMACIST', 'SALESPERSON'] },
  { text: 'Purchases', icon: <ShoppingCart />, path: '/purchases', roles: ['ADMIN', 'PHARMACIST'] },
  { text: 'Import Purchase', icon: <Upload />, path: '/purchase-import', roles: ['ADMIN'] },
  { text: 'Returns', icon: <AssignmentReturn />, path: '/returns', roles: ['ADMIN', 'PHARMACIST', 'SALESPERSON'] },
  { text: 'Stock', icon: <Inventory />, path: '/stock', roles: ['ADMIN', 'PHARMACIST'] },
  { text: 'Medicines', icon: <Medication />, path: '/medicines', roles: ['ADMIN', 'PHARMACIST'] },
  { text: 'Reports', icon: <Assessment />, path: '/reports', roles: ['ADMIN', 'PHARMACIST'] },
  { text: 'Alerts', icon: <NotificationsActive />, path: '/alerts', roles: ['ADMIN', 'PHARMACIST', 'SALESPERSON'] },
  { text: 'Users', icon: <People />, path: '/users', roles: ['ADMIN'] },
  { text: 'Backups', icon: <Backup />, path: '/backup', roles: ['ADMIN'] },
];

function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredItems = menuItems.filter(
    (item) => user && item.roles.some((r) => user.roles?.includes(r))
  );

  const drawerWidth = isMobile ? DRAWER_WIDTH : collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          px: collapsed && !isMobile ? 1 : 2,
          py: 2,
          minHeight: 64,
        }}
      >
        {(collapsed && !isMobile) ? (
          <Tooltip title="Pharmacy Management" placement="right">
            <IconButton onClick={handleNavigation.bind(null, '/')} sx={{ p: 0.5 }}>
              <Box component="img" src={import.meta.env.VITE_PHARMACY_LOGO || '/logo.svg'} alt="Logo" sx={{ height: 32, width: 32 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Box display="flex" alignItems="center" gap={1}>
              <Box component="img" src={import.meta.env.VITE_PHARMACY_LOGO || '/logo.svg'} alt="Logo" sx={{ height: 36, width: 36 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  {import.meta.env.VITE_PHARMACY_NAME || 'PharmaCare'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Management System
                </Typography>
              </Box>
            </Box>
            {!isMobile && (
              <IconButton onClick={handleDrawerToggle} size="small">
                <ChevronLeft />
              </IconButton>
            )}
          </>
        )}
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: collapsed && !isMobile ? 1 : 1.5, py: 1 }}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={collapsed && !isMobile ? item.text : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    px: collapsed && !isMobile ? 1 : 2,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      color: isActive ? 'white' : 'text.primary',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'white' : 'text.secondary',
                      minWidth: 0,
                      mr: collapsed && !isMobile ? 0 : 2,
                      justifyContent: 'center',
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {(!collapsed || isMobile) && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.9rem',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        {(!collapsed || isMobile) ? (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box overflow="hidden">
              <Typography variant="body2" fontWeight={600} noWrap>
                {user?.fullName || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.role}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Tooltip title={user?.fullName || user?.username} placement="right">
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, mx: 'auto' }}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {location.pathname !== '/' && (
            <Tooltip title="Back">
              <IconButton color="inherit" onClick={() => navigate(-1)}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
          )}

          <Typography variant="h6" noWrap sx={{ ml: 1 }}>
            {filteredItems.find((i) => i.path === location.pathname)?.text || import.meta.env.VITE_PHARMACY_NAME || 'PharmaCare'}
          </Typography>

          <Box sx={{ flex: 1 }} />

          <IconButton
            size="large"
            aria-label="notifications"
            color="inherit"
          >
            <Badge badgeContent={0} color="error">
              <NotificationsActive />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            edge="end"
            aria-label="account"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                Signed in as <strong>{user?.username}</strong>
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Role: {user?.role}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                handleProfileMenuClose();
                handleLogout();
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
