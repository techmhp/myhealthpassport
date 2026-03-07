from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "school_thyrocare_products" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "custom_name" VARCHAR(300),
    "custom_price" DECIMAL(10,2),
    "is_active" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "product_id" BIGINT NOT NULL REFERENCES "thyrocare_products" ("product_id") ON DELETE CASCADE,
    "school_id" BIGINT NOT NULL REFERENCES "health_passport_schools" ("school_id") ON DELETE CASCADE,
    CONSTRAINT "uid_school_thyr_school__9118ae" UNIQUE ("school_id", "product_id")
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "school_thyrocare_products";"""
