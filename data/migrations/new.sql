CREATE TABLE
    users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    tnc_acceptance_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        telegram_username TEXT,
        tnc_version TEXT NOT NULL,
        tnc_hash TEXT NOT NULL,
        accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        method TEXT NOT NULL DEFAULT 'web_page',
        ip_address TEXT,
        device TEXT,
        slug TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );