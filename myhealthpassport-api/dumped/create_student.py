import asyncio
from tortoise import Tortoise
from tortoise.exceptions import IntegrityError
from src.config import TORTOISE_ORM
from src.models.student_models import Students

async def init_db():
    try:
        await Tortoise.init(config=TORTOISE_ORM)
        await Tortoise.generate_schemas()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
        raise

async def create_student():
    try:
        await init_db()
        student = await Students.create(
            first_name="Devansh",
            last_name="Aurora",
            gender="MALE",
            dob="2013-04-16",
            class_room=6,  # Changed 'klass' to 'class_room' to match model
            section="A",
            roll_no="001",
            aadhaar_no="1234567890149",
            abha_id="ABHA12345649",
            address_line1="123 Main St",
            street="Main St",
            state="CA",
            pincode="123456",  # Changed to string to match model
            country_code="+1",
            phone="+9876543233",
            country="USA",
            blood_group="B+",
        )
        print(f"Created student with ID: {student.student_id}")
        print(f"Student details: {student.first_name} {student.last_name}, Aadhaar: {student.aadhaar_no}")
        return student
    except IntegrityError as e:
        print(f"Failed to create student: Duplicate entry or constraint violation - {str(e)}")
        raise
    except Exception as e:
        print(f"Failed to create student: {str(e)}")
        raise
    finally:
        await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(create_student())