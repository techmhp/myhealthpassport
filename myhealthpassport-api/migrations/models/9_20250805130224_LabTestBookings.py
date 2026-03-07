from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "lab_test_bookings" (
    "booking_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "slot_date" DATE NOT NULL,
    "slot_time" TIMETZ NOT NULL,
    "booking_status" VARCHAR(100) NOT NULL DEFAULT 'pending',
    "consult_fee" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "created_user_role" VARCHAR(50) DEFAULT '',
    "created_role_type" VARCHAR(50) DEFAULT '',
    "is_deleted" BOOL NOT NULL DEFAULT False,
    "doctor_id" BIGINT NOT NULL REFERENCES "users_analyst_team" ("id") ON DELETE CASCADE,
    "patient_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE,
    "test_id" BIGINT NOT NULL REFERENCES "lab_tests" ("test_id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "lab_test_bookings";"""
