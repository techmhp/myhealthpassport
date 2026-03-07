import base64
import mimetypes
import os

def convert_file_to_base64_img_tag(file_bytes: bytes, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise ValueError(f"Unsupported image format: {ext}")
    mime_type = mimetypes.guess_type(filename)[0] or "image/png"
    encoded = base64.b64encode(file_bytes).decode("utf-8")
    return f'<img src="data:{mime_type};base64,{encoded}" />'
