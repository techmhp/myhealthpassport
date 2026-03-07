from tortoise import  fields
from tortoise.models import Model
from datetime import datetime


class BehaviouralChecklist(Model):
    bc_id = fields.IntField(pk=True)

    type = fields.CharField(default="", max_length=100)
    name = fields.TextField(default="", max_length=100)

    status = fields.BooleanField(default=True)

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
        table = "behavioural_checklist"


class BehaviouralScreening(Model):
    bs_id = fields.BigIntField(pk=True)

    # Socialisation
    socialisation = fields.JSONField(default={
        "Seeks out peers for social contact": "No",
        "Participates in group activities": "No",
        "Initiates contact with others": "No",
        "Shows interest in what others are doing": "No",
        "Can share or take turns with others": "No"
    })
    # Communication (Verbal & Nonverbal)
    communication = fields.JSONField(default={
        "Speaks clearly and appropriately for age": "No",
        "Responds when spoken to": "No",
        "Initiates conversation or expresses needs verbally": "No",
        "Uses gestures, facial expressions, or body language to communicate": "No",
        "Maintains appropriate eye contact during interactions": "No"
    })
    # Play Behaviour
    play_behaviour = fields.JSONField(default={
        "Engages in play suitable for age": "No",
        "Can play cooperatively with peers": "No",
        "Shows imagination or creativity in play": "No",
        "Plays alone appropriately when needed": "No",
        "Is flexible and not rigid during play": "No"
    })
    # Interaction
    interaction = fields.JSONField(default={
        "Responds appropriately to social cues": "No",
        "Waits for their turn during interactions": "No",
        "Able to start and end interactions respectfully": "No",
        "Accepts praise, help, or correction": "No",
        "Shows empathy or concern for others": "No"
    })
    # Anxiety / Withdrawal
    anxiety_withdrawal = fields.JSONField(default={
        "Avoids eye contact consistently": "No",
        "Withdraws from group or social situations": "No",
        "Appears nervous or self-conscious during interactions": "No",
        "Hesitates to speak or participate": "No",
        "Frequently seeks adult reassurance": "No"
    })
    # Problem Behaviour
    problem_behaviour = fields.JSONField(default={
        "Displays aggression (verbal or physical)": "No",
        "Has difficulty controlling impulses": "No",
        "Interrupts or disrupts others frequently": "No",
        "Engages in repetitive or unusual behaviours": "No",
        "Defiant or non-compliant with adult instructions": "No"
    })

    # Summary of concerns (unchanged)
    summary_concerns = fields.JSONField(default={
        "socialisation": "No",
        "communication": "No",
        "play_behaviour": "No",
        "interaction": "No",
        "anxiety_withdrawal": "No",
        "problem_behaviour": "No"
    })

    # Recommendations (unchanged)
    recommendations = fields.JSONField(default={
        "no_immediate_concern": False,
        "continue_observation": False,
        "discuss_with_teacher": False,
        "schedule_parent_meeting": False,
        "refer_for_counselling": False,
        "recommend_evaluation": False
    })

    # Retain existing fields
    gross_motor_skills = fields.TextField(default="")
    note = fields.TextField(default="")
    next_followup = fields.TextField(default="")
    screening_status = fields.BooleanField(default=False)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="behavioural_screenings", index=True)
    # To-Do:  Need to Discuss with Juniors
    doctor = fields.ForeignKeyField("models.ConsultantTeam", related_name="behavioural_screenings", null=True)

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
        table = "behavioural_screening"


class DentalScreening(Model):
    ds_id = fields.BigIntField(pk=True)

    patient_concern = fields.TextField(default="") 
    oral_examination = fields.TextField(default="")  # JSON Format Objects
    examination_note = fields.TextField(default="") # text only, but now it's not there
    diagnosis = fields.TextField(default="")  # diagnosis
    treatment_recommendations = fields.TextField(default="") #json format object
    report_summary = fields.TextField(default="")  #text

    screening_status = fields.BooleanField(default=False)
    status = fields.CharField(max_length=50, null=True)
    next_followup = fields.TextField(default="")
    treatment_recommendations_note = fields.TextField(default="")

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="dental_screenings", index=True)
    screening_user = fields.ForeignKeyField(
        "models.ScreeningTeam", null=True, related_name="dental_screenings"
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
        table = "dental_screening"


class EyeScreening(Model):
    es_id = fields.BigIntField(pk=True)

    patient_concern = fields.TextField(default="")
    vision_lefteye_res = fields.TextField(default="")
    vision_righteye_res = fields.TextField(default="")
    additional_find = fields.TextField(default="")
    report_summary = fields.TextField(default="")

    recommendations = fields.TextField(default="")
    next_followup = fields.TextField(default="")
    screening_status = fields.BooleanField(default=False)
    status = fields.CharField(max_length=50, null=True)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="eye_screenings", index=True)
    screening_user = fields.ForeignKeyField("models.ScreeningTeam", related_name="eye_screenings", null=True)
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
        table = "eye_screening"


class NutritionChecklist(Model):
    nutrition_id = fields.IntField(pk=True)

    name = fields.CharField(max_length=20, unique=True)
    status = fields.BooleanField(default="")
    nutrition_type = fields.TextField(default="")

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
        table = "nutrition_checklist"


class NutritionScreening(Model):
    ns_id = fields.BigIntField(pk=True)

    eyes = fields.TextField(default="")
    hair = fields.TextField(default="")
    mouth_lips = fields.TextField(default="")
    skin = fields.TextField(default="")
    nails = fields.TextField(default="")
    teeth = fields.TextField(default="")
    general_signs = fields.TextField(default="")
    bone_muscle = fields.TextField(default="")
    note = fields.TextField(default="")
    screening_status = fields.BooleanField(default=False)
    next_followup = fields.TextField(default="")

    student = fields.ForeignKeyField("models.Students", related_name="nutrition_screenings", index=True)
    # To-Do:  Need to Discuss with Juniors
    doctor = fields.ForeignKeyField("models.ConsultantTeam", related_name="nutrition_screenings", null=True)  # Allow NULL

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
        table = "nutrition_screening"


class QuestionariesAndAnswers(Model):
    sqa_id = fields.BigIntField(pk=True)

    question = fields.TextField(default="")
    answer = fields.TextField(default="")
    screening_type = fields.CharField(default="", max_length=100)
    # To-Do:  Need to Discuss with Juniors
    doctor = fields.IntField(null=True)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="screening_questions_answers", index=True)

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
        table = "screening_questions_answers"


class ScreeningAnalysisChecklist(Model):
    ssa_id = fields.BigIntField(pk=True)

    physical_screening = fields.BooleanField(default=False)
    nutrition_screening = fields.BooleanField(default=False)
    emotional_screening = fields.BooleanField(default=False)
    dental_screening = fields.BooleanField(default=False)
    ophthalmologist_screening = fields.BooleanField(default=False)
    lab_test = fields.BooleanField(default=False)
    health_afficer = fields.BooleanField(default=False)
    physical_analysis = fields.BooleanField(default=False)
    nutrition_analysis = fields.BooleanField(default=False)
    emotional_analysis = fields.BooleanField(default=False)
    dental_analysis = fields.BooleanField(default=False)
    ophtalmologist_analysis = fields.BooleanField(default=False)
    medical_officer = fields.BooleanField(default=False)
    final_report_generation = fields.BooleanField(default=False)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="screening_analysis_checklists", index=True)

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
        table = "screening_analysis_checklist"


class ScreeningReports(Model):
    sr_id = fields.BigIntField(pk=True)

    report_type = fields.CharField(max_length=50, default="")
    report_sub_type = fields.TextField(max_length=50, default="")
    key = fields.CharField(max_length=50, default="")
    value = fields.TextField(default="")
    status = fields.BooleanField(default=True)

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
        table = "screening_reports"


class ScreeningReportsSummary(Model):
    srs_id = fields.BigIntField(pk=True)

    screening_type = fields.CharField(max_length=50, default="")
    status = fields.CharField(max_length=50, default="")
    description = fields.TextField(default="")

    # Good Outcomes/Strengths fields
    good_outcomes_type = fields.TextField(default="Good Outcomes/Strengths fields")
    good_outcomes_remarks = fields.TextField(default="")

    # Areas Of Concern/Needs Attention fields
    areas_of_concern_type = fields.TextField(default="Areas Of Concern/Needs Attention fields")
    areas_of_concern_remarks = fields.TextField(default="")

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="screening_reports_summaries", index=True)

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
        table = "screening_reports_summary"

