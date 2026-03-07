from tortoise import fields
from tortoise.models import Model
from enum import Enum
from tortoise import  fields
from tortoise.models import Model
from datetime import datetime
from src.models.user_models import ConsultantRoles,ConsultantTeam  # Import the existing ConsultantRoles enum

class BookingStatus(str, Enum): 
    pending = "pending" # temporarily held, payment not done 
    confirmed = "confirmed" # payment done 
    cancelled = "cancelled"
class Consultations(Model):
    consult_id = fields.BigIntField(pk=True)

    slot_date = fields.DateField()
    slot_time = fields.TimeField()
    consult_fee = fields.DecimalField(max_digits=10, decimal_places=2)
    booking_status = fields.CharField(max_length=100, default="pending")
    hold_expiry = fields.DatetimeField(null=True)
    # Foreign Keys
    doctor = fields.ForeignKeyField("models.ConsultantTeam", related_name="consultations", index=True)
    patient = fields.ForeignKeyField("models.Students", related_name="consultations", index=True)
    tx = fields.ForeignKeyField("models.Transactions", related_name="consultations", index=True, null=True)

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
        table = "consultations"





class DentalReport(Model):
    dr_id = fields.BigIntField(pk=True)

    patient_concern = fields.TextField(default="") 
    oral_examination = fields.TextField(default="")  # JSON Format Objects
    diagnosis = fields.TextField(default="")  # diagnosis
    treatment_recommendations = fields.TextField(default="") #json format object
    next_followup = fields.TextField(default="")
    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="dental_report", index=True)
    consultant_user = fields.ForeignKeyField(
        "models.ConsultantTeam", null=True, related_name="dental_report"
    )

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
        table = "dental_report"

class EyeReport(Model):
    er_id = fields.BigIntField(pk=True)

    patient_concern = fields.TextField(default="") 
    vision_lefteye_res = fields.TextField(default="")
    vision_righteye_res = fields.TextField(default="")
    additional_findings = fields.TextField(default="")  # diagnosis
    treatment_recommendations = fields.TextField(default="") #json format object
    next_followup = fields.TextField(default="")
    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="eye_report", index=True)
    consultant_user = fields.ForeignKeyField(
        "models.ConsultantTeam", null=True, related_name="eye_report"
    )

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
        table = "eye_report"
        

class PsychologistReport(Model):
    pr_id = fields.BigIntField(pk=True)

    patient_concern = fields.TextField(default="") 
    findings = fields.TextField(default="")  # JSON Format Objects
    treatment_recommendations = fields.TextField(default="") #json format object
    next_followup = fields.TextField(default="")
    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="psychologist_report", index=True)
    consultant_user = fields.ForeignKeyField(
        "models.ConsultantTeam", null=True, related_name="psychologist_report"
    )

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
        table = "psychologist_report"

class PediatricianReport(Model):
    pdr_id = fields.BigIntField(pk=True)

    patient_concern = fields.TextField(default="") 
    findings = fields.TextField(default="")  # JSON Format Objects
    treatment_recommendations = fields.TextField(default="") #json format object
    next_followup = fields.TextField(default="")
    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="pediatrician_report", index=True)
    consultant_user = fields.ForeignKeyField(
        "models.ConsultantTeam", null=True, related_name="pediatrician_report"
    )

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
        table = "pediatrician_report"



class MedicalScreeningStatus(Model):
    id = fields.BigIntField(pk=True)
    medical_officer_status_type = fields.CharField(max_length=50, default="")  # Match DB column
    status = fields.CharField(max_length=50, default="")
    remarks = fields.TextField(default="")
    
    student = fields.ForeignKeyField("models.Students", related_name="medical_screening_statuses", index=True)
    school = fields.ForeignKeyField("models.Schools", related_name="medical_screening_statuses", index=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)
    created_user_role = fields.CharField(null=True, max_length=50, default="")
    created_role_type = fields.CharField(null=True, max_length=50, default="")

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)
    updated_user_role = fields.CharField(null=True, max_length=50, default="")
    updated_role_type = fields.CharField(null=True, max_length=50, default="")

    deleted_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)
    deleted_by = fields.BigIntField(null=True)
    deleted_user_role = fields.CharField(null=True, max_length=50, default="")

    class Meta:
        table = "medical_screening_status"

class SpecialistAppointmentDecision(Model):
    id = fields.BigIntField(pk=True)
    appointment_status = fields.CharField(max_length=50)
    notes = fields.TextField(default="")

    student = fields.ForeignKeyField("models.Students", related_name="specialist_decisions", index=True)
    specialist_role = fields.CharEnumField(ConsultantRoles, default=ConsultantRoles.PEDIATRICIAN)  # Updated to use ConsultantRoles
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)
    created_user_role = fields.CharField(null=True, max_length=50, default="")
    created_role_type = fields.CharField(null=True, max_length=50, default="")

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)
    updated_user_role = fields.CharField(null=True, max_length=50, default="")
    updated_role_type = fields.CharField(null=True, max_length=50, default="")

    deleted_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "specialist_appointment_decisions"
        
