
# Contribution Hub - Developer Guide

This project has been refactored into a client-server architecture, simulated within a single-directory environment for ease of use.

## Project Structure
- `/backend/api.ts`: **Simulated Server Environment**. Manages all application state in a global in-memory object (conceptually a cloud database) and provides API-like functions for data access and manipulation. It also implements a simple event bus for real-time updates.
- `/frontend`: **React 19 Application**. Communicates with the simulated backend exclusively through `frontend/apiService.ts` and receives real-time updates via `frontend/services/realtimeService.ts`.
- `types.ts`: Shared schemas for both layers.

## Technical Separation (Conceptual)
In a real production environment:
1.  **Backend:** The logic in `backend/api.ts` would be deployed as a true server-side application (e.g., Node.js with Express/Fastify) backed by a persistent cloud database (e.g., PostgreSQL, MongoDB, Google Firestore). Real-time communication would be handled via WebSockets (e.g., Socket.IO, or native WebSockets).
2.  **Frontend:** `frontend/apiService.ts` would use `fetch()` or `axios` to make HTTP requests to the deployed backend. `frontend/services/realtimeService.ts` would establish a WebSocket connection to the backend for real-time data push.
3.  **Authentication:** A real backend would implement token-based authentication (e.g., JWTs) for session management, with tokens securely stored on the client.

## Key Architectural Changes
- **Centralized Data:** All application data is managed by the simulated backend (`backend/api.ts`), replacing `localStorage` for application state.
- **Real-time Updates:** A simulated event bus in the backend pushes updates to subscribed frontend components (Manager Dashboard, Client Dashboard), ensuring immediate data visibility across sessions.
- **Client-Side Storage Removed:** `localStorage` is no longer used for application data or session persistence. Service Workers for offline caching have been removed to focus on the online, real-time aspects.

## Default Admin Credentials
- **Jersey Number**: `ADMIN-01`
- **Password**: `admin1`

## Development
- Uses Tailwind CSS for high-fidelity UI.
- React 19 for declarative components.
- Modularized dashboard logic for scalability.