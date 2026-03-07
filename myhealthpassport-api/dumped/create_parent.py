import asyncio
from tortoise import Tortoise
from tortoise.exceptions import IntegrityError
from src.config import TORTOISE_ORM
from src.models.user_models import Parents, ParentRoles

async def init_db():
    try:
        await Tortoise.init(config=TORTOISE_ORM)
        await Tortoise.generate_schemas()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
        raise

async def create_parent():
    try:
        await init_db()
        parent = await Parents.create(
            first_name="Peter",
            last_name="Aurora",
            middle_name="John",
            mobile="+9876543233",  # Unique mobile number
            email="peter.aurora@example.com",
            relation="Father",
            user_role=ParentRoles.PARENT,
            role_type="PARENT",
            profile_image="https://example.com/images/peter.jpg",
            is_active=True,
            is_verified=True
        )
        print(f"Created parent with ID: {parent.id}")
        print(f"Parent details: {parent.first_name} {parent.last_name}, Mobile: {parent.mobile}")
        return parent
    except IntegrityError as e:
        print(f"Failed to create parent: Duplicate entry or constraint violation - {str(e)}")
        raise
    except Exception as e:
        print(f"Failed to create parent: {str(e)}")
        raise
    finally:
        await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(create_parent())