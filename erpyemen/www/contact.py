import frappe
import json
from frappe import _

def get_context(context):
    pass

@frappe.whitelist(allow_guest=True)
def send_contact_message():
    """
    Reads parameters directly from Frappe's request data to handle 
    JSON applications cleanly.
    """
    # Parse the incoming JSON body securely
    data = json.loads(frappe.request.data) if frappe.request.data else frappe.form_dict

    full_name = data.get("full_name")
    email = data.get("email")
    message = data.get("message")
    company = data.get("company", "Not Provided")
    request_type = data.get("request_type", "General Inquiry")

    if not full_name or not email or not message:
        frappe.throw(_("Please completely fill out all required fields."))

    # Construct clean HTML body content for the Communication document record
    html_content = f"""
        <p><strong>Full Name:</strong> {full_name}</p>
        <p><strong>Sender Email:</strong> {email}</p>
        <p><strong>Company:</strong> {company}</p>
        <p><strong>Request Type:</strong> {request_type}</p>
        <hr/>
        <p><strong>Message Requirements:</strong></p>
        <p style="white-space: pre-wrap;">{message}</p>
    """

    # Create the Communication document record directly
    comm = frappe.get_doc({
        "doctype": "Communication",
        "communication_type": "Communication",
        "communication_medium": "Email",
        "subject": _("New Message from Website Contact Page"),
        "sender": email,
        "sender_full_name": full_name,
        "content": html_content,
        "status": "Open"
    })
    comm.insert(ignore_permissions=True)

    # Return valid JSON object structure back to JS pipeline
    frappe.response["message"] = {"status": "success", "text": "Inquiry logged successfully."}