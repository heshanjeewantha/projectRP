from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.common.config.settings import settings
from src.modules.component_03_adaptive_chatbot.services import chatbot_service


TOPIC_DOC = {
    "topicId": "databases",
    "topicName": "Databases",
    "summary": "a database is an organized collection of related data stored electronically for easy access, management, and updating",
    "keyPoints": [
        "A table stores records about one subject",
        "Fields describe attributes of each record",
        "Databases allow efficient searching and updating",
    ],
    "keywords": ["database", "table", "record", "field", "query"],
    "prerequisites": ["data_information", "spreadsheets"],
    "prerequisiteLabels": ["Data and Information", "Spreadsheets"],
    "simpleDefinitions": [
        "A database is an organized collection of data stored electronically so it can be accessed, managed, and updated easily"
    ],
    "examples": ["A school can store student records and search them quickly"],
    "examQuestions": ["Define database for 2 marks."],
    "referenceSentences": [
        "A database stores organized data so it can be searched and updated efficiently."
    ],
}


class ChatbotLlmFallbackTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.original_provider = settings.LLM_PROVIDER
        self.original_key = settings.LLM_API_KEY
        self.original_model = settings.LLM_MODEL
        self.original_timeout = settings.LLM_TIMEOUT_MS

    def tearDown(self):
        settings.LLM_PROVIDER = self.original_provider
        settings.LLM_API_KEY = self.original_key
        settings.LLM_MODEL = self.original_model
        settings.LLM_TIMEOUT_MS = self.original_timeout

    def _set_llm_settings(self, provider="openai", api_key="test-key", model="gpt-4.1-mini", timeout_ms=10000):
        settings.LLM_PROVIDER = provider
        settings.LLM_API_KEY = api_key
        settings.LLM_MODEL = model
        settings.LLM_TIMEOUT_MS = timeout_ms

    async def _build_bundle(self):
        prompt = chatbot_service.generateEARAPrompt(
            question="Define database 2 marks",
            intent="exam",
            learningState="understanding",
            topic=TOPIC_DOC["topicName"],
            prerequisites=TOPIC_DOC["prerequisiteLabels"],
        )
        return await chatbot_service._generate_answer_bundle(
            question="Define database 2 marks",
            mode="exam",
            intent="exam",
            learning_state="understanding",
            topic_doc=TOPIC_DOC,
            prerequisites=TOPIC_DOC["prerequisiteLabels"],
            difficulty_level=1,
            refresh_points=[],
            prompt=prompt,
            repeated_query_count=1,
        )

    async def test_llm_api_working(self):
        self._set_llm_settings()
        with patch.object(
            chatbot_service,
            "_post_json_request",
            return_value={"output_text": "A database is an organized collection of data."},
        ):
            response = await chatbot_service.callLLMApi(
                question="Define database 2 marks",
                mode="exam",
                intent="exam",
                learningState="understanding",
                topic_doc=TOPIC_DOC,
                prerequisites=TOPIC_DOC["prerequisiteLabels"],
                refresh_points=[],
                prompt="Prompt",
            )

        self.assertEqual(response["provider"], "openai")
        self.assertIn("organized collection of data", response["answer"])

    async def test_api_key_missing_fallback_works(self):
        self._set_llm_settings(api_key="")
        bundle = await self._build_bundle()

        self.assertEqual(bundle["sourceType"], "LOCAL_DATASET")
        self.assertEqual(bundle["fallbackReason"], "api_key_missing")
        self.assertIn("database", bundle["answer"].lower())

    async def test_api_timeout_fallback_works(self):
        self._set_llm_settings()
        with patch.object(
            chatbot_service,
            "_post_json_request",
            side_effect=chatbot_service.LLMApiError("api_timeout"),
        ) as mocked_request:
            bundle = await self._build_bundle()

        self.assertEqual(bundle["sourceType"], "LOCAL_DATASET")
        self.assertEqual(bundle["fallbackReason"], "api_timeout")
        self.assertEqual(mocked_request.call_count, 2)

    def test_exam_question_returns_compressed_answer(self):
        answer = chatbot_service.generateLocalFallbackAnswer(
            question="Define database 2 marks",
            mode="exam",
            learning_state="understanding",
            topic_doc=TOPIC_DOC,
            prerequisites=TOPIC_DOC["prerequisiteLabels"],
            difficulty_level=1,
            refresh_points=[],
        )

        self.assertIn("Key terms:", answer)
        self.assertNotIn("Difficulty level:", answer)

    def test_learning_question_returns_detailed_answer(self):
        answer = chatbot_service.generateLocalFallbackAnswer(
            question="Explain database with an example",
            mode="learning",
            learning_state="understanding",
            topic_doc=TOPIC_DOC,
            prerequisites=TOPIC_DOC["prerequisiteLabels"],
            difficulty_level=2,
            refresh_points=["Tables store rows of related records"],
        )

        self.assertIn("Before this, remember", answer)
        self.assertIn("Example:", answer)
        self.assertIn("Difficulty level:", answer)

    def test_distracted_state_returns_short_answer(self):
        answer = chatbot_service.generateLocalFallbackAnswer(
            question="What is a database?",
            mode="learning",
            learning_state="distracted",
            topic_doc=TOPIC_DOC,
            prerequisites=TOPIC_DOC["prerequisiteLabels"],
            difficulty_level=1,
            refresh_points=[],
        )

        self.assertIn("Quick focus answer.", answer)
        self.assertIn("Key points:", answer)

    def test_unknown_topic_suggests_related_topics(self):
        answer = chatbot_service.generateLocalFallbackAnswer(
            question="Explain quantum networking",
            mode="learning",
            learning_state="understanding",
            topic_doc=None,
            prerequisites=[],
            difficulty_level=1,
            refresh_points=[],
        )

        self.assertIn("Try a related topic", answer)


if __name__ == "__main__":
    unittest.main()
