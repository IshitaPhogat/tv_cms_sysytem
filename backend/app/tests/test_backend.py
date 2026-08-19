from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "Peblo TV Mini Backend" in response.json()["message"]

def test_admin_role_restriction():
    # Test that an editor trying to publish gets blocked with the non-technical message
    response = client.post("/admin/catalog/publish", headers={"X-User-Role": "editor"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Access blocked. You are not an Admin."

def test_artwork_size_rejection():
    # Test that uploading an oversized dummy file triggers a 400 error
    fake_image_bytes = b"0" * (250 * 1024) # 250 KB file (exceeds 200 KB limit)
    response = client.post(
        "/admin/upload-artwork",
        data={"episode_id": 1, "artwork_type": "poster"},
        files={"file": ("test.jpg", fake_image_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"]