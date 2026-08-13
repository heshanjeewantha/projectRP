# System Architecture

The project is now organized by research component across three main layers:

1. `frontend/src/modules`
   Holds student/admin UI grouped by component, with shared layout pieces in `frontend/src/components/layout` and shared pages/store in `frontend/src/modules/shared-app`.
2. `backend/src/modules`
   Holds component-specific FastAPI routes, services, models, datasets, and ML helpers. Cross-cutting concerns stay in `backend/src/common`.
3. `ml`
   Holds component-specific ML datasets, scripts, evaluation assets, and trained-model placeholders for research workflows.

Shared concerns:
- Authentication, configuration, database access, and websocket management are under `backend/src/common`
- Shared runtime uploads remain under `backend/uploads`
- Cross-component documentation is under `docs`

Component map:
- Component 01: lesson attention monitoring
- Component 02: knowledge graph popup question system
- Component 03: adaptive chatbot
- Component 04: sign avatar lecture generator
- Component 05: smart wristband IoT
