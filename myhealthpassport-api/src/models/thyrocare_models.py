# src/models/thyrocare_models.py
from tortoise import fields
from tortoise.models import Model
from decimal import Decimal
from datetime import datetime


class ThyrocareProduct(Model):
    """Thyrocare test/profile/package stored in our database"""
    product_id = fields.BigIntField(pk=True)
    code = fields.CharField(max_length=100, unique=True, description="Thyrocare product code")
    name = fields.CharField(max_length=300)
    product_type = fields.CharField(max_length=50)  # TEST, PROFILE, PACKAGE
    description = fields.TextField(null=True)
    mrp = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    pay_amt = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Additional metadata
    parameters_count = fields.IntField(default=0, description="Number of parameters tested")
    sample_type = fields.CharField(max_length=100, null=True, description="Blood, Urine, etc.")
    fasting_required = fields.BooleanField(default=False)
    tat_hours = fields.IntField(default=24, description="Turnaround time in hours")
    
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "thyrocare_products"

class ThyrocareOrder(Model):
    """Main Thyrocare order"""
    order_id = fields.BigIntField(pk=True)
    thyrocare_order_id = fields.CharField(max_length=100, null=True, index=True)
    client_code = fields.CharField(max_length=50, unique=True)
    
    # Relations
    student = fields.ForeignKeyField("models.Students", related_name="thyrocare_orders")
    transaction = fields.ForeignKeyField("models.Transactions", null=True, on_delete=fields.SET_NULL)

    # Address & Collection
    address = fields.TextField()
    house_no = fields.CharField(max_length=100, null=True)
    street = fields.CharField(max_length=200, null=True)
    landmark = fields.CharField(max_length=200, null=True)
    city = fields.CharField(max_length=100)
    state = fields.CharField(max_length=100)
    pincode = fields.IntField()
    
    # Appointment
    appointment_date = fields.DatetimeField()
    
    # Contact
    contact_number = fields.CharField(max_length=15)
    email = fields.CharField(max_length=200, null=True)
    
    # Status
    status = fields.CharField(max_length=50, default="YET TO ASSIGN")
    booking_status = fields.CharField(max_length=50, default="pending")
    
    # Pricing
    total_mrp = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_rate = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_payable = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Payment
    payment_status = fields.CharField(max_length=50, default="POSTPAID")
    paid_amount = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    unpaid_amount = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Phlebo/TSP
    phlebo_name = fields.CharField(max_length=200, null=True)
    phlebo_number = fields.CharField(max_length=15, null=True)
    
    # Reports
    report_url = fields.CharField(max_length=500, null=True)
    report_available = fields.BooleanField(default=False)
    report_timestamp = fields.DatetimeField(null=True)
    
    # Raw response storage
    thyrocare_response = fields.JSONField(null=True)
    
    # Audit
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    created_by = fields.BigIntField()
    created_user_role = fields.CharField(max_length=50)

    class Meta:
        table = "thyrocare_orders"


class ThyrocareOrderItem(Model):
    """Items in a Thyrocare order"""
    id = fields.BigIntField(pk=True)
    order = fields.ForeignKeyField("models.ThyrocareOrder", related_name="order_items")
    product = fields.ForeignKeyField("models.ThyrocareProduct", null=True, on_delete=fields.SET_NULL)
    
    product_code = fields.CharField(max_length=100)
    product_name = fields.CharField(max_length=300)
    product_type = fields.CharField(max_length=50)
    mrp = fields.DecimalField(max_digits=10, decimal_places=2)
    rate = fields.DecimalField(max_digits=10, decimal_places=2)
    pay_amt = fields.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        table = "thyrocare_order_items"


class ThyrocarePatient(Model):
    """Patient details for Thyrocare order"""
    patient_id = fields.BigIntField(pk=True)
    order = fields.ForeignKeyField("models.ThyrocareOrder", related_name="patients")
    
    patient_code = fields.CharField(max_length=50, null=True)  # SP71208652
    name = fields.CharField(max_length=200)
    age = fields.IntField()
    age_type = fields.CharField(max_length=10, default="YEAR")
    gender = fields.CharField(max_length=10)
    contact_number = fields.CharField(max_length=15, null=True)
    email = fields.CharField(max_length=200, null=True)
    
    report_available = fields.BooleanField(default=False)
    report_timestamp = fields.DatetimeField(null=True)

    class Meta:
        table = "thyrocare_patients"


class SchoolThyrocareProduct(Model):
    id = fields.BigIntField(pk=True)
    school = fields.ForeignKeyField("models.Schools", related_name="selected_thyrocare_products")
    # product = fields.ForeignKeyField("models.ThyrocareProduct", related_name="selected_schools")
    product = fields.CharField(max_length=100, description="Thyrocare code like P175")
    custom_name = fields.CharField(max_length=300, null=True)
    custom_price = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_active = fields.BooleanField(default=True)
    
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)

    class Meta:
        table = "school_thyrocare_products"
        unique_together = (("school", "product"),)
        
        
## transaction models for healthians and thyrocare
class LabTransactions(Model):
    lab_tx_id = fields.BigIntField(pk=True)
    
    # Unique identifiers
    lab_tx_no = fields.CharField(max_length=50, unique=True)      # e.g., LABTXN20251125001
    invoice_no = fields.CharField(max_length=50, unique=True)
    vendor = fields.CharField(max_length=20)  # "healthians" | "thyrocare"
    vendor_booking_id = fields.CharField(max_length=100, null=True, index=True)
    
    # Payment details
    amount = fields.DecimalField(max_digits=12, decimal_places=2)
    currency = fields.CharField(max_length=3, default="INR")
    payment_mode = fields.CharField(max_length=20, default="online")  # online, wallet, cash
    payment_status = fields.CharField(max_length=20, default="pending")  # pending, success, failed
    gateway_response = fields.JSONField(null=True)
    
    # Refund
    amount_refunded = fields.DecimalField(max_digits=12, decimal_places=2, default=0)
    refund_status = fields.CharField(max_length=20, null=True)
    
    # Metadata
    description = fields.CharField(max_length=255, default="")
    order_id = fields.CharField(max_length=100, null=True)  # your internal order reference
    email = fields.CharField(max_length=255, null=True)
    contact = fields.CharField(max_length=15, null=True)
    
    # Relations
    student = fields.ForeignKeyField("models.Students", related_name="lab_transactions")
    healthians_booking = fields.ForeignKeyField(
        "models.HealthiansBooking", null=True, on_delete=fields.SET_NULL
    )
    thyrocare_order = fields.ForeignKeyField(
        "models.ThyrocareOrder", null=True, on_delete=fields.SET_NULL
    )
    
    # Audit
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField()
    created_user_role = fields.CharField(max_length=50)
    
    class Meta:
        table = "lab_transactions"
        indexes = [("vendor", "vendor_booking_id")]
        