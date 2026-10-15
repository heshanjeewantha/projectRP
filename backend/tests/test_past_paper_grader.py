import asyncio
import unittest

from src.modules.component_03_adaptive_chatbot.services import chatbot_service


class PastPaperGraderTests(unittest.TestCase):
    def evaluate(self, question_id: str, answer: str) -> dict:
        return asyncio.run(
            chatbot_service.evaluate_past_paper_answer("test-student", question_id, answer)
        )

    def test_sample_model_answers_receive_all_weighted_marks(self):
        for question in chatbot_service.PAST_PAPER_QUESTION_BANK:
            with self.subTest(question_id=question["id"]):
                result = self.evaluate(question["id"], question["sampleModelAnswer"])
                self.assertEqual(result["awardedMarks"], question["maxMarks"])
                self.assertEqual(result["missingKeyPoints"], [])
                self.assertEqual(result["gradeBadge"], "Full Marks (Distinction)")

    def test_binary_answer_does_not_match_nand_criterion(self):
        result = self.evaluate("pp_data_1", "25 in 8-bit binary is 00011001.")

        self.assertEqual(result["awardedMarks"], 2)
        self.assertEqual(len(result["matchedKeyPoints"]), 1)
        self.assertEqual(len(result["missingKeyPoints"]), 1)
        self.assertNotEqual(result["gradeBadge"], "Full Marks (Distinction)")

    def test_os_functions_alone_do_not_match_device_driver_criterion(self):
        result = self.evaluate(
            "pp_os_1",
            "Process management, memory management, and file system management.",
        )

        self.assertEqual(result["awardedMarks"], 3)
        self.assertEqual(len(result["matchedKeyPoints"]), 1)
        self.assertEqual(len(result["missingKeyPoints"]), 1)

    def test_partial_database_definition_does_not_claim_integrity_criteria(self):
        result = self.evaluate(
            "pp_db_1",
            "A primary key uniquely identifies a record. A foreign key references another table.",
        )

        self.assertLess(result["awardedMarks"], result["maxMarks"])
        self.assertEqual(len(result["missingKeyPoints"]), 4 - len(result["matchedKeyPoints"]))
        self.assertNotEqual(result["gradeBadge"], "Full Marks (Distinction)")

    def test_partial_control_unit_answer_does_not_earn_full_criterion_mark(self):
        result = self.evaluate(
            "pp_cs_1",
            "The Control Unit manages instruction fetch and decode.",
        )

        self.assertLess(result["awardedMarks"], result["maxMarks"])
        self.assertEqual(len(result["missingKeyPoints"]), 4)

    def test_half_mark_rubric_weights_are_preserved(self):
        result = self.evaluate(
            "pp_sheet_1",
            "Relative cell references adjust automatically based on position when copied.",
        )

        self.assertEqual(result["awardedMarks"], 1.5)
        self.assertEqual(len(result["matchedKeyPoints"]), 1)
        self.assertEqual(len(result["missingKeyPoints"]), 2)


if __name__ == "__main__":
    unittest.main()
