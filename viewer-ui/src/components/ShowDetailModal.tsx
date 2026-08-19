import React, { useMemo, useState } from 'react';
import { Show } from '../types';
import { resolveArtworkUrl } from '../services/api';

function getArtworkByType(show: Show, type: string) {
    return show.episodes
        .flatMap(ep => ep.artwork || [])
        .find(path =>
            path.toLowerCase().includes(`_${type}.`)
        );
}

export default function ShowDetailModal({
    show,
    onClose
}: {
    show: Show;
    onClose: () => void;
}) {
    /*
     * Build seasons from the published catalogue.
     *
     * Season 0 is intentionally excluded because it represents
     * trailers/extras and should not appear as a normal season.
     */
    const seasons = useMemo(() => {
        const seasonMap = new Map<number, typeof show.episodes>();

        show.episodes
            .filter(ep => ep.season_number > 0)
            .forEach(ep => {
                if (!seasonMap.has(ep.season_number)) {
                    seasonMap.set(ep.season_number, []);
                }

                seasonMap.get(ep.season_number)!.push(ep);
            });

        return Array.from(seasonMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([seasonNumber, episodes]) => ({
                seasonNumber,
                episodes
            }));
    }, [show]);

    const [selectedSeason, setSelectedSeason] = useState(
        seasons[0]?.seasonNumber || 1
    );

    const currentSeason =
        seasons.find(s => s.seasonNumber === selectedSeason) ||
        seasons[0];

    const banner = getArtworkByType(show, 'banner');

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                overflowY: 'auto',
                padding: '20px'
            }}
        >
            <div
                style={{
                    background: '#181818',
                    width: '800px',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    color: '#fff',
                    overflow: 'hidden',
                    position: 'relative',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: '#333',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    ✕
                </button>

                {/* Show hero */}
                <div
                    style={{
                        height: '350px',
                        background: banner
                            ? `linear-gradient(to top, #181818, transparent), url(${resolveArtworkUrl(banner)}) center/cover`
                            : '#222'
                    }}
                />

                <div style={{ padding: '30px' }}>
                    <h2>{show.show_title}</h2>

                    <p
                        style={{
                            color: '#aaa',
                            fontSize: '14px'
                        }}
                    >
                        {show.categories.length > 0
                            ? `Categories: ${show.categories.join(', ')}`
                            : 'No categories listed'}
                    </p>

                    <p
                        style={{
                            color: '#46d369',
                            fontWeight: 'bold'
                        }}
                    >
                        Languages:{' '}
                        {Array.from(
                            new Set(
                                show.episodes.flatMap(
                                    ep => ep.languages
                                )
                            )
                        ).map(lang =>
                            lang === 'en'
                                ? 'English'
                                : lang === 'hi'
                                    ? 'Hindi'
                                    : lang
                        ).join(' • ')}
                    </p>

                    {show.episodes[0]?.synopsis && (
                        <p
                            style={{
                                lineHeight: '1.5',
                                color: '#b3b3b3',
                                margin: '15px 0'
                            }}
                        >
                            {show.episodes[0].synopsis}
                        </p>
                    )}

                    {/* Season Tabs */}
                    {seasons.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                margin: '20px 0',
                                borderBottom: '1px solid #333',
                                paddingBottom: '10px',
                                flexWrap: 'wrap'
                            }}
                        >
                            {seasons.map(season => (
                                <button
                                    key={season.seasonNumber}
                                    onClick={() =>
                                        setSelectedSeason(
                                            season.seasonNumber
                                        )
                                    }
                                    style={{
                                        padding: '8px 16px',
                                        background:
                                            selectedSeason ===
                                            season.seasonNumber
                                                ? '#e50914'
                                                : '#333',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Season {season.seasonNumber}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Episodes */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}
                    >
                        {currentSeason?.episodes.map(ep => (
                            <div
                                key={ep.content_group}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '20px',
                                    background: '#222',
                                    padding: '12px',
                                    borderRadius: '4px'
                                }}
                            >
                                <div>
                                    <h4
                                        style={{
                                            margin: '0 0 5px 0'
                                        }}
                                    >
                                        {ep.episode_number}.{' '}
                                        {ep.episode_title}
                                    </h4>

                                    {ep.synopsis && (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                color: '#aaa'
                                            }}
                                        >
                                            {ep.synopsis}
                                        </p>
                                    )}

                                    <p
                                        style={{
                                            margin: '6px 0 0',
                                            fontSize: '12px',
                                            color: '#777'
                                        }}
                                    >
                                        Languages:{' '}
                                        {ep.languages.join(', ')}
                                    </p>
                                </div>

                                <span
                                    style={{
                                        fontSize: '13px',
                                        color: '#888',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {ep.duration_seconds
                                        ? `${Math.floor(
                                            ep.duration_seconds / 60
                                        )}m`
                                        : 'Duration unavailable'}
                                </span>
                            </div>
                        ))}

                        {!currentSeason && (
                            <p style={{ color: '#888' }}>
                                No regular episodes are available.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}