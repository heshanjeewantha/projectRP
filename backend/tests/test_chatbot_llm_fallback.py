from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.common.config.settings import settings
from src.modules.component_03_adaptive_chatbot.models.chatbot import EARADiagramRequest
from src.modules.component_03_adaptive_chatbot.routes import chatbot_routes
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

    async def _build_binary_bundle(self, mode, learning_state):
        self._set_llm_settings()
        return await chatbot_service._generate_answer_bundle(
            question="What is the binary of 244?",
            mode=mode,
            intent="learning",
            learning_state=learning_state,
            topic_doc=TOPIC_DOC,
            prerequisites=TOPIC_DOC["prerequisiteLabels"],
            difficulty_level=1,
            refresh_points=[],
            prompt="Prompt",
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

        self.assertTrue(answer.startswith("A database is an organized collection"))
        self.assertIn("Remember: Data and Information, Spreadsheets.", answer)
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

    def test_decimal_to_binary_learning_answers_are_correct_in_every_state(self):
        for learning_state in ("understanding", "bored", "not_understanding", "distracted"):
            with self.subTest(learning_state=learning_state):
                answer = chatbot_service.generateLocalFallbackAnswer(
                    question="What is the binary of 244?",
                    mode="learning",
                    learning_state=learning_state,
                    topic_doc=TOPIC_DOC,
                    prerequisites=TOPIC_DOC["prerequisiteLabels"],
                    difficulty_level=1,
                    refresh_points=[],
                )

                self.assertIn("244 in binary is 11110100.", answer)
                self.assertNotIn("raw facts and figures", answer)

    def test_decimal_to_binary_question_with_number_word_returns_calculated_result(self):
        for question in (
            "What is the binary number of 244?",
            "What is the binary number of decimal 244?",
            "What is the binary equivalent of the decimal number 244?",
        ):
            with self.subTest(question=question):
                answer = chatbot_service.generateLocalFallbackAnswer(
                    question=question,
                    mode="learning",
                    learning_state="understanding",
                    topic_doc=TOPIC_DOC,
                    prerequisites=TOPIC_DOC["prerequisiteLabels"],
                    difficulty_level=1,
                    refresh_points=[],
                )

                self.assertTrue(answer.startswith("244 in binary is 11110100."))
                self.assertNotIn("raw facts and figures", answer)

    async def test_decimal_to_binary_computation_precedes_llm_for_all_modes_and_states(self):
        for mode in ("learning", "exam"):
            for learning_state in ("understanding", "bored", "not_understanding", "distracted"):
                with self.subTest(mode=mode, learning_state=learning_state):
                    with patch.object(chatbot_service, "callLLMApi") as llm:
                        bundle = await self._build_binary_bundle(mode, learning_state)

                    llm.assert_not_awaited()
                    self.assertEqual(bundle["sourceType"], "COMPUTED")
                    self.assertIn("244 in binary is 11110100.", bundle["answer"])
                    self.assertNotIn("raw facts and figures", bundle["answer"])

    def test_decimal_to_binary_conversion_parses_variants_and_bit_width(self):
        cases = [
            ("What is the binary of 244?", "244 in binary is 11110100."),
            ("Convert 244 to binary", "244 in binary is 11110100."),
            ("Convert decimal number 244 into 8-bit binary", "244 in binary is 11110100."),
        ]

        for question, expected in cases:
            with self.subTest(question=question):
                answer = chatbot_service._build_decimal_to_binary_answer(
                    question,
                    "learning",
                    "understanding",
                )
                self.assertIsNotNone(answer)
                self.assertTrue(answer.startswith(expected))

    def test_unrelated_question_does_not_select_first_question_bank_entry(self):
        topic = {
            "questionBank": [
                {
                    "question": "What is data and information?",
                    "answer": "Data are raw facts and figures.",
                }
            ]
        }

        self.assertIsNone(
            chatbot_service._find_best_question_bank_match(
                "What is the binary of 244?",
                topic,
            )
        )

    def test_direct_answer_precedes_prerequisite_context(self):
        answer = chatbot_service.formatLearningAnswer(
            answer="A database stores related data electronically.",
            learning_state="not_understanding",
            prerequisites=["Data and Information"],
            is_llm=True,
        )

        self.assertTrue(answer.startswith("A database stores related data electronically."))
        self.assertLess(answer.index("A database"), answer.index("Remember:"))

    def test_bored_fallback_challenge_uses_the_answer_topic(self):
        answer = chatbot_service.formatLearningAnswer(
            answer="A spreadsheet organizes data into rows and columns.",
            learning_state="bored",
            topic_name="Spreadsheets",
        )

        self.assertTrue(answer.startswith("A spreadsheet organizes data"))
        self.assertIn("real-world example of Spreadsheets", answer)
        self.assertNotIn("smartphone or favourite app", answer)

    def test_eara_diagram_matches_question_and_uses_answer_for_unknown_topics(self):
        self.assertEqual(
            chatbot_service._match_eara_topic_key(
                "general_ict",
                "How does a NAND gate work?",
            ),
            "logic_gates",
        )

        diagram = chatbot_service._build_question_specific_eara_diagram(
            "Explain cloud computing.",
            "Cloud computing provides services over the internet.\n\n"
            "Users can access storage and applications remotely.",
        )

        self.assertEqual(diagram["schematicType"], "answer_breakdown")
        self.assertIn("cloud computing", diagram["nodes"][0]["description"].lower())
        self.assertIn("services over the internet", diagram["nodes"][1]["description"])
        self.assertEqual(diagram["edges"][0]["from"], "question")
        self.assertEqual(diagram["edges"][0]["to"], "answer")

    async def test_eara_unknown_topic_returns_answer_specific_diagram(self):
        diagram = await chatbot_service.get_eara_diagram(
            topic_id="general_ict",
            learning_state="not_understanding",
            question="Why is edge computing useful?",
            answer="Edge computing processes data near the device that created it.",
        )

        self.assertEqual(diagram["topicId"], "question_specific")
        self.assertEqual(diagram["schematicType"], "answer_breakdown")
        self.assertIn("edge computing", diagram["diagram"]["nodes"][0]["description"].lower())
        self.assertIn("near the device", diagram["diagram"]["nodes"][1]["description"])
        self.assertIn("Follow the question", diagram["stateTip"])

    async def test_eara_post_route_passes_long_answer_in_request_body(self):
        answer = "A detailed chatbot answer. " * 100
        expected = {"topicId": "data_information", "answer": answer}
        with patch.object(
            chatbot_routes.chatbot_service,
            "get_eara_diagram",
            new=AsyncMock(return_value=expected),
        ) as get_diagram:
            response = await chatbot_routes.post_eara_diagram(
                EARADiagramRequest(
                    topicId="data_information",
                    learningState="not_understanding",
                    question="Explain data and information.",
                    answer=answer,
                )
            )

        self.assertEqual(response, expected)
        get_diagram.assert_awaited_once_with(
            topic_id="data_information",
            learning_state="not_understanding",
            question="Explain data and information.",
            answer=answer,
        )

    def test_ollama_prompt_includes_learning_state_guidance(self):
        _, _, body = chatbot_service._build_llm_request(
            provider="ollama",
            api_key="",
            model="test-model",
            prompt="Student is bored.",
            question="What does a CPU do?",
            mode="learning",
            intent="learning",
            learning_state="bored",
            topic_doc={"topicName": "Computer System"},
            prerequisites=[],
            refresh_points=[],
        )

        self.assertIn("Selected mode: learning. Learning state: bored.", body["prompt"])
        self.assertIn("specific real-world use", body["prompt"])
        self.assertIn("Start with a direct answer", body["prompt"])

    def test_technical_questions_are_allowed_but_celebrity_questions_are_blocked(self):
        question = "What is the difference between User Mode and Kernel Mode?"

        self.assertIsNone(chatbot_service._check_off_topic_question(question))
        self.assertIsNotNone(chatbot_service._check_off_topic_question("Who is Priyanka Chopra?"))
        self.assertEqual(
            chatbot_service._match_eara_topic_key("general_ict", question),
            "operating_systems",
        )

    def test_explicit_chat_mode_is_not_overridden_by_detected_intent(self):
        self.assertEqual(chatbot_service._resolve_mode("learning", "exam"), "learning")
        self.assertEqual(chatbot_service._resolve_mode("exam", "learning"), "exam")
        self.assertEqual(chatbot_service._resolve_mode(None, "exam"), "exam")

    def test_prompt_guidance_covers_all_mode_and_learning_state_combinations(self):
        modes = ("learning", "exam")
        states = ("understanding", "bored", "not_understanding", "distracted")
        prompts = {
            chatbot_service._build_llm_user_prompt(
                prompt="",
                question="What is the difference between User Mode and Kernel Mode?",
                mode=mode,
                intent="learning",
                learning_state=state,
                topic_doc={"topicName": "Logic Gates", "summary": "Boolean operations"},
                prerequisites=[],
                refresh_points=[],
            )
            for mode in modes
            for state in states
        }

        self.assertEqual(len(prompts), len(modes) * len(states))
        self.assertTrue(all("even when they are beyond the O/L syllabus" in prompt for prompt in prompts))
        self.assertTrue(all("Do not reject them or redirect to an unrelated selected topic" in prompt for prompt in prompts))
        self.assertTrue(all("outside O/L ICT, politely explain" not in prompt for prompt in prompts))

    async def test_technical_question_overrides_unrelated_selected_topic(self):
        topics = [
            {
                "topicId": "logic_gates",
                "topicName": "Logic Gates",
                "keywords": ["logic gate", "boolean"],
            },
            {
                "topicId": "operating_systems",
                "topicName": "Operating Systems",
                "keywords": ["operating system", "kernel mode", "user mode"],
            },
        ]

        class TopicCursor:
            def sort(self, *_args):
                return self

            def __aiter__(self):
                async def iterate():
                    for topic in topics:
                        yield topic

                return iterate()

        class TopicCollection:
            def find(self):
                return TopicCursor()

        class TopicDatabase:
            def __getitem__(self, _collection_name):
                return TopicCollection()

        with patch.object(chatbot_service, "get_db", return_value=TopicDatabase()):
            topic = await chatbot_service._resolve_topic_context(
                "logic_gates",
                "What is the difference between User Mode and Kernel Mode?",
            )

        self.assertEqual(topic["topicId"], "operating_systems")

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
