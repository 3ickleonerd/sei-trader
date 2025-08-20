-- Migration created on 2025-08-20
-- Auto-generated from new.sql
-- migration

CREATE TABLE
    user_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        escrow_address TEXT NOT NULL,
        instructions TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );