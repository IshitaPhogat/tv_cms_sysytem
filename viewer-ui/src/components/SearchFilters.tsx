import React from 'react';

export default function SearchFilters({
    searchQ,
    setSearchQ,
    category,
    setCategory,
    language,
    setLanguage,
    categories,
    languages
}: {
    searchQ: string;
    setSearchQ: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    language: string;
    setLanguage: (value: string) => void;
    categories: string[];
    languages: string[];
}) {
    return (
        <div
            style={{
                display: 'flex',
                gap: '15px',
                padding: '20px 40px',
                background: '#141414',
                flexWrap: 'wrap'
            }}
        >
            <input
                type="text"
                placeholder="Search shows, episodes, categories..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{
                    padding: '10px',
                    background: '#333',
                    border: '1px solid #555',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '300px'
                }}
            />

            <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                    padding: '10px',
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px'
                }}
            >
                <option value="">All Categories</option>

                {categories.map(cat => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>

            <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{
                    padding: '10px',
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px'
                }}
            >
                <option value="">All Languages</option>

                {languages.map(lang => (
                    <option key={lang} value={lang}>
                        {lang === 'en'
                            ? 'English'
                            : lang === 'hi'
                                ? 'Hindi'
                                : lang}
                    </option>
                ))}
            </select>
        </div>
    );
}