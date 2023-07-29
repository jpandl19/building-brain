import React, { useState, useEffect, createContext } from 'react'
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material';
import { store } from '../redux/store';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from "@auth0/auth0-react";
import { extractPlatformId } from '../utils/utils'

/** This secion is for any one-time class instansiation or config creation */
import theme from './../theme'


function ServiceGPTProvider(props) {
    const [platformId, setPlatformId] = useState(0);
    useEffect(() => {
        // lets check for and load the URL params
        const foundPlatformId = extractPlatformId(window.location.href);
        if (foundPlatformId != null) {
            setPlatformId(foundPlatformId);
        }
    }, [window.location.href])

    return (
        <>

            <Auth0Provider
                domain={import.meta.env.VITE_AUTH0_DOMAIN}
                clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
                cacheLocation="localstorage"
                useRefreshTokens={true}
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    audience: `https://servicegpt.app`,
                    scope: "read:current_user openid profile email offline_access",
                }}
            >
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <BrowserRouter>
                            <CssBaseline />
                            {props.children}
                        </BrowserRouter>
                    </ThemeProvider>
                </Provider>
            </Auth0Provider>
        </>
    )
}

export default ServiceGPTProvider