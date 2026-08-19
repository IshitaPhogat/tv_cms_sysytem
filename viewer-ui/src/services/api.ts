import axios from 'axios';

export const API_BASE = "http://localhost:8001";

// The viewer is allowed to read ONLY the published catalogue.
export const fetchPublishedCatalog = async () => {
    const response = await axios.get(`${API_BASE}/storage_data/catalogue.json`);
    return response.data;
};

export const registerUser = async (userData: any) => {
    const response = await axios.post(`${API_BASE}/viewer/register`, userData);
    return response.data;
};

export const loginUser = async (credentials: any) => {
    const response = await axios.post(`${API_BASE}/viewer/login`, credentials);
    return response.data;
};

// Converts Docker storage paths from catalogue.json
// into URLs that the browser can actually request.
export const resolveArtworkUrl = (path?: string) => {
    if (!path) {
        return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('/app/storage_data/')) {
        return `${API_BASE}${path.replace('/app/storage_data', '/storage_data')}`;
    }

    if (path.startsWith('/storage_data/')) {
        return `${API_BASE}${path}`;
    }

    return path;
};