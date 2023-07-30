import React from 'react';
import { List, Typography, Grid, Divider, Avatar, useTheme, IconButton, ListItem, ListItemText, ListItemSecondaryAction, Chip } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';

import { UniversalAlertCtrl } from './UniversalAlert';


const Navigation = ({ platformId, isAuthenticated, user, logout, onClose, }) => {
    const navigate = useNavigate();
    const theme = useTheme();

    const handleFeatureComingSoonClick = () => {
        UniversalAlertCtrl.show(`This feature is coming soon! Please check back later`, 'info', 2000);
    }

    const handleNavItemClick = (path) => {
        navigate(path);
        setTimeout(() => {
            onClose();
        }, 100)
    }

    const renderNavItems = () => {
        return (
            <>
                <ListItem button onClick={() => handleNavItemClick('/')}>
                    <ListItemText primary="Home" />
                </ListItem>
                <ListItem button onClick={() => navigate('/files')}>
                        <ListItemText primary="Files" />
                    </ListItem>
            </>
        );
    };

    return (
        <Grid container direction={`row`}>
            <Grid item xs={12} sx={{
                backgroundColor: theme.palette.primary.main,
                padding: 1,
                boxShadow: '0 5px 5px -5px rgba(0, 0, 0, 0.5)',
            }}

            >
                <Grid container spacing={1} justifyContent="space-between" alignItems="center" direction="row">
                    <Grid item container spacing={1} justifyContent="flex-start" alignItems="center" direction="row" xs={8}>
                        <Grid item>
                            <IconButton edge="start" variant={`text`} color="inherit" aria-label="menu" onClick={() => onClose()}>
                                <MenuIcon sx={{
                                    color: theme.palette.primary.contrastText,
                                }} />
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <Avatar
                                alt="Logo"
                                variant="round"
                                sx={{
                                    width: theme.branding.logoSize,
                                    height: theme.branding.logoSize,
                                    boxShadow: 5,
                                }}
                                src={theme.branding.logo}
                            />
                        </Grid>
                        <Grid item>
                            <Typography variant="h6" color="primary.contrastText">
                                {theme.branding.title}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid item >
                            <IconButton edge="start" variant={`text`} color="inherit" aria-label="menu" onClick={() => onClose()}>
                                <CloseIcon sx={{
                                    color: theme.palette.primary.contrastText,
                                }} />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <List>{renderNavItems()}</List>
            </Grid>
            <Grid item xs={12}>
                <Divider />
                <List>
                    <ListItem sx={{ backgroundColor: theme.palette.navigation.userBackground }}>
                        {isAuthenticated && (
                            <Typography variant="subtitle" fontWeight={600}>
                                {_.startCase(user?.name) || _.truncate(user?.email, 10) || 'User'}
                            </Typography>
                        )}
                    </ListItem>
                    <ListItem>
                        <List>
                            {isAuthenticated ?
                                (<ListItem button onClick={() => logout({ logoutParams: { returnTo: window.location.origin, client_id: import.meta.env.VITE_AUTH0_CLIENT_ID } })}>
                                    <ListItemText primary="Logout" />
                                </ListItem>) : (<ListItem button onClick={() => navigate('/login')}>
                                    <ListItemText primary="Login" />
                                </ListItem>)
                            }
                        </List>
                    </ListItem>
                </List>
            </Grid>
        </Grid>
    );
};

export default Navigation;
