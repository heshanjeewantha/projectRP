"""Clone the WLASL repository if needed and download videos from WLASL_v0.3.json."""
from __future__ import annotations

import argparse
import json

from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    clone_wlasl_repo,
    download_wlasl_videos,
    ensure_wlasl_repo,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download WLASL dataset videos.")
    parser.add_argument("--limit", type=int, default=None, help="Optional limit for quick tests.")
    parser.add_argument("--force-clone", action="store_true", help="Re-clone the WLASL repository.")
    parser.add_argument("--no-skip-existing", action="store_true", help="Download even if files already exist.")
    args = parser.parse_args()

    repo_status = ensure_wlasl_repo()
    if repo_status["status"] != "ready" or args.force_clone:
        clone_wlasl_repo(force=args.force_clone)

    result = download_wlasl_videos(limit=args.limit, skip_existing=not args.no_skip_existing)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
