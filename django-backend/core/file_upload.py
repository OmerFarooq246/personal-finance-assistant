import os
from time import time

from django.conf import settings


def save_upload_file(upload_file, upload_folder: str) -> str:
    try:
        unique_name = f"img_{int(time())}_{upload_file.name}"
        relative_path = os.path.join(upload_folder, unique_name)
        absolute_path = settings.MEDIA_ROOT / relative_path
        os.makedirs(absolute_path.parent, exist_ok=True)

        with open(absolute_path, "wb") as destination:
            for chunk in upload_file.chunks():
                destination.write(chunk)

        return str(relative_path)
    except Exception as e:
        print(f"error in save_upload_file: {e}")
        return "img was not saved successfully"
