import React, { useEffect, useState } from 'react';
import { fetchPublishedCatalog } from '../services/api';

export default function PublishedCatalog() {
    const [catalogData, setCatalogData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPublishedCatalog()
            .then((data: any) => {
                setCatalogData(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Catalogue has not been published yet or file not found.");
                setLoading(false);
            });
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Published Catalog Viewer (`catalog.json`)</h2>
            {loading && <p>Loading live catalog...</p>}
            {error && <p style={{ color: 'orange' }}>{error}</p>}
            {catalogData && (
                <div>
                    <p><strong>Generated At:</strong> {catalogData.generated_at}</p>
                    <pre style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', maxHeight: '500px', overflow: 'auto' }}>
                        {JSON.stringify(catalogData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}