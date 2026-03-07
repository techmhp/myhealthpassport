from tortoise import fields
from tortoise.models import Model


class Transactions(Model):
    tx_id = fields.BigIntField(pk=True)

    tx_no = fields.CharField(max_length=30, unique=True)
    invoice_no = fields.CharField(max_length=50, unique=True)
    tx_mode = fields.CharField(max_length=50, default="")
    tx_type = fields.CharField(max_length=50, default="")
    tx_amnt = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    tx_datetime = fields.DatetimeField()
    tx_status = fields.BooleanField(default=False)
    payment_status = fields.CharField(max_length=20, default="pending")
    discount_amnt = fields.DecimalField(max_digits=10, decimal_places=2, default=0)

    # New fields added
    order_id = fields.CharField(max_length=50, null=True)
    currency = fields.CharField(max_length=3, default="INR")
    amount_refunded = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_status = fields.CharField(max_length=20, null=True)
    description = fields.CharField(max_length=255, default="")
    email = fields.CharField(max_length=255, null=True)
    contact = fields.CharField(max_length=15, null=True)
    error_description = fields.CharField(max_length=255, null=True)
    error_reason = fields.CharField(max_length=255, null=True)
    
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
    transaction_details = fields.ReverseRelation["TransactionDetails"]
    consultations = fields.ReverseRelation["Consultations"]
    
    class Meta:
        table = "transactions"


class TransactionDetails(Model):
    tx_detail_id = fields.BigIntField(pk=True)

    item = fields.CharField(max_length=100, default="")
    price = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amnt = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = fields.IntField(default=0)
    tax = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    sub_total = fields.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Foreign Keys
    tx = fields.ForeignKeyField("models.Transactions", related_name="transaction_details", index=True)

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
        table = "transaction_details"
