import React from 'react';
import { Show } from '../types';
import { resolveArtworkUrl } from '../services/api';

function getArtworkByType(show: Show, type: string) {
    return show.episodes
        .flatMap(ep => ep.artwork || [])
        .find(path =>
            path.toLowerCase().includes(`_${type}.`)
        );
}

export default function HeroBanner({
    show,
    onSelect
}: {
    show: Show;
    onSelect: (show: Show) => void;
}) {
    if (!show) {
        return null;
    }

    const banner =
        getArtworkByType(show, 'banner') ||
        getArtworkByType(show, 'poster');

    const firstEpisode = show.episodes[0];

    return (
        <div
            style={{
                position: 'relative',
                height: '560px',
                background: banner
                    ? `linear-gradient(to top, #141414 5%, transparent 70%), url(${resolveArtworkUrl(banner)}) center/cover`
                    : '#222',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '60px'
            }}
        >
            <div style={{ maxWidth: '700px' }}>
                <p
                    style={{
                        color: '#aaa',
                        textTransform: 'uppercase',
                        fontSize: '13px',
                        letterSpacing: '2px'
                    }}
                >
                    Featured
                </p>

                <h1
                    style={{
                        fontSize: '48px',
                        color: '#fff',
                        margin: '0 0 10px 0'
                    }}
                >
                    {show.show_title}
                </h1>

                {firstEpisode?.synopsis && (
                    <p
                        style={{
                            fontSize: '16px',
                            color: '#ddd',
                            maxWidth: '600px',
                            margin: '0 0 20px 0',
                            lineHeight: '1.4'
                        }}
                    >
                        {firstEpisode.synopsis}
                    </p>
                )}

                <button
                    onClick={() => onSelect(show)}
                    style={{
                        padding: '10px 25px',
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    ▶ View Details
                </button>
            </div>
        </div>
    );
}