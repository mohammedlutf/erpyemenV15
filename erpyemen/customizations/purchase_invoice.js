frappe.ui.form.on("Purchase Invoice", {
    onload: function(frm) {
        frm.fields_dict['items'].grid.get_field('uom').get_query = function(doc, cdt, cdn) {
            let child = locals[cdt][cdn];

            if (!child.item_code) return;

            return {
                query: "erpyemen.customizations.sales_invoice.get_items_uoms",
                filters: {
                    parent: child.item_code
                }
            };
        };
    },
    //update price list rate 
    after_save: function(frm) {
        frm.doc.items.forEach(item => {
            if (!item.item_code || !item.rate) return;
            frappe.db.get_doc('Item', item.item_code).then(item_doc => {
                let rate_in_stock_uom = item.rate;

                if (item.uom !== item_doc.stock_uom && item.conversion_factor) {
                    rate_in_stock_uom = item.rate / item.conversion_factor;
                }

                // Now update only existing Item Price
                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "Item Price",
                        filters: {
                            item_code: item.item_code,
                            price_list: "شراء القياسية",
                            buying: 1
                        },
                        fields: ["name"]
                    },
                    callback: function(res) {
                        if (res.message && res.message.length > 0) {
                            let item_price_name = res.message[0].name;

                            frappe.call({
                                method: "frappe.client.set_value",
                                args: {
                                    doctype: "Item Price",
                                    name: item_price_name,
                                    fieldname: {
                                        price_list_rate: rate_in_stock_uom
                                    }
                                }
                            });
                        }
                    }
                });
            });
        });
    },
  

});
