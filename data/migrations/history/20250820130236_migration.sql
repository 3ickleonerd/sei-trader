-- Migration created on 2025-08-20
-- Auto-generated from new.sql
-- migration

CREATE TABLE
    users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_username TEXT NOT NULL,
        telegram_id INTEGER NOT NULL,
        accepted_tnc_at INTEGER NOT NULL,
        tnc_version INTEGER NOT NULL
    );