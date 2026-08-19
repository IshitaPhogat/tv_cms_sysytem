import React, { useEffect, useState } from "react";
import { uploadArtwork } from "../services/api";

const SPECS = {
    poster: {
        label: "Poster",
        dims: "~600 × 900 px",
        ratio: "2:3",
        maxKb: 200,
    },
    banner: {
        label: "Banner",
        dims: "~1280 × 720 px",
        ratio: "16:9",
        maxKb: 200,
    },
    thumbnail: {
        label: "Thumbnail",
        dims: "~640 × 360 px",
        ratio: "16:9",
        maxKb: 200,
    },
};

type ArtworkType = keyof typeof SPECS;

type Message = {
    text: string;
    isError: boolean;
};

export default function ArtworkUploader({
    episodeId,
}: {
    episodeId: string;
}) {
    const [artworkType, setArtworkType] =
        useState<ArtworkType>("poster");

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [message, setMessage] = useState<Message | null>(null);
    const [uploading, setUploading] = useState(false);

    const spec = SPECS[artworkType];

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleTypeChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setArtworkType(event.target.value as ArtworkType);

        // Clear the previously selected file because
        // the validation requirements change with the artwork type.
        setFile(null);
        setPreview(null);
        setMessage(null);
    };

    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        setFile(selectedFile);

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        setMessage({
            text: "Image selected. Click Upload & Validate to check it.",
            isError: false,
        });
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage({
                text: "Please choose an image first.",
                isError: true,
            });
            return;
        }

        setUploading(true);

        setMessage({
            text: "Uploading and validating...",
            isError: false,
        });

        try {
            const response = await uploadArtwork(
                episodeId,
                artworkType,
                file
            );

            setMessage({
                text:
                    response.message ||
                    `${spec.label} uploaded and validated successfully.`,
                isError: false,
            });

        } catch (err: any) {
            const errorMessage =
                err.response?.data?.detail ||
                "Upload failed due to a validation error.";

            setMessage({
                text: errorMessage,
                isError: true,
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            style={{
                padding: "10px 0",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "25px",
                }}
            >
                {/* LEFT: Upload controls */}
                <div>
                    <label
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "8px",
                        }}
                    >
                        Artwork Type
                    </label>

                    <select
                        value={artworkType}
                        onChange={handleTypeChange}
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            marginBottom: "18px",
                        }}
                    >
                        <option value="poster">Poster</option>
                        <option value="banner">Banner</option>
                        <option value="thumbnail">Thumbnail</option>
                    </select>

                    <label
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "8px",
                        }}
                    >
                        Choose Image
                    </label>

                    <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleFileSelect}
                    />

                    <div
                        style={{
                            marginTop: "18px",
                            padding: "14px",
                            background: "#f8f9fa",
                            borderRadius: "6px",
                            fontSize: "13px",
                        }}
                    >
                        <strong>{spec.label} requirements</strong>

                        <ul
                            style={{
                                marginTop: "8px",
                                marginBottom: 0,
                                paddingLeft: "20px",
                            }}
                        >
                            <li>
                                Recommended dimensions: {spec.dims}
                            </li>
                            <li>
                                Aspect ratio: {spec.ratio}
                            </li>
                            <li>
                                Maximum file size: {spec.maxKb} KB
                            </li>
                        </ul>
                    </div>

                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        style={{
                            marginTop: "18px",
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "6px",
                            background:
                                !file || uploading
                                    ? "#aaa"
                                    : "#007bff",
                            color: "#fff",
                            cursor:
                                !file || uploading
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {uploading
                            ? "Uploading & Validating..."
                            : "Upload & Validate"}
                    </button>

                    {message && (
                        <div
                            style={{
                                marginTop: "12px",
                                padding: "10px",
                                borderRadius: "6px",
                                background: message.isError
                                    ? "#f8d7da"
                                    : "#d4edda",
                                color: message.isError
                                    ? "#721c24"
                                    : "#155724",
                                fontSize: "13px",
                            }}
                        >
                            {message.text}
                        </div>
                    )}
                </div>

                {/* RIGHT: Preview */}
                <div>
                    <h4 style={{ marginTop: 0 }}>
                        Preview
                    </h4>

                    {preview ? (
                        <img
                            src={preview}
                            alt={`${spec.label} preview`}
                            style={{
                                width: "100%",
                                maxHeight: "400px",
                                objectFit: "contain",
                                background: "#f1f1f1",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                height: "300px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f8f9fa",
                                border: "1px dashed #bbb",
                                borderRadius: "8px",
                                color: "#777",
                            }}
                        >
                            No image selected
                        </div>
                    )}

                    {file && (
                        <p
                            style={{
                                marginTop: "10px",
                                fontSize: "13px",
                                color: "#555",
                            }}
                        >
                            <strong>Selected:</strong>{" "}
                            {file.name}
                        </p>
                    )}
                </div>
            </div>

            <div
                style={{
                    marginTop: "25px",
                    padding: "14px",
                    background: "#eef6ff",
                    borderRadius: "6px",
                    fontSize: "13px",
                }}
            >
                <strong>Publishing rule</strong>

                <p
                    style={{
                        marginBottom: 0,
                    }}
                >
                    An episode needs a duration and at least
                    one valid artwork to be eligible for
                    publishing. Poster, banner, and thumbnail
                    are optional individually.
                </p>
            </div>
        </div>
    );
}
