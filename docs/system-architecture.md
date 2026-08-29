# SignLearn AI — System Architecture & Inter-Component Integration

## Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [React 19 + Vite 6 + TailwindCSS v4 SPA]
        Nav[Navbar Navigation] --> LessonPage[Component 01: Lesson & Attention HUD]
        Nav --> ChatbotPage[Component 03: Adaptive Chatbot & Growth Matrix]
        Nav --> SignAvatarPage[Component 04: Sign Avatar Generator]
        Nav --> SignCoursePage[Component 05: Sign Practice Arena]
        Nav --> WristbandPage[Component 05: Wristband IoT Config]
        Nav --> AdminReportsPage[Component 01: Admin Attention & Behavioral Reports]
        GlobalFloat[Global Floating Chatbot & Virtual Wristband]
    end

    subgraph Backend [FastAPI Asynchronous Microservice Layer]
        C1[Component 01: Attention WebSocket & Biometric Engine]
        C2[Component 02: Knowledge Graph & GQSA Question Engine]
        C3[Component 03: Adaptive Chatbot, Short Notes & Evaluator Engine]
        C4[Component 04: Sign Avatar & WLASL Pipeline]
        C5[Component 05: ESP32 BLE Wristband & Sign Course Service]
    end

    subgraph Database [MongoDB Layer]
        DB_C1[(attention_logs, attention_batches)]
        DB_C2[(knowledge_graph, popup_questions, lesson_timelines, student_popup_answers)]
        DB_C3[(chatbotMessages, microChallengeAttempts, ictSyllabusTopics, pastPaperQuestions, flashcardDecks)]
        DB_C4[(savedSignLectures, gestureLibrary)]
        DB_C5[(wristbandConfigs, wristbandEventHistory, signCourseProgress)]
    end

    subgraph Hardware [IoT Hardware Layer]
        ESP32[ESP32 Wearable + SSD1306 OLED + ERM Haptic Motor]
    end

    LessonPage <-->|WebSocket & Video API| C1
    AdminReportsPage <-->|Admin Reports API| C1
    LessonPage <-->|Popup Questions API| C2
    ChatbotPage <-->|Chat, Short Notes, Exam & Growth API| C3
    SignAvatarPage <-->|Avatar Sequence API| C4
    SignCoursePage <-->|Sign Course Progress API| C5
    WristbandPage <-->|BLE & Notification API| C5

    C1 --> DB_C1
    C2 --> DB_C2
    C3 --> DB_C3
    C4 --> DB_C4
    C5 --> DB_C5

    DB_C1 -.->|Attention Drops Feed Remediation| C3
    C1 -.->|Distraction Alerts Trigger Haptic Buzz| C5
    C5 <-->|BLE 4.2 / WiFi Telemetry| ESP32
```

---

## Inter-Component Data Flows

1. **Component 1 -> Component 3 (Attention-Aware Remediation)**:
   * Real-time webcam telemetry logs distraction/drowsiness segments into `attention_logs`.
   * Component 3 queries these logs via `GET /api/chatbot/attention-recommendations/{student_id}` to generate targeted syllabus review prompts.

2. **Component 1 -> Component 5 (Haptic Distraction Alert)**:
   * When severe drowsiness (`PERCLOS > 0.35`) or head deviation occurs, an alert triggers the ESP32 wristband motor to vibrate with a `Long Pulse (1000ms)`.

3. **Component 1 -> Admin Evaluation (Student Attention Reports)**:
   * Telemetry logs aggregate into official PDF student evaluation reports via `GET /api/attention/admin/reports/{user_id}`.

4. **Component 1 -> Component 2 (Lesson Timeline Synchronization)**:
   * Video playback time `t` continuously queries `GET /api/knowledge-graph/lesson/{lesson_id}/question?time=t`.
   * Component 2 traverses the Knowledge Graph neighborhood to present adaptive multiple-choice checkpoints.

5. **Component 4 -> Component 5 (Sign Course Practice Integration)**:
   * Component 4 provides upper-body sign avatar demonstrations inside Component 5's Sign Practice Arena.
   * Student attempts are evaluated by webcam hand landmark classification and reinforced via wristband haptics.
