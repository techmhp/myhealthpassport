from tortoise import fields
from tortoise.models import Model


class ContactTranscriptions(Model):
    transcript_id = fields.BigIntField(pk=True)

    contact_number = fields.CharField(max_length=20, default="")
    audio_file = fields.TextField(default="")
    transcription_text = fields.TextField(default="")
    status = fields.BooleanField(default=True)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="contact_transcriptions")
    parent = fields.ForeignKeyField("models.Parents", related_name="contact_transcriptions")

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "contact_transcriptions"


class LabTests(Model):
    test_id = fields.BigIntField(pk=True)

    test_name = fields.CharField(max_length=400, unique=True)
    description = fields.TextField(null=True)
    price = fields.DecimalField(max_digits=10, decimal_places=2)
    status = fields.IntField()

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)

    # Relations
    student_lab_test_reports = fields.ReverseRelation["StudentLabTestReports"]

    class Meta:
        table = "lab_tests"


class Questionnaire(Model):
    question_id = fields.BigIntField(pk=True)

    question = fields.CharField(max_length=255)
    type = fields.CharField(default="", max_length=100)
    sub_type = fields.CharField(default="", max_length=100)
    group = fields.CharField(default="", max_length=100)
    status = fields.BooleanField(default=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    # Relations
    student_questionnaires = fields.ReverseRelation["StudentQuestionnaire"]

    class Meta:
        table = "questionnaire"


class StudentLabTestReports(Model):
    slt_id = fields.BigIntField(pk=True)

    price = fields.DecimalField(max_digits=10, decimal_places=2, null=True, default=0)
    note = fields.TextField(default="")
    status = fields.BooleanField(default=True)

    # Foreign Keys
    test = fields.ForeignKeyField("models.LabTests", related_name="student_lab_test_reports")
    student = fields.ForeignKeyField("models.Students", related_name="student_lab_test_reports")

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "student_lab_test_reports"


class StudentQuestionnaire(Model):
    sq_id = fields.BigIntField(pk=True)

    answer = fields.CharField(default="", max_length=255)

    # Foreign Keys
    question = fields.ForeignKeyField("models.Questionnaire", related_name="student_questionnaires")
    student = fields.ForeignKeyField("models.Students", related_name="student_questionnaires")

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "student_questionnaire"


class StudentVaccination(Model):
    sv_id = fields.BigIntField(pk=True)

    status = fields.BooleanField(default=True)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="student_vaccinations", index=True)
    vaccine = fields.ForeignKeyField("models.Vaccinations", related_name="vaccinations", index=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "student_vaccination"


class Vaccinations(Model):
    vaccine_id = fields.BigIntField(pk=True)

    vaccine_name = fields.CharField(default="", max_length=255)
    age = fields.CharField(default="", max_length=255)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    # Relations
    student_vaccinations = fields.ReverseRelation["StudentVaccination"]

    class Meta:
        table = "vaccinations"

    
class ClinicalRecomendations(Model):
    id = fields.IntField(pk=True)

    user_id = fields.BigIntField()  # BigInt for user id
    report_type = fields.CharField(max_length=100)  # Dynamic report type (e.g., physical_screening, questionary)
    questions_data = fields.JSONField(null=True)  # Store array of question types and answers
    summary = fields.TextField(null=True)  # Report-specific summary
    status = fields.CharField(max_length=50, null=True)  # Report-specific status
    common_summary = fields.TextField(null=True)  # Shared summary for questionary and nutritional deficiency
    common_status = fields.CharField(max_length=50, null=True)  # Shared status for questionary and nutritional deficiency
    clinical_notes = fields.TextField(null=True)  # Clinical notes for the entire table
    role_type = fields.CharField(max_length=50)  # Role type (e.g., admin, doctor)
    role_name = fields.CharField(max_length=100)  # Role name (e.g., Dr. Smith)

    analysis_status = fields.BooleanField(default=False)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", index=True)  # Links to Students model
    clinical_status = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "clinical_recomendations"

 
# Updated ClinicalFindings model
class ClinicalFindings(Model):
    id = fields.BigIntField(pk=True)

    user_id = fields.BigIntField()
    role_type = fields.CharField(max_length=50)
    role_name = fields.CharField(max_length=100)
    findings_data = fields.JSONField()  # Stores list of findings and remarks
    need_attention_data = fields.JSONField(null=True) 
    strengths = fields.TextField(default="") # not using this columns
    need_attention = fields.TextField(default="") # not using this columns
    clinical_notes_recommendations = fields.TextField(default="")
    summary = fields.TextField(default="")
    status = fields.CharField(max_length=50, null=True)
    analysis_status = fields.BooleanField(default=False)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="clinical_findings", index=True)
    clinical_status = fields.BooleanField(default=False) 
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "clinical_findings"

from tortoise import fields, models
from enum import Enum


class BookingStatus(str, Enum):
    pending = "pending"      # temporarily held, payment not done
    confirmed = "confirmed"  # payment done
    cancelled = "cancelled"  # cancelled by user/system


class LabTestBookings(models.Model):
    booking_id = fields.BigIntField(pk=True)

    # Foreign Keys
    doctor = fields.ForeignKeyField("models.AnalystTeam", related_name="lab_test_bookings")
    patient = fields.ForeignKeyField("models.Students", related_name="lab_test_bookings")
    test = fields.ForeignKeyField("models.LabTests", related_name="bookings")
    tx = fields.ForeignKeyField("models.Transactions", related_name="labtransactions", index=True, null=True)

    # Booking details
    slot_date = fields.DateField()
    slot_time = fields.TimeField()
    consult_fee = fields.DecimalField(max_digits=10, decimal_places=2)
    booking_status = fields.CharField(max_length=100, default=BookingStatus.pending.value)
    hold_expiry = fields.DatetimeField(null=True)

    # Created info
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)
    created_user_role = fields.CharField(null=True, max_length=50, default="")
    created_role_type = fields.CharField(null=True, max_length=50, default="")

    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "lab_test_bookings"
