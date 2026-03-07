from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "eye_screening" DROP CONSTRAINT IF EXISTS "fk_eye_scre_users_co_59dab96e";
        ALTER TABLE "dental_screening" DROP CONSTRAINT IF EXISTS "fk_dental_s_users_co_9820a95d";
        ALTER TABLE "dental_screening" DROP COLUMN "consultant_user_id";
        ALTER TABLE "eye_screening" DROP COLUMN "consultant_user_id";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "eye_screening" ADD "consultant_user_id" BIGINT;
        ALTER TABLE "dental_screening" ADD "consultant_user_id" BIGINT;
        ALTER TABLE "eye_screening" ADD CONSTRAINT "fk_eye_scre_users_co_59dab96e" FOREIGN KEY ("consultant_user_id") REFERENCES "users_consultant" ("id") ON DELETE CASCADE;
        ALTER TABLE "dental_screening" ADD CONSTRAINT "fk_dental_s_users_co_9820a95d" FOREIGN KEY ("consultant_user_id") REFERENCES "users_consultant" ("id") ON DELETE CASCADE;"""
