import os
from abc import ABC, abstractmethod

import boto3
from botocore.exceptions import BotoCoreError, ClientError


# 1. Abstract Base Class (The Interface)
class BaseStorage(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, destination_path: str) -> str:
        """Saves file bytes and returns the stored file path or URL."""


# 2. Local Disk Storage Implementation
class LocalStorage(BaseStorage):
    def __init__(self, base_dir: str = "/app/storage_data"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save(self, file_bytes: bytes, destination_path: str) -> str:
        # destination_path might be 'artworks/ep_1_poster.jpg'
        full_path = os.path.join(self.base_dir, destination_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, "wb") as f:
            f.write(file_bytes)
        
        return full_path


# 3. Cloudflare R2 / S3 Storage Implementation (For Production)
class R2CloudflareStorage(BaseStorage):
    def __init__(self):
        self.bucket_name = os.getenv("R2_BUCKET_NAME", "peblo-media")
        self.client = boto3.client(
            "s3",
            endpoint_url=os.getenv("R2_ENDPOINT_URL"), # e.g., https://<account_id>.r2.cloudflarestorage.com
            aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
            region_name="auto"
        )

    def save(self, file_bytes: bytes, destination_path: str) -> str:
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=destination_path,
                Body=file_bytes
            )
            return f"r2://{self.bucket_name}/{destination_path}"
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError(f"Cloudflare R2 upload failed: {e!s}")


# 4. Storage Factory (The single switch to swap implementations!)
def get_storage_backend() -> BaseStorage:
    engine_type = os.getenv("STORAGE_ENGINE", "local").lower()
    
    if engine_type == "r2":
        return R2CloudflareStorage()
    else:
        return LocalStorage()