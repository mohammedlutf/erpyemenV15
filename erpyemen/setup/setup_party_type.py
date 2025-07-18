import frappe

def add_account_party_type():
    if not frappe.db.exists("Party Type", "Account"):
        frappe.get_doc({
            "doctype": "Party Type",
            "party_type": "Account",
            "account_type": "Receivable"  # or "Payable", depending on your use case
        }).insert(ignore_permissions=True)