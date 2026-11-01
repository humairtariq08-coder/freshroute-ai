"""Database connection helpers; SQLite locally and PostgreSQL via DATABASE_URL."""
import os
import re
import sqlite3
from pathlib import Path


def is_postgres(target):
    return isinstance(target, str) and target.startswith(("postgresql://", "postgres://"))


class PostgresConnection:
    def __init__(self, url):
        import psycopg
        from psycopg.rows import dict_row
        self.connection = psycopg.connect(url.replace("postgres://", "postgresql://", 1), row_factory=dict_row)

    def execute(self, sql, params=()):
        if sql == "BEGIN IMMEDIATE":
            sql = "BEGIN"
        sql = re.sub(r"\?", "%s", sql)
        return self.connection.execute(sql, params)

    def __enter__(self):
        self.transaction = self.connection.transaction()
        self.transaction.__enter__()
        return self

    def __exit__(self, *args):
        return self.transaction.__exit__(*args)

    def close(self):
        self.connection.close()


def connect(target):
    if is_postgres(target):
        return PostgresConnection(target)
    timeout_ms = int(os.getenv("SQLITE_BUSY_TIMEOUT_MS", "10000"))
    connection = sqlite3.connect(Path(target), timeout=timeout_ms / 1000)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute(f"PRAGMA busy_timeout = {timeout_ms}")
    return connection


def run_migrations(url):
    from alembic import command
    from alembic.config import Config
    config = Config(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))
    command.upgrade(config, "head")
