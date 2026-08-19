import axios from 'axios';

const API_BASE = "http://localhost:8001";
// const API_BASE =  process.env.REACT_APP_API_URL || "http://localhost:8001";

export const fetchSearchCatalog = async (q?: string, category?: string, language?: string, section?: string) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    if (language) params.append('language', language);
    if (section) params.append('section', section);

    const response = await axios.get(`${API_BASE}/catalog/search?${params.toString()}`);
    return response.data;
};

export const triggerSeedData = async () => {
    const response = await axios.post(`${API_BASE}/admin/seed-data`);
    return response.data;
};

export const uploadArtwork = async (episodeId: string | number, artworkType: string, file: File) => {
    const formData = new FormData();
    formData.append('episode_id', episodeId.toString());
    formData.append('artwork_type', artworkType);
    formData.append('file', file);

    const response = await axios.post(`${API_BASE}/admin/upload-artwork`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const publishCatalogApi = async (role: string) => {
    const response = await axios.post(`${API_BASE}/admin/catalog/publish`, {}, {
        headers: { 'X-User-Role': role }
    });
    return response.data;
};

// 🟢 Added these two helper functions so components don't need to import axios directly
export const fetchPublishedCatalog = async () => {
    const response = await axios.get(`${API_BASE}/storage_data/catalogue.json`);
    return response.data;
};

export const fetchValidationReport = async () => {
    const response = await axios.get(`${API_BASE}/storage_data/validation_report.json`);
    return response.data;
};