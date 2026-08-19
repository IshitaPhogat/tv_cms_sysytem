import React, { useEffect, useState } from 'react';
import { fetchPublishedCatalog } from './services/api';
import { Catalog, Show, User } from './types';

import AuthModal from './components/AuthModal';
import HeroBanner from './components/HeroBanner';
import CategoryRow from './components/CategoryRow';
import SearchFilters from './components/SearchFilters';
import ShowDetailModal from './components/ShowDetailModal';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [selectedShow, setSelectedShow] = useState<Show | null>(null);

    const [searchQ, setSearchQ] = useState('');
    const [category, setCategory] = useState('');
    const [language, setLanguage] = useState('');

    const [catalogError, setCatalogError] = useState<string | null>(null);

    useEffect(() => {
        fetchPublishedCatalog()
            .then(data => {
                setCatalog(data);
                setCatalogError(null);
            })
            .catch(error => {
                console.error("Failed to load published catalogue:", error);
                setCatalogError(
                    "The published catalogue could not be loaded."
                );
            });
    }, []);

    if (!user) {
        return (
            <AuthModal
                onLoginSuccess={(u) => setUser(u)}
            />
        );
    }

    if (catalogError) {
        return (
            <div
                style={{
                    background: '#141414',
                    color: '#fff',
                    minHeight: '100vh',
                    padding: '40px',
                    fontFamily: 'Arial, sans-serif'
                }}
            >
                <h1 style={{ color: '#e50914' }}>PEBLO TV</h1>
                <h2>Catalogue unavailable</h2>
                <p>{catalogError}</p>
                <p style={{ color: '#aaa' }}>
                    Please publish the catalogue from the CMS first.
                </p>
            </div>
        );
    }

    if (!catalog) {
        return (
            <div
                style={{
                    background: '#141414',
                    color: '#fff',
                    minHeight: '100vh',
                    padding: '40px',
                    fontFamily: 'Arial, sans-serif'
                }}
            >
                <h1 style={{ color: '#e50914' }}>PEBLO TV</h1>
                <p>Loading published catalogue...</p>
            </div>
        );
    }

    /*
     * Convert:
     *
     * catalogue.sections.featured
     * catalogue.sections.series
     * catalogue.sections.minisodes
     * catalogue.sections.songs
     *
     * into one flat list for searching/filtering.
     */
    const allShows: Show[] = Object.entries(catalog.sections || {})
        .flatMap(([sectionName, shows]) =>
            shows.map(show => ({
                ...show,
                section: sectionName
            }))
        );

    /*
     * Search and filters operate ONLY on published catalogue data.
     */
    const filteredShows = allShows.filter(show => {
        const query = searchQ.toLowerCase().trim();

        const matchesSearch =
            !query ||
            show.show_title.toLowerCase().includes(query) ||
            show.categories.some(category =>
                category.toLowerCase().includes(query)
            ) ||
            show.episodes.some(ep =>
                ep.episode_title.toLowerCase().includes(query)
            );

        const matchesCategory =
            !category ||
            show.categories.includes(category);

        const matchesLanguage =
            !language ||
            show.episodes.some(ep =>
                ep.languages.includes(language)
            );

        return matchesSearch && matchesCategory && matchesLanguage;
    });

    /*
     * Build category options dynamically from the published catalogue.
     */
    const categories = Array.from(
        new Set(
            allShows.flatMap(show => show.categories || [])
        )
    ).sort();

    /*
     * Languages also come from the published catalogue.
     */
    const languages = Array.from(
        new Set(
            allShows.flatMap(show =>
                show.episodes.flatMap(ep => ep.languages || [])
            )
        )
    ).sort();

    /*
     * Featured section is the source for the hero.
     */
    const featuredShows = catalog.sections?.featured || [];
    const featuredShow = featuredShows[0];

    /*
     * Keep the four catalogue sections in deterministic order.
     */
    const sectionOrder = [
        'featured',
        'series',
        'minisodes',
        'songs'
    ];

    const hasFilters =
        searchQ.trim() !== '' ||
        category !== '' ||
        language !== '';

    return (
        <div
            style={{
                background: '#141414',
                minHeight: '100vh',
                fontFamily: 'Arial, sans-serif',
                paddingBottom: '50px'
            }}
        >
            {/* Header */}
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 40px',
                    background: '#000',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                }}
            >
                <h1
                    style={{
                        color: '#e50914',
                        margin: 0,
                        fontSize: '24px'
                    }}
                >
                    PEBLO TV
                </h1>

                <span style={{ color: '#fff' }}>
                    Welcome, {user.name}
                </span>
            </header>

            {/* Search + Filters */}
            <SearchFilters
                searchQ={searchQ}
                setSearchQ={setSearchQ}
                category={category}
                setCategory={setCategory}
                language={language}
                setLanguage={setLanguage}
                categories={categories}
                languages={languages}
            />

            {/* Search results */}
            {hasFilters ? (
                <div style={{ padding: '20px 40px' }}>
                    <h3 style={{ color: '#fff' }}>
                        Search Results ({filteredShows.length})
                    </h3>

                    {filteredShows.length === 0 ? (
                        <div
                            style={{
                                padding: '50px 20px',
                                textAlign: 'center',
                                color: '#aaa',
                                background: '#1f1f1f',
                                borderRadius: '8px'
                            }}
                        >
                            <h3 style={{ color: '#fff' }}>
                                Nothing found
                            </h3>

                            <p>
                                Try a different title, category, or language.
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '20px'
                            }}
                        >
                            {filteredShows.map((show, index) => (
                                <div
                                    key={`${show.show_title}-${show.section}-${index}`}
                                    onClick={() => setSelectedShow(show)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CategoryRow
                                        title=""
                                        shows={[show]}
                                        onSelect={setSelectedShow}
                                        compact
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Featured Hero */}
                    {featuredShow && (
                        <HeroBanner
                            show={featuredShow}
                            onSelect={setSelectedShow}
                        />
                    )}

                    {/* Catalogue rows */}
                    {sectionOrder.map(section => {
                        const sectionShows =
                            catalog.sections?.[section] || [];

                        if (sectionShows.length === 0) {
                            return null;
                        }

                        return (
                            <CategoryRow
                                key={section}
                                title={
                                    section.charAt(0).toUpperCase() +
                                    section.slice(1)
                                }
                                shows={sectionShows}
                                onSelect={setSelectedShow}
                            />
                        );
                    })}
                </>
            )}

            {/* Show detail */}
            {selectedShow && (
                <ShowDetailModal
                    show={selectedShow}
                    onClose={() => setSelectedShow(null)}
                />
            )}
        </div>
    );
}