frappe.ui.form.on('Item', {
    refresh: function(frm) {
        // Add Barcode button inside barcode child table
        if (frm.fields_dict['barcodes']) {
            frm.fields_dict['barcodes'].grid.add_custom_button(__('Add a Barcode'), function () {
                let barcode = '';
                for (let i = 0; i < 13; i++) {
                    barcode += Math.floor(Math.random() * 10).toString();
                }
                let new_row = frm.add_child('barcodes');
                new_row.barcode = barcode;
                frm.refresh_field('barcodes');
            });
        }

        // 🔽 Dropdown Group: Print Barcode
        frm.add_custom_button(__('Print Barcode'), function () {
            const barcodes = frm.doc.barcodes || [];
            if (!barcodes.length) return frappe.msgprint("No barcodes defined.");

            const barcode_map = {};
            barcodes.forEach(row => {
                if (row.barcode) {
                    barcode_map[row.barcode] = row.uom || "";
                }
            });

            const barcode_options = Object.keys(barcode_map);
            if (!barcode_options.length) return frappe.msgprint("No valid barcodes found.");

            const d = new frappe.ui.Dialog({
                title: "Print Barcode",
                fields: [
                    {
                        label: "Select Barcode",
                        fieldname: "selected_barcode",
                        fieldtype: "Select",
                        options: barcode_options,
                        reqd: 1,
                        onchange: () => {
                            const selected = d.get_value("selected_barcode");
                            d.set_value("uom", barcode_map[selected]);
                        }
                    },
                    { label: "UOM", fieldname: "uom", fieldtype: "Data", read_only: 1 }
                ],
                primary_action_label: "Print",
                primary_action(values) {
                    const barcode = values.selected_barcode;
                    const uom = values.uom;

                    frappe.db.get_value("Item Price", {
                        item_code: frm.doc.name,
                        uom: uom,
                        selling: 1
                    }, "price_list_rate").then(response => {
                        const price = response.message ? response.message.price_list_rate : 0;
                        const print_url = `/printview?doctype=Item&name=${frm.doc.name}&trigger_print=1&format=print%20weight%20barcode&no_letterhead=0&letterhead=ترايس%20الرساله&_lang=ar&generated_label=${encodeURIComponent(barcode)}&selling_price=${encodeURIComponent(price)}`;
                        window.open(print_url, '_blank');
                        d.hide();
                    });
                },
                secondary_action_label: "Cancel",
                secondary_action() {
                    d.hide();
                }
            });

            d.set_value("selected_barcode", barcode_options[0]);
            d.set_value("uom", barcode_map[barcode_options[0]]);
            d.show();
        }, __('Print Barcode')); // group name

        frm.add_custom_button(__('Print Weight Label'), function () {
            let uom_options = (frm.doc.uoms || []).map(row => row.uom);
            let default_uom = frm.doc.stock_uom;

            let d = new frappe.ui.Dialog({
                title: 'Print Weight Label',
                fields: [
                    { label: 'Item Code', fieldname: 'item_code', fieldtype: 'Data', default: frm.doc.item_code, read_only: 1 },
                    { label: 'Item Name', fieldname: 'item_name', fieldtype: 'Data', default: frm.doc.item_name, read_only: 1 },
                    { label: 'UOM', fieldname: 'uom', fieldtype: 'Select', options: uom_options, default: default_uom, reqd: 1,
                        onchange: function () {
                            const item_code = d.get_value('item_code');
                            const uom = d.get_value('uom');
                            if (item_code && uom) fetch_price(item_code, uom);
                        }
                    },
                    { label: 'Selling Price', fieldname: 'selling_price', fieldtype: 'Currency', default: 0, read_only: 1 },
                    { label: 'Enter Weight (g)', fieldname: 'weight', fieldtype: 'Int', reqd: 1,
                        onchange: function () {
                            update_label_and_price();
                        }
                    },
                    { label: 'Generated Label', fieldname: 'generated_label', fieldtype: 'Data', read_only: 1 }
                ],
                primary_action_label: 'Print',
                primary_action(values) {
                    const label = values.generated_label;
                    const price = values.selling_price;
                    const print_url = `/printview?doctype=Item&name=${frm.doc.name}&trigger_print=1&format=print%20weight%20barcode&no_letterhead=0&letterhead=ترايس%20الرساله&settings=%7B%7D&_lang=ar&generated_label=${encodeURIComponent(label)}&selling_price=${encodeURIComponent(price)}`;
                    window.open(print_url, '_blank');
                    d.hide();
                },
                secondary_action_label: 'Cancel',
                secondary_action() {
                    d.hide();
                }
            });

            function fetch_price(item_code, uom) {
                frappe.db.get_value('Item Price', {
                    item_code: item_code,
                    uom: uom,
                    selling: 1
                }, 'price_list_rate').then(response => {
                    let base_price = response.message ? response.message.price_list_rate : 0;
                    d.set_value('selling_price', base_price);
                    if (d.get_value('weight')) update_label_and_price();
                });
            }

            // function update_label_and_price() {
            //     const item_code = d.get_value('item_code');
            //     const weight = d.get_value('weight');
            //     const base_price = d.get_value('selling_price') || 0;
            //     if (item_code && weight) {
            //         let paddedWeight = weight.toString().padStart(5, '0');
            //         let label = `${item_code}${paddedWeight}1`;
            //         d.set_value('generated_label', label);
            //         d.set_value('selling_price', (base_price * weight) / 1000);
            //     }
            // }
            function update_label_and_price() {
                const item_code = d.get_value('item_code');
                const uom = d.get_value('uom');
                const weight = d.get_value('weight');
            
                if (!item_code || !uom || !weight) return;
            
                frappe.db.get_value('Item Price', {
                    item_code: item_code,
                    uom: uom,
                    selling: 1
                }, 'price_list_rate').then(response => {
                    const base_price = response.message ? response.message.price_list_rate : 0;
                    d.set_value('selling_price', (base_price * weight) / 1000);
            
                    // Update barcode label
                    let paddedWeight = weight.toString().padStart(5, '0');
                    let label = `${item_code}${paddedWeight}1`;
                    d.set_value('generated_label', label);
                });
            }
            d.show();
            fetch_price(frm.doc.item_code, default_uom);
        }, __('Print Barcode')); // group name
    }
});
