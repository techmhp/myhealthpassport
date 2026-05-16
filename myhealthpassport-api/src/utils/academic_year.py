# src/utils/academic_year.py
from datetime import datetime, date
from typing import Optional, Tuple

def get_current_academic_year() -> str:
    """Returns current academic year in format '2024-2025'."""
    today = datetime.now().date()
    
    # New academic year starts May 1, but default to previous year through June
    # to allow transition time before new screening data is populated
    if today.month < 7:  # Jan-Jun belongs to previous academic year
        start_year = today.year - 1
        end_year = today.year
    else:  # Jul-Dec belongs to current academic year
        start_year = today.year
        end_year = today.year + 1
    
    return f"{start_year}-{end_year}"


def parse_academic_year(academic_year: str) -> Tuple[date, date]:
    """
    Converts academic year string to date range.
    
    Args:
        academic_year: String in format '2024-2025'
    
    Returns:
        Tuple of (start_date, end_date)
    """
    try:
        start_year, end_year = academic_year.split('-')
        start_year = int(start_year)
        end_year = int(end_year)
        
        if end_year != start_year + 1:
            raise ValueError("Academic year must be consecutive years")
        
        ay_start = date(start_year, 5, 1)
        ay_end = date(end_year, 4, 30)
        
        return ay_start, ay_end
    except (ValueError, AttributeError):
        raise ValueError(f"Invalid academic year format. Expected 'YYYY-YYYY' (e.g., '2024-2025')")


def get_available_academic_years(years_back: int = 5) -> list[str]:
    """Returns list of available academic years for dropdown."""
    current_ay = get_current_academic_year()
    current_start_year = int(current_ay.split('-')[0])
    
    academic_years = []
    for i in range(years_back + 1):
        start = current_start_year - i
        end = start + 1
        academic_years.append(f"{start}-{end}")
    
    return academic_years


def build_academic_year_filter(
    academic_year: Optional[str] = None,
    created_field: str = "created_at",
    updated_field: str = "updated_at"
) -> dict:
    """
    Build Tortoise ORM filter for academic year based on created_at OR updated_at.
    
    This allows filtering records that were either created OR updated in the academic year.
    
    Args:
        academic_year: Academic year string (e.g., '2024-2025'). If None, uses current year.
        created_field: Name of the created datetime field
        updated_field: Name of the updated datetime field
    
    Returns:
        dict: Tortoise ORM Q filter
    
    Example:
        filter_dict = build_academic_year_filter('2024-2025')
        # Returns: Q(created_at__gte=..., created_at__lte=...) | Q(updated_at__gte=..., updated_at__lte=...)
    """
    from tortoise.queryset import Q
    
    if academic_year is None:
        academic_year = get_current_academic_year()
    
    ay_start, ay_end = parse_academic_year(academic_year)
    
    # Create Q objects for created_at OR updated_at within academic year
    created_filter = Q(**{
        f"{created_field}__gte": ay_start,
        f"{created_field}__lte": ay_end
    })
    
    updated_filter = Q(**{
        f"{updated_field}__gte": ay_start,
        f"{updated_field}__lte": ay_end
    })
    
    # Return OR condition: (created in year) OR (updated in year)
    return created_filter | updated_filter
