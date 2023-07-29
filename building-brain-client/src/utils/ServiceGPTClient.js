import axios from 'axios';
import { extractPlatformId } from './utils';
import { UniversalAlertCtrl } from './../components/UniversalAlert';

let client = null;
let token = ``;
export const getServiceGPTClient = (accessToken = null) => {
    if (!client) {
        client = createServiceGPTClient(accessToken);
    }


    return client;
}

export const getAccessToken = () => {
    return token;
}

export const createServiceGPTClient = (accessToken) => {
    if (!accessToken) {
        throw new Error('No access token provided');
    }
    // Create an Axios client with the access token as a default Authorization header
    const axiosClient = axios.create({
        baseURL: `${import.meta.env.VITE_SERVER_BASE_URL}/`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            // Authorization: `Bearer poop`,
        },
    });

    // this is just a hack for now, eventually we should store this in redux
    token = accessToken;

    return axiosClient
}