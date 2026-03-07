from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "school_healthians_packages" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "package_id" BIGINT NOT NULL REFERENCES "healthians_packages" ("package_id") ON DELETE CASCADE,
    "school_id" BIGINT NOT NULL REFERENCES "health_passport_schools" ("school_id") ON DELETE CASCADE,
    CONSTRAINT "uid_school_heal_school__492444" UNIQUE ("school_id", "package_id")
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "school_healthians_packages";"""
