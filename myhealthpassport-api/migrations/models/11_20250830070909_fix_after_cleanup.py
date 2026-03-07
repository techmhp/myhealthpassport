from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "idx_eye_screeni_screeni_6bf496";
        DROP INDEX IF EXISTS "idx_dental_scre_screeni_6ac8dd";
        ALTER TABLE "users_consultant" ADD "clinic_name" VARCHAR(100) NOT NULL DEFAULT '';
        ALTER TABLE "users_consultant" ADD "location_link" VARCHAR(500) DEFAULT '';
        ALTER TABLE "dental_screening" ADD "consultant_user_id" BIGINT;
        ALTER TABLE "dental_screening" ALTER COLUMN "screening_user_id" DROP NOT NULL;
        ALTER TABLE "eye_screening" ADD "consultant_user_id" BIGINT;
        ALTER TABLE "eye_screening" ALTER COLUMN "screening_user_id" DROP NOT NULL;
        ALTER TABLE "dental_screening" ADD CONSTRAINT "fk_dental_s_users_co_9820a95d" FOREIGN KEY ("consultant_user_id") REFERENCES "users_consultant" ("id") ON DELETE CASCADE;
        ALTER TABLE "eye_screening" ADD CONSTRAINT "fk_eye_scre_users_co_59dab96e" FOREIGN KEY ("consultant_user_id") REFERENCES "users_consultant" ("id") ON DELETE CASCADE;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "dental_screening" DROP CONSTRAINT IF EXISTS "fk_dental_s_users_co_9820a95d";
        ALTER TABLE "eye_screening" DROP CONSTRAINT IF EXISTS "fk_eye_scre_users_co_59dab96e";
        ALTER TABLE "eye_screening" DROP COLUMN "consultant_user_id";
        ALTER TABLE "eye_screening" ALTER COLUMN "screening_user_id" SET NOT NULL;
        ALTER TABLE "users_consultant" DROP COLUMN "clinic_name";
        ALTER TABLE "users_consultant" DROP COLUMN "location_link";
        ALTER TABLE "dental_screening" DROP COLUMN "consultant_user_id";
        ALTER TABLE "dental_screening" ALTER COLUMN "screening_user_id" SET NOT NULL;
        CREATE INDEX IF NOT EXISTS "idx_eye_screeni_screeni_6bf496" ON "eye_screening" ("screening_user_id");
        CREATE INDEX IF NOT EXISTS "idx_dental_scre_screeni_6ac8dd" ON "dental_screening" ("screening_user_id");"""
