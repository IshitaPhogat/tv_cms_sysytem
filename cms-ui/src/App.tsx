import React, { useState } from 'react';
import DraftsList from './components/DraftsList';
import PublishedCatalog from './components/PublishedCatalog';
import PublishCenter from './components/PublishCentre';

export default function App() {
    const [activeTab, setActiveTab] = useState<'drafts' | 'catalog' | 'publish'>('drafts');
    const [role, setRole] = useState<string>('admin'); // Toggle between 'editor' and 'admin'

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#fdfdfd' }}>
            {/* Top Navigation & Role Switcher Header */}
            <header style={{ background: '#343a40', color: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '20px' }}>📺 Peblo TV CMS Dashboard</h1>
                
                <div>
                    <span style={{ marginRight: '10px', fontSize: '14px' }}>Simulate Role:</span>
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '5px' }}>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                    </select>
                </div>
            </header>

            {/* Tab Buttons */}
            <nav style={{ display: 'flex', background: '#e9ecef', borderBottom: '1px solid #ced4da' }}>
                <button 
                    onClick={() => setActiveTab('drafts')} 
                    style={{ padding: '12px 25px', background: activeTab === 'drafts' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'drafts' ? '2px solid #007bff' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📝 Drafts & Content
                </button>
                <button 
                    onClick={() => setActiveTab('catalog')} 
                    style={{ padding: '12px 25px', background: activeTab === 'catalog' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'catalog' ? '2px solid #007bff' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📂 Published Catalog (`catalog.json`)
                </button>
                <button 
                    onClick={() => setActiveTab('publish')} 
                    style={{ padding: '12px 25px', background: activeTab === 'publish' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'publish' ? '2px solid #007bff' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🚀 Publish Center
                </button>
            </nav>

            {/* Main Content Area */}
            <main>
                {activeTab === 'drafts' && <DraftsList />}
                {activeTab === 'catalog' && <PublishedCatalog />}
                {activeTab === 'publish' && <PublishCenter role={role} />}
            </main>
        </div>
    );
}