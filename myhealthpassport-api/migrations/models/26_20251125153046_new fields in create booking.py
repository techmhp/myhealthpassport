from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "healthians_bookings" ADD "vendor_customer_id" VARCHAR(100);
        ALTER TABLE "healthians_bookings" ADD "vendor_billing_user_id" VARCHAR(100);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "healthians_bookings" DROP COLUMN "vendor_customer_id";
        ALTER TABLE "healthians_bookings" DROP COLUMN "vendor_billing_user_id";"""
