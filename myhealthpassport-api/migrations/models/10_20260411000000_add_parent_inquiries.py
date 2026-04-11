from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "parent_inquiries" (
    "inquiry_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "inquiry_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "child_name" VARCHAR(255) NOT NULL,
    "parent_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "concern_area" VARCHAR(255),
    "child_dob" DATE,
    "gender" VARCHAR(20),
    "preferred_date" DATE,
    "preferred_time" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "parent_inquiries" IS 'Public form submissions from the marketing website (Talk to Our Team / Book Screening)';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "parent_inquiries";"""
