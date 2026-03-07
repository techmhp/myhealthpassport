from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "medical_screening_status" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "medical_officer_status_type" VARCHAR(50) NOT NULL DEFAULT '',
    "status" VARCHAR(50) NOT NULL DEFAULT '',
    "remarks" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "created_user_role" VARCHAR(50) DEFAULT '',
    "created_role_type" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" BIGINT,
    "updated_user_role" VARCHAR(50) DEFAULT '',
    "updated_role_type" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ,
    "is_deleted" BOOL NOT NULL DEFAULT False,
    "deleted_by" BIGINT,
    "deleted_user_role" VARCHAR(50) DEFAULT '',
    "school_id" BIGINT NOT NULL REFERENCES "health_passport_schools" ("school_id") ON DELETE CASCADE,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_medical_scr_school__381d93" ON "medical_screening_status" ("school_id");
CREATE INDEX IF NOT EXISTS "idx_medical_scr_student_bd9a98" ON "medical_screening_status" ("student_id");
"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "parent_screening_answers" DROP COLUMN "status";
        ALTER TABLE "teacher_screening_answers" DROP COLUMN "status";
        DROP TABLE IF EXISTS "medical_screening_status";"""
