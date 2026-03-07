from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "dental_report" (
    "dr_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "patient_concern" TEXT NOT NULL,
    "oral_examination" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment_recommendations" TEXT NOT NULL,
    "next_followup" TEXT NOT NULL,
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
    "consultant_user_id" BIGINT REFERENCES "users_consultant" ("id") ON DELETE CASCADE,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_dental_repo_student_384623" ON "dental_report" ("student_id");
        CREATE TABLE IF NOT EXISTS "eye_report" (
    "er_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "patient_concern" TEXT NOT NULL,
    "vision_test_results" TEXT NOT NULL,
    "additional_findings" TEXT NOT NULL,
    "treatment_recommendations" TEXT NOT NULL,
    "next_followup" TEXT NOT NULL,
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
    "consultant_user_id" BIGINT REFERENCES "users_consultant" ("id") ON DELETE CASCADE,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_eye_report_student_787b31" ON "eye_report" ("student_id");
        CREATE TABLE IF NOT EXISTS "pediatrician_report" (
    "pdr_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "patient_concern" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "treatment_recommendations" TEXT NOT NULL,
    "next_followup" TEXT NOT NULL,
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
    "consultant_user_id" BIGINT REFERENCES "users_consultant" ("id") ON DELETE CASCADE,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_pediatricia_student_f1c1ed" ON "pediatrician_report" ("student_id");
        CREATE TABLE IF NOT EXISTS "psychologist_report" (
    "pr_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "patient_concern" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "treatment_recommendations" TEXT NOT NULL,
    "next_followup" TEXT NOT NULL,
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
    "consultant_user_id" BIGINT REFERENCES "users_consultant" ("id") ON DELETE CASCADE,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_psychologis_student_a081da" ON "psychologist_report" ("student_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "dental_report";
        DROP TABLE IF EXISTS "psychologist_report";
        DROP TABLE IF EXISTS "pediatrician_report";
        DROP TABLE IF EXISTS "eye_report";"""
