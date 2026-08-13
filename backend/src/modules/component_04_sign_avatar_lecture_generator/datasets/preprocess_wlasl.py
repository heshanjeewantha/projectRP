"""Convert downloaded WLASL videos to cleaned MP4 clips."""
from __future__ import annotations

import argparse
import json

from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    preprocess_wlasl_videos,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess WLASL videos.")
    parser.add_argument("--width", type=int, default=224)
    parser.add_argument("--height", type=int, default=224)
    args = parser.parse_args()

    result = preprocess_wlasl_videos(frame_size=(args.width, args.height))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
