from tortoise import BaseDBAsyncClient

async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        -- Handle invalid patient_id values
        DELETE FROM consultations WHERE patient_id NOT IN (SELECT id FROM students);
        -- Drop the incorrect foreign key constraint
        ALTER TABLE consultations DROP CONSTRAINT consultations_patient_id_fkey;
        -- Add the correct foreign key constraint
        ALTER TABLE consultations
        ADD CONSTRAINT consultations_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES students (id);
    """

async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        -- Drop the correct foreign key constraint
        ALTER TABLE consultations DROP CONSTRAINT consultations_patient_id_fkey;
        -- Recreate the incorrect foreign key constraint (for rollback)
        ALTER TABLE consultations
        ADD CONSTRAINT consultations_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES users_parents (id);
    """