import enum


class TeamType(str, enum.Enum):
    ON_GROUND_TEAM = "ON_GROUND_TEAM"
    SCREENING_TEAM = "SCREENING_TEAM"
    ADMIN_TEAM = "ADMIN_TEAM"
    CONSULTANT_TEAM = "CONSULTANT_TEAM"
    ANALYST_TEAM = "ANALYST_TEAM"
    SCHOOL_STAFF = "SCHOOL_STAFF"



roles_details = [
    {
        "role_type": "PARENT",
        "roles": [
            {"role": "PARENT"}
        ]
    },
    {
        "role_type": "SCHOOL_STAFF",
        "roles": [
            {"role": "SCHOOL_ADMIN"},
            {"role": "TEACHER"}
        ]
    },
    {
        "role_type": "ON_GROUND_TEAM",
        "roles": [
            {"role": "REGISTRATION_TEAM"},
            {"role": "CAMP_COORDINATOR"}
        ]
    },
    {
        "role_type": "SCREENING_TEAM",
        "roles": [
            {"role": "PHYSICAL_WELLBEING"},
            {"role": "DENTIST"},
            {"role": "EYE_SPECIALIST"},
            {"role": "NUTRITIONIST"},
            {"role": "PSYCHOLOGIST"}
        ]
    },
    {
        "role_type": "ANALYST_TEAM",
        "roles": [
            {"role": "NUTRITIONIST"},
            {"role": "PSYCHOLOGIST"},
            {"role": "MEDICAL_OFFICER"}
        ]
    },
    {
        "role_type": "ADMIN_TEAM",
        "roles": [
            {"role": "PROGRAM_COORDINATOR"},
            {"role": "SUPER_ADMIN"},
            {"role": "HEALTH_BUDDY"}
        ]
    },
    {
        "role_type": "CONSULTANT_TEAM",
        "roles": [
            {"role": "PEDIATRICIAN"},
            {"role": "DENTIST"},
            {"role": "EYE_SPECIALIST"},
            {"role": "NUTRITIONIST"},
            {"role": "PSYCHOLOGIST"}
        ]
    }
]


class_list = [
    {
        "class_type": "Pre-Primary",
        "class_names": [
            "Nursery", "LKG", "UKG"
        ]
    },
    {
        "class_type": "Primary",
        "class_names": [
            "1", "2", "3", "4", "5"
        ]
    },
    {
        "class_type": "Middle (Upper Primary)",
        "class_names": [
            "6", "7", "8"
        ]
    },
    {
        "class_type": "Secondary",
        "class_names": [
            "9", "10"
        ]
    },
    {
        "class_type": "Higher Secondary ",
        "class_names": [
            "11", "12"
        ]
    },
]


all_class_names = []
for class_group in class_list:
    all_class_names.extend(class_group["class_names"])

DROPDOWN_OPTIONS = {
    "Diagnosis": [
        "Early Childhood Caries (ECC)/ Nursing bottle caries",
        "White Spot Lesions",
        "Tongue-Tie (Ankyloglossia)",
        "Non-nutritive sucking habit",
        "Enamel Hypoplasia",
        "Delayed Eruption",
        "Trauma (Luxation/Fracture)",
        "Dental injury (fall/sports)",
        "Dental Caries",
        "Gingivitis",
        "Retained Primary Tooth",
        "Crossbite / Open Bite",
        "Crowding / Spacing",
        "Eruption Cyst",
        "Malocclusion (Class I)",
        "Malocclusion (Class II)",
        "Malocclusion (Class III)",
        "Bruxism",
        "Microdontia / Peg Lateral",
        "Periodontitis",
        "Impacted Third Molars",
        "Pericoronitis",
        "Enamel Erosion",
        "Dental Trauma",
        "Staining Fluorosis",
        "Bruxism",
        "TMJ Disorder (Temporomandibular Joint Disorder)",
        "Mouth Breathing", 
        "Tongue Thrust"
    ],
    "Oral Examination Findings": [
        "Upper front tooth decay (bottle feeding/sugary drinks)",
        "Chalky white enamel near gums",
        "Tongue-tie with speech issues",
        "Thumb/pacifier sucking",
        "Enamel pits/grooves (hypoplasia/fluorosis)"
        "Missing age-appropriate teeth",
        "Dental injury (fall/sports)",
        "Molars with cavities/food lodgment",
        "Retained baby teeth",
        "Misaligned teeth / bite issues",
        "Early tooth loss with space loss",
        "Swelling over erupting tooth",
        "Improper jaw alignment",
        "Night grinding (bruxism)",
        "Small/ conical teeth",
        "Tooth pain/sensitivity (esp. back teeth)",
        "Crowded/ overlapping teeth",
        "Wisdom tooth pain/swelling",
        "Enamel wear from acidic intake",
        "Fractured/ knocked-out teeth",
        "Brown/yellow stains/patches on teeth",
        "Jaw pain / tooth erosion",
        "Open bite",
        "Gums -  pockets, pus discharge, bleeding",
        "Diastema (tooth gap)",
        "Attrition (tooth-to-tooth wear)",
        "Abrasion (mechanical wear)"
    ],
    "Patient Concern": [
        "Bad breath",
        "Bleeding gums",
        "Difficulty in chewing",
        "Difficulty in moving jaws",
        "Gum pain",
        "Plaque",
        "Sensitive tooth",
        "Swelling in gums",
        "Swelling in jaws",
        "Teeth grinding",
        "Tooth decay",
        "Tooth pain",
        "Tooth discoloration"
    ],
    "Recommendations": [
        "Cavity Filling",
        "Needs detailed evaluation",
        "Needs Parental education",
        "Referral to other speciality - Psychologist",
        "Referral to other speciality - Orthopedic",
        "Referral to other speciality - Nutritionist",
        "Referral to other speciality - ENT doctor"
    ]
}
