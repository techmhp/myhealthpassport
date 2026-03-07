from .consultation_models import Consultations,MedicalScreeningStatus,SpecialistAppointmentDecision
from .other_models import (
    ContactTranscriptions,
    LabTests,
    Questionnaire,
    StudentLabTestReports,
    StudentQuestionnaire,
    StudentVaccination,
    Vaccinations,
    ClinicalRecomendations,
)
from .school_models import Schools,AssignSchool,StudentSchoolPayment
from .screening_models import (
    BehaviouralChecklist,
    BehaviouralScreening,
    DentalScreening,
    EyeScreening,
    NutritionChecklist,
    NutritionScreening,
    ScreeningAnalysisChecklist,
    ScreeningReports,
    ScreeningReportsSummary
)
from .student_models import ParentChildren, SchoolStudents, Students, AttendanceStatus, SmartScaleData
from .transaction_models import TransactionDetails, Transactions
from .user_models import Parents, SchoolStaff, OnGroundTeam, ScreeningTeam, AnalystTeam, AdminTeam, ConsultantTeam

from .questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers
from .helthians_booking import HealthiansTest, HealthiansPackage, HealthiansBooking
from .thyrocare_models import ThyrocareProduct,ThyrocareOrder,ThyrocareOrderItem,ThyrocarePatient
