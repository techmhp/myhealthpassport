from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "school_thyrocare_products" DROP CONSTRAINT IF EXISTS "fk_school_t_thyrocar_44e5b008";
        ALTER TABLE "school_thyrocare_products" ADD "product" VARCHAR(100) NOT NULL;
        ALTER TABLE "school_thyrocare_products" DROP COLUMN "product_id";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "school_thyrocare_products" ADD "product_id" BIGINT NOT NULL;
        ALTER TABLE "school_thyrocare_products" DROP COLUMN "product";
        ALTER TABLE "school_thyrocare_products" ADD CONSTRAINT "fk_school_t_thyrocar_44e5b008" FOREIGN KEY ("product_id") REFERENCES "thyrocare_products" ("product_id") ON DELETE CASCADE;"""
