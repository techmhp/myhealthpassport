from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users_parents" ADD "deleted_user_role" VARCHAR(50) DEFAULT '';
        ALTER TABLE "users_parents" ADD "deleted_by" BIGINT;
        ALTER TABLE "users_school_staff" ADD "deleted_user_role" VARCHAR(50) DEFAULT '';
        ALTER TABLE "users_school_staff" ADD "deleted_by" BIGINT;
        ALTER TABLE "student_lab_test_reports" DROP COLUMN "file_path";
        ALTER TABLE "health_passport_schools" ADD "deleted_user_role" VARCHAR(50) DEFAULT '';
        ALTER TABLE "health_passport_schools" ADD "deleted_by" BIGINT;
        ALTER TABLE "parent_children" ADD "deleted_user_role" VARCHAR(50) DEFAULT '';
        ALTER TABLE "parent_children" ADD "deleted_by" BIGINT;
        ALTER TABLE "school_students" ADD "deleted_user_role" VARCHAR(50) DEFAULT '';
        ALTER TABLE "school_students" ADD "deleted_by" BIGINT;
        ALTER TABLE "students" ADD "deleted_user_role" VARCHAR(50) DEFAULT '';
        ALTER TABLE "students" ADD "deleted_by" BIGINT;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users_parents" DROP COLUMN "deleted_user_role";
        ALTER TABLE "users_parents" DROP COLUMN "deleted_by";
        ALTER TABLE "health_passport_schools" DROP COLUMN "deleted_user_role";
        ALTER TABLE "health_passport_schools" DROP COLUMN "deleted_by";
        ALTER TABLE "students" DROP COLUMN "deleted_user_role";
        ALTER TABLE "students" DROP COLUMN "deleted_by";
        ALTER TABLE "users_school_staff" DROP COLUMN "deleted_user_role";
        ALTER TABLE "users_school_staff" DROP COLUMN "deleted_by";
        ALTER TABLE "parent_children" DROP COLUMN "deleted_user_role";
        ALTER TABLE "parent_children" DROP COLUMN "deleted_by";
        ALTER TABLE "school_students" DROP COLUMN "deleted_user_role";
        ALTER TABLE "school_students" DROP COLUMN "deleted_by";
        ALTER TABLE "student_lab_test_reports" ADD "file_path" TEXT NOT NULL;"""
