frappe.ui.form.on('Stock Reconciliation', {
    refresh: function(frm) {
        frm.add_custom_button(__('Get Items From Tool'), () => {
            open_tool_dialog(frm);
        });
    }
});

function open_tool_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: 'Select Stock Reconciliation Tool',
        fields: [
            {
                label: 'Reconciliation Tool',
                fieldname: 'tool',
                fieldtype: 'Link',
                options: 'Stock Reconciliation Tool',
                reqd: 1
            },
            {
				label: __("get all other items that have qty"),
				fieldname: "get_all_other_items",
				fieldtype: "Check",
			},
            {
				label: __("make all other items that have qty as zero"),
				fieldname: "get_all_other_items_with_zero_qty",
				fieldtype: "Check",
			},
        ],
        primary_action_label: 'Load Items',
        primary_action(values) {
            frappe.call({
                method: 'erpyemen.erpyemen.doctype.stock_reconciliation_tool.stock_reconciliation_tool.get_tool_items',
                args: { tool_name: values.tool,
                    get_all_other_items:values.get_all_other_items,
                    get_all_other_items_with_zero_qty:values.get_all_other_items_with_zero_qty
                },
                callback(r) {
                    if (!r.message) return;
                    frm.clear_table("items");
                    r.message.forEach(row => {
                        //frm.add_child("items", item);
                        let item = frm.add_child("items");
							$.extend(item, row);

							item.qty = item.qty || 0;
							item.valuation_rate = item.valuation_rate || 0;
							item.use_serial_batch_fields = cint(
								frappe.user_defaults?.use_serial_batch_fields
							);
                    });
                    frm.refresh_field("items");
                   // frappe.msgprint("Items loaded from reconciliation tool.");
                }
            });
          d.hide();  
        }
    });

    d.show();
}

