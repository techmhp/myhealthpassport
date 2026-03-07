from src.models.user_models import (AdminTeamRoles, AnalystRoles,
                                    ConsultantRoles, OnGroundTeamRoles,
                                    ParentRoles, SchoolRoles,
                                    ScreeningTeamRoles)

# Allowed roles each user role can create
ALLOWED_CREATIONS = {
    AdminTeamRoles.SUPER_ADMIN: {
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.HEALTH_BUDDY,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
        AnalystRoles.PSYCHOLOGIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        SchoolRoles.SCHOOL_ADMIN
    },
    AdminTeamRoles.PROGRAM_COORDINATOR: {
        AdminTeamRoles.HEALTH_BUDDY,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
        AnalystRoles.PSYCHOLOGIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        SchoolRoles.SCHOOL_ADMIN
    },
    SchoolRoles.SCHOOL_ADMIN: {
        ParentRoles.PARENT,
        SchoolRoles.TEACHER,
        SchoolRoles.TEACHER,
    },
    ConsultantRoles.PSYCHOLOGIST: set(),
}


ALLOWED_CREATIONS_ADMIN = {
    AdminTeamRoles.SUPER_ADMIN: {
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.HEALTH_BUDDY,
    },
    AdminTeamRoles.PROGRAM_COORDINATOR: {
        AdminTeamRoles.HEALTH_BUDDY
    }
}


ALLOWED_CREATIONS_SCREENING = {
    AdminTeamRoles.SUPER_ADMIN: {
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
    },
    AdminTeamRoles.PROGRAM_COORDINATOR: {
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
    },
}


ALLOWED_CREATIONS_ON_GROUND_TEAM = {
    AdminTeamRoles.SUPER_ADMIN: {
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
    },
    AdminTeamRoles.PROGRAM_COORDINATOR: {
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
    },
}


ALLOWED_CREATIONS_ANALYST = {
    AdminTeamRoles.SUPER_ADMIN: {
        AnalystRoles.NUTRITIONIST,
        AnalystRoles.PSYCHOLOGIST,
        AnalystRoles.MEDICAL_OFFICER,
    },
    AdminTeamRoles.PROGRAM_COORDINATOR: {
        AnalystRoles.NUTRITIONIST,
        AnalystRoles.PSYCHOLOGIST,
        AnalystRoles.MEDICAL_OFFICER,
    },
}

ALLOWED_CREATIONS_CONSULTANT = {
    AdminTeamRoles.SUPER_ADMIN: {
        ConsultantRoles.PEDIATRICIAN,
        ConsultantRoles.DENTIST,
        ConsultantRoles.EYE_SPECIALIST,
        ConsultantRoles.NUTRITIONIST,
        ConsultantRoles.PSYCHOLOGIST,
    },
    AdminTeamRoles.PROGRAM_COORDINATOR: {
        ConsultantRoles.DENTIST,
        ConsultantRoles.EYE_SPECIALIST,
        ConsultantRoles.NUTRITIONIST,
        ConsultantRoles.PSYCHOLOGIST,
    },
}