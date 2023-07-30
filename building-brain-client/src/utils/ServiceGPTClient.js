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

// Add to your apiClient implementation
export const uploadFile = (file, filename, onUploadProgress) => {
    const staticPlatformId = parseInt(extractPlatformId(window.location.href));

    const client = getServiceGPTClient(token);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    return client.post(`api/files?platformId=${staticPlatformId}`, formData, {
        onUploadProgress: onUploadProgress
    });
}

export const getFiles = ({onlyUserItems}) => {
    const staticPlatformId = parseInt(extractPlatformId(window.location.href));

    const client = getServiceGPTClient(token);
    return client.get(`api/files?platformId=${staticPlatformId}&onlyUserItems=${onlyUserItems}`);
}

export const getFileLink = ({fileId}) => {
    const staticPlatformId = parseInt(extractPlatformId(window.location.href));

    const client = getServiceGPTClient(token);

    return client.get(`api/files/link/${fileId}?platformId=${staticPlatformId}&onlyUserItems=${onlyUserItems}`);
}

export const deleteFile = async (fileId) => {
    try {
        const staticPlatformId = parseInt(extractPlatformId(window.location.href));
        const client = getServiceGPTClient(token);
        
        const response = await client.delete(`/api/files?platformId=${staticPlatformId}&fileId=${fileId}`, {
            fileId: fileId
        });

        if (response.status === 200) {
            UniversalAlertCtrl.show('File deleted successfully', 'success');
        } else {
            UniversalAlertCtrl.show('Failed to delete file', 'error');
        }
    } catch (error) {
        console.error(error);
        UniversalAlertCtrl.show('Failed to delete file', 'error');
    }
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