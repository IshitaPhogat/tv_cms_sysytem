import React, { useState, useEffect } from 'react';
import { publishCatalogApi, fetchValidationReport } from '../services/api';

export default function PublishCenter({ role }: { role: string }) {
    const [publishResult, setPublishResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        fetchValidationReport()
            .then((data: any) => setReport(data))
            .catch(() => setReport({ message: "No validation failures logged." }));
    }, []);

    const handlePublish = async () => {
        try {
            setErrorMsg(null);
            const res = await publishCatalogApi(role);
            setPublishResult(res);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'string') {
                setErrorMsg(detail);
            } else {
                setErrorMsg(JSON.stringify(detail || "Publishing failed."));
            }
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Publish & Audit Center</h2>
            <p>Current Role in CMS: <strong>{role.toUpperCase()}</strong></p>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#e9ecef', borderRadius: '6px' }}>
                <h3>Publish Control</h3>
                <button 
                    onClick={handlePublish}
                    style={{ background: role === 'admin' ? '#28a745' : '#6c757d', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                >
                    🚀 Publish Catalog to Production
                </button>

                {role === 'editor' && (
                    <p style={{ color: '#d9534f', fontSize: '13px', marginTop: '8px' }}>
                        ⚠️ You are logged in as an <strong>Editor</strong>. Clicking publish will trigger the non-technical permission block message.
                    </p>
                )}
            </div>

            {errorMsg && (
                <div style={{ padding: '15px', background: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
                    <h4>⚠️ Action Blocked</h4>
                    <p>{errorMsg}</p>
                </div>
            )}

            {publishResult && (
                <div style={{ padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '5px', marginBottom: '20px' }}>
                    <h4>✅ Success!</h4>
                    <p>{publishResult.message}</p>
                    <p>Published Episodes Count: {publishResult.published_episodes_count}</p>
                </div>
            )}

                <div style={{ marginTop: '20px' }}>
                    <h3>Unified Validation Report</h3>
                        <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word',   maxWidth: '100%', boxSizing: 'border-box', overflowX: 'auto',

                        }}
                    >
                        {JSON.stringify(report, null, 2)}
                    </pre>
            </div>
        </div>
    );
}