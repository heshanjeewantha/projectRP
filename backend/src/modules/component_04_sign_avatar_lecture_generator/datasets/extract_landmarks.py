"""Extract MediaPipe Holistic landmarks for each processed WLASL video."""
from __future__ import annotations

import json

from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    extract_landmarks_dataset,
)


def main() -> None:
    result = extract_landmarks_dataset()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
