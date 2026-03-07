from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "school_healthians_packages" ADD "custom_price" DECIMAL(10,2);
        ALTER TABLE "school_healthians_packages" ADD "custom_name" VARCHAR(300);
        ALTER TABLE "school_healthians_packages" ADD "is_active" BOOL NOT NULL DEFAULT True;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "school_healthians_packages" DROP COLUMN "custom_price";
        ALTER TABLE "school_healthians_packages" DROP COLUMN "custom_name";
        ALTER TABLE "school_healthians_packages" DROP COLUMN "is_active";"""
