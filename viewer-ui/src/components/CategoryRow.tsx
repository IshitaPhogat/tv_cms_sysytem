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

export default function CategoryRow({
    title,
    shows,
    onSelect,
    compact = false
}: {
    title: string;
    shows: Show[];
    onSelect: (show: Show) => void;
    compact?: boolean;
}) {
    if (shows.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                padding: compact ? '0' : '20px 40px'
            }}
        >
            {!compact && (
                <h3
                    style={{
                        color: '#fff',
                        marginBottom: '15px'
                    }}
                >
                    {title}
                </h3>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: '15px',
                    overflowX: compact ? 'visible' : 'auto',
                    paddingBottom: compact ? '0' : '10px'
                }}
            >
                {shows.map((show, index) => {
                    const poster =
                        getArtworkByType(show, 'poster') ||
                        getArtworkByType(show, 'thumbnail') ||
                        getArtworkByType(show, 'banner');

                    return (
                        <div
                            key={`${show.show_title}-${show.section}-${index}`}
                            onClick={() => onSelect(show)}
                            style={{
                                minWidth: compact ? '0' : '200px',
                                width: compact ? '100%' : '200px',
                                cursor: 'pointer',
                                transition: 'transform 0.3s'
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: compact ? '300px' : '300px',
                                    background: '#222',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}
                            >
                                {poster ? (
                                    <img
                                        src={resolveArtworkUrl(poster)}
                                        alt={show.show_title}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#777',
                                            padding: '20px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        No artwork available
                                    </div>
                                )}
                            </div>

                            <p
                                style={{
                                    color: '#fff',
                                    fontSize: '14px',
                                    marginTop: '8px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {show.show_title}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}