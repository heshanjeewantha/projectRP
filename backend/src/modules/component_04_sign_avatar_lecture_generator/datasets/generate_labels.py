"""Generate labels.csv for the WLASL landmark training pipeline."""
from __future__ import annotations

import json

from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    generate_labels_csv,
)


def main() -> None:
    result = generate_labels_csv()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
