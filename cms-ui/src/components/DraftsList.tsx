import React, { useState, useEffect } from 'react';
import { fetchSearchCatalog, triggerSeedData } from '../services/api';
import ArtworkUploader from './ArtworkUploader';
import { Episode } from '../../types';

export default function DraftsList() {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters & Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');

    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
    const [seedMessage, setSeedMessage] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchSearchCatalog(searchQuery, undefined, languageFilter, sectionFilter);
            setEpisodes(data.results || []);
        } catch (err: any) {
            setError("Failed to connect to backend server. Please check if Docker is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchQuery, sectionFilter, languageFilter]);

    const handleSeed = async () => {
        try {
            const res = await triggerSeedData();
            setSeedMessage(res.message);
            loadData();
        } catch (err) {
            setSeedMessage("Seeding failed.");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Content Management & Drafts</h2>
            
            {/* Toolbar: Search, Filters, and Seed Button */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="Search shows, episodes, categories..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ padding: '8px', width: '250px' }}
                />
                <input 
                    type="text" 
                    placeholder="Filter by Section..." 
                    value={sectionFilter} 
                    onChange={e => setSectionFilter(e.target.value)}
                    style={{ padding: '8px', width: '180px' }}
                />
                <input 
                    type="text" 
                    placeholder="Filter by Language..." 
                    value={languageFilter} 
                    onChange={e => setLanguageFilter(e.target.value)}
                    style={{ padding: '8px', width: '180px' }}
                />
                <button onClick={handleSeed} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                    📥 Seed JSON Data
                </button>
            </div>

            {seedMessage && <p style={{ color: 'green' }}>{seedMessage}</p>}

            {/* HANDLED STATES */}
            {loading && <p>Loading catalog items...</p>}
            
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>}

            {!loading && !error && episodes.length === 0 && (
                <div style={{ padding: '30px', background: '#f8f9fa', textAlign: 'center', borderRadius: '6px' }}>
                    <p>No episodes or drafts found matching your criteria.</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>Click "Seed JSON Data" to populate initial records.</p>
                </div>
            )}

            {/* Data Table */}
            {!loading && !error && episodes.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Episode Title</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Language</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {episodes.map(ep => (
                            <tr key={ep.episode_id}>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{ep.episode_id}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{ep.episode_title}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{ep.language}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: ep.status === 'published' ? '#d4edda' : '#fff3cd' }}>
                                        {ep.status || 'draft'}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    <button onClick={() => setSelectedEpisodeId(ep.episode_id)}>
                                        🖼️ Manage Artwork
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Artwork Management Modal / Drawer */}
            {/* Artwork Management Modal */}
            {selectedEpisodeId && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.55)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px',
                    }}
                >
                    <div
                        style={{
                        background: '#fff',
                        width: '90%',
                        maxWidth: '1100px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        borderRadius: '10px',
                        padding: '25px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <div>
                            <h3 style={{ margin: 0 }}>
                                Manage Artwork
                            </h3>

                            <p
                                style={{
                                    margin: '5px 0 0',
                                    color: '#666',
                                    fontSize: '14px',
                                }}
                            >
                                Episode ID: <strong>{selectedEpisodeId}</strong>
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedEpisodeId(null)}
                            style={{
                                border: 'none',
                                background: '#eee',
                                padding: '8px 12px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <ArtworkUploader episodeId={selectedEpisodeId} />

                    <div
                        style={{
                            marginTop: '20px',
                            padding: '12px',
                            background: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#555',
                        }}
                    >
                        <strong>Publishing requirement:</strong>

                        <ul style={{ marginBottom: 0 }}>
                            <li>Episode must have a duration.</li>
                            <li>Episode must have at least one valid artwork.</li>
                            <li>Poster, banner, and thumbnail are optional individually.</li>
                        </ul>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}