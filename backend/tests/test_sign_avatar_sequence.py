from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.modules.component_04_sign_avatar_lecture_generator.services import sign_avatar_service


class SignAvatarSequenceTests(unittest.TestCase):
    def test_local_extract_sign_keywords(self):
        keywords = sign_avatar_service._local_extract_sign_keywords(
            "Computer networks connect devices and store data in a database.",
            "Computer Network",
            "English",
        )

        self.assertIn("computer", keywords)
        self.assertIn("network", keywords)
        self.assertIn("database", keywords)

    def test_build_avatar_animation_sequence_marks_fallback(self):
        sequence = sign_avatar_service._build_avatar_animation_sequence(
            ["computer", "cloud"],
            {"COMPUTER": {"glossWord": "COMPUTER"}},
        )

        self.assertEqual(sequence[0]["keyword"], "computer")
        self.assertFalse(sequence[0]["isFallback"])
        self.assertEqual(sequence[1]["keyword"], "cloud")
        self.assertTrue(sequence[1]["isFallback"])

    def test_build_subtitle_segments_accumulates_timing(self):
        subtitles = sign_avatar_service._build_subtitle_segments(
            [
                {"keyword": "computer", "subtitle": "Computer", "duration": 2},
                {"keyword": "network", "subtitle": "Network", "duration": 1.5},
            ]
        )

        self.assertEqual(subtitles[0]["startMs"], 0)
        self.assertEqual(subtitles[0]["endMs"], 2000)
        self.assertEqual(subtitles[1]["startMs"], 2000)
        self.assertEqual(subtitles[1]["endMs"], 3500)


if __name__ == "__main__":
    unittest.main()
