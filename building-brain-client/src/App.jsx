import { Box, Typography, Stack, Avatar, Button, useTheme, Grid, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import ServiceGPTProvider from './components/ServiceGPTProvider';
import { Router, Route, Routes, useNavigate } from "react-router-dom";
import { useState } from 'react';
import Login from './Login';
import ChatInterface from './ChatInterfaceMui';
import { useAuth0 } from "@auth0/auth0-react";
import Files from './components/Files';
import axios from 'axios';
import { lp } from './lp';
import Navigation from './components/Navigation';
import { UniversalAlert } from './components/UniversalAlert';

//////////////////////////////////////////////////
///////////////// LOCAL IMPORTS  /////////////////
//////////////////////////////////////////////////

/** This section is for any imports coming from local files */
///////////////////////////////////////////
///////////////// STYLES  /////////////////
///////////////////////////////////////////

/** we already did the style import for you! */

import BuildingBrainLogo from './assets/buildingBrainLogo.png'

import './App.css'
import Loading from './components/Loading';
import { useEffect } from 'react';
import { createServiceGPTClient, getServiceGPTClient } from './utils/ServiceGPTClient';
import { extractPlatformId, changeFaviconAndTitle } from './utils/utils'
import _ from 'lodash';

/////////////////////////////////////////////////////////
///////////////// FACTORIES AND CONFIG  /////////////////
/////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////
///////////////// BUSINESS LOGIC ////////////////////////
/////////////////////////////////////////////////////////

/** This is where your main functional component goes */

let apiClient = null;


function App() {
  const { isLoading, isAuthenticated, error, logout, refresh_token, getAccessTokenWithPopup, getAccessTokenSilently, user, } = useAuth0();
  const [loading, setLoading] = useState(null);
  const [platformId, setPlatformId] = useState(0);
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  let token = null;

  useEffect(() => {
    // lets check for and load the URL params
    const foundPlatformId = parseInt(extractPlatformId(window.location.href));
    if (foundPlatformId != null) {
      setPlatformId(foundPlatformId);

    }

    // lets also change the favicon if we need too
  }, [window.location.href])

  useEffect(() => {
      changeFaviconAndTitle(BuildingBrainLogo, 'Welcome to Building Brain')
  }, [platformId])

  const configureServiceGPTClient = async () => {
    try {
      setLoading(true)
      if (isAuthenticated == false) {
        console.log(`Is Authenticated is false`)
        return;
      }
      token = await getAccessTokenSilently();
      // const token = await getAccessTokenWithPopup();
    } catch (e) {
      if (e.error === 'login_required') {
        // alert(`${e.error} found`)
        loginWithRedirect();
      }
      if (e.error === 'consent_required') {
        // alert(`${e.error} found`)
        loginWithRedirect();
      }
      console.error(e)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
      // throw e
    }
    // Create an Axios client with the access token as a default Authorization header
    apiClient = await getServiceGPTClient(token)

    setLoading(false);
  }

  useEffect(() => {
    configureServiceGPTClient();
  }, [isAuthenticated, user]);



  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (isAuthenticated != true && window.location.pathname != '/login') {
    window.location.href = '/login';
    return;
  }


  if (!apiClient && window.location.pathname != '/login') {
    return <Loading />;
  }


  return (
    <Box backgroundColor={theme.palette.primary.contrastText} sx={{ boxShadow: 3 }} height="100vh">
      <AppBar position="static">
        <Toolbar sx={{ minHeight: `10vh`, boxShadow: '0 5px 5px -5px rgba(0, 0, 0, 0.5)'}}>
          <Grid container spacing={1} justifyContent="flex-start" alignItems="center" direction="row">
            <Grid item>
            {isAuthenticated && <IconButton edge="start" variant={`text`} color="inherit" aria-label="menu" onClick={() => setOpen(true)}>
                <MenuIcon sx={{
                  color: theme.palette.primary.contrastText,
                }} />
              </IconButton>}
            </Grid>
            <Grid item>
              <Avatar
                alt="Building Brain Logo"
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
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Navigation onClose={() => setOpen(false)} platformId={platformId} isAuthenticated={isAuthenticated} user={user} logout={logout} />
      </Drawer>
      <Box padding={0}>
        <Stack spacing={1} direction="column">
          <Stack spacing={2} direction="column">
            <Routes>
              <Route path="/" element={<ChatInterface />} />
              <Route path="/Files" element={<Files />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export default (props) => {
  return (
    <ServiceGPTProvider>
      <UniversalAlert />
      <App {...props} />
    </ServiceGPTProvider>
  )
}
