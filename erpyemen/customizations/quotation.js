frappe.ui.form.on("Quotation Item", {
    item_code: function(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
        if (row.item_code) {
            frappe.db.get_list("Item", {
                filters: { item_code: row.item_code },
                fields: ["name", "manufacturer_name", "mfr_part_number", "vendor_part_no", "serial_number", "model_number"],
                limit_page_length: 1
            }).then(items => {
                if (items && items.length > 0) {
                    let item = items[0];
                    frappe.model.set_value(cdt, cdn, "manufacturer_name", item.manufacturer_name || "");
                    frappe.model.set_value(cdt, cdn, "mfr_part_number", item.mfr_part_number || "");
                    frappe.model.set_value(cdt, cdn, "vendor_part_no", item.vendor_part_no || "");
                    frappe.model.set_value(cdt, cdn, "serial_number", item.serial_number || "");
                    frappe.model.set_value(cdt, cdn, "model_number", item.model_number || "");
                }
            });
        }
    }
});