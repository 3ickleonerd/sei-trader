CREATE TABLE
    IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_username TEXT NOT NULL,
        telegram_id INTEGER NOT NULL UNIQUE,
        accepted_tnc_at INTEGER NOT NULL,
        tnc_version INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime ('%s', 'now'))
    );

CREATE TABLE
    IF NOT EXISTS user_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        escrow_address TEXT NOT NULL,
        instructions TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime ('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE (user_id, agent_name)
    );