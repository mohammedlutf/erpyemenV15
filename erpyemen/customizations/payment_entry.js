frappe.ui.form.on('Payment Entry', {
    onload: function(frm) {
        if (!frappe.boot.party_account_types['Account']) {
            frappe.boot.party_account_types['Account'] = {
                party_naming_by: ''
            };
        }
    },
    party_type: function(frm) {
        frm.set_query("party_type", function() {
            return {
                filters: {
                    name: ["in", ["Customer", "Supplier", "Employee", "Shareholder", "Student", "Account"]]
                }
            };
        });
    },
    party: function(frm) {
        if (frm.doc.payment_type === 'Receive' && frm.doc.party_type === 'Account') {
            frm.set_value('paid_from', frm.doc.party);
        }
        if (frm.doc.payment_type === 'Pay' && frm.doc.party_type === 'Account') {
            frm.set_value('paid_to', frm.doc.party);
        } 
    }
});
