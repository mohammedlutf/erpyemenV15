frappe.ui.form.on("Share Transfer", {
    transfer_type(frm) {
        frm.trigger("set_share_range");
    },

    no_of_shares(frm) {
        frm.trigger("set_share_range");
    },

    set_share_range(frm) {
        if (frm.doc.transfer_type !== "Issue" || !frm.doc.no_of_shares) {
            return;
        }

        // Fetch last previous Share Transfer (sorted by to_no descending)
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Share Transfer",
                fields: ["to_no"],
                filters: {
                    transfer_type: "Issue",
                    docstatus: 1       // only submitted records
                },
                limit_page_length: 1,
                order_by: "to_no desc"
            },
            callback: function (r) {
                let last_to = 0;

                if (r.message && r.message.length > 0) {
                    last_to = r.message[0].to_no || 0;
                }

                let from_no = last_to + 1;
                let to_no = last_to + frm.doc.no_of_shares;

                frm.set_value("from_no", from_no);
                frm.set_value("to_no", to_no);
            }
        });
    }
});