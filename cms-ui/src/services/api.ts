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


export const fetchDrafts = async (
    q?: string,
    section?: string,
    language?: string,
    status?: string,
    page: number = 1,
    pageSize: number = 20
) => {

    const params = new URLSearchParams();

    if (q) params.append('q', q);
    if (section) params.append('section', section);
    if (language) params.append('language', language);
    if (status) params.append('status', status);

    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const response = await axios.get(
        `${API_BASE}/admin/drafts?${params.toString()}`
    );

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

export const fetchPublishedCatalog = async () => {
    const response = await axios.get(`${API_BASE}/catalog`);
    return response.data;
};

export const fetchValidationReport = async () => {
    const response = await axios.get(`${API_BASE}/admin/validation-report`, {
        headers: { 'X-User-Role': 'admin' }
    });
    return response.data;
};