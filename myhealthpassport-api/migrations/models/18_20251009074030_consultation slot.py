from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "consultations" ADD "hold_expiry" TIMESTAMPTZ;
        ALTER TABLE "lab_test_bookings" ADD "hold_expiry" TIMESTAMPTZ;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "consultations" DROP COLUMN "hold_expiry";
        ALTER TABLE "lab_test_bookings" DROP COLUMN "hold_expiry";"""
