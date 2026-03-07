from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "transactions" ADD "error_reason" VARCHAR(255);
        ALTER TABLE "transactions" ADD "amount_refunded" DECIMAL(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE "transactions" ADD "description" VARCHAR(255) NOT NULL DEFAULT '';
        ALTER TABLE "transactions" ADD "order_id" VARCHAR(50);
        ALTER TABLE "transactions" ADD "contact" VARCHAR(15);
        ALTER TABLE "transactions" ADD "currency" VARCHAR(3) NOT NULL DEFAULT 'INR';
        ALTER TABLE "transactions" ADD "error_description" VARCHAR(255);
        ALTER TABLE "transactions" ADD "email" VARCHAR(255);
        ALTER TABLE "transactions" ADD "refund_status" VARCHAR(20);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "transactions" DROP COLUMN "error_reason";
        ALTER TABLE "transactions" DROP COLUMN "amount_refunded";
        ALTER TABLE "transactions" DROP COLUMN "description";
        ALTER TABLE "transactions" DROP COLUMN "order_id";
        ALTER TABLE "transactions" DROP COLUMN "contact";
        ALTER TABLE "transactions" DROP COLUMN "currency";
        ALTER TABLE "transactions" DROP COLUMN "error_description";
        ALTER TABLE "transactions" DROP COLUMN "email";
        ALTER TABLE "transactions" DROP COLUMN "refund_status";"""
