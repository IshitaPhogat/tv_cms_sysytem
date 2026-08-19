export interface Episode {
    episode_id: string;
    episode_title: string;
    show_title?: string;
    section?: string;
    language: string;
    content_group: string;
    duration_seconds: number;
    status: string;
    artworks?: { file_path: string; artwork_type: string }[];
}

export interface PublishRun {
    id: number;
    triggered_by: string;
    timestamp: string;
    successful_count: number;
    failed_count: number;
    outcome: string;
}