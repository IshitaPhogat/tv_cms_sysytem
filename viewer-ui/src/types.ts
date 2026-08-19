export interface Episode {
    episode_id: string;
    episode_title: string;
    synopsis?: string;
    season_number: number;
    episode_number: number;
    duration_seconds?: number;
    content_group: string;
    languages: string[];
    artwork: string[];
}

export interface Show {
    show_title: string;
    categories: string[];
    section: string;
    episodes: Episode[];
}

export interface Catalog {
    generated_at: string;
    sections: Record<string, Show[]>;
}

export interface User {
    id?: number;
    name: string;
    email: string;
}