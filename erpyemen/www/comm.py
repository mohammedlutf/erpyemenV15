import frappe

def get_context(context):
    context.no_cache = 1
    
    

@frappe.whitelist(allow_guest=True)
def submit_contact(name, email, subject, message):

    comm = frappe.get_doc({
        "doctype": "Communication",
        "communication_type": "Communication",
        "communication_medium": "Email",
        "sent_or_received": "Received",
        "sender_full_name":email,
        "subject": subject,
        "content": f"""
<b>Name:</b> {name}<br>
<b>Email:</b> {email}<br><br>
{message}
"""
    })

    comm.insert(ignore_permissions=True)
    frappe.db.commit()
    return {
        "success": True,
        "message": "Your message has been sent successfully."
    }