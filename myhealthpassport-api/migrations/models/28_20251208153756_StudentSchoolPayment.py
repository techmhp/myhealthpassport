from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "student_school_payments" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "payment_date" VARCHAR(10),
    "is_paid" BOOL NOT NULL DEFAULT False,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "created_user_role" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" BIGINT,
    "updated_user_role" VARCHAR(50),
    "is_deleted" BOOL NOT NULL DEFAULT False,
    "school_id" BIGINT NOT NULL REFERENCES "health_passport_schools" ("school_id") ON DELETE CASCADE,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_student_sch_student_f9089f" UNIQUE ("student_id", "payment_date")
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "student_school_payments";"""
