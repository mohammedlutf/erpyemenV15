
frappe.ui.form.on("Sales Invoice", "refresh", function(frm) {
    frm.fields_dict['items'].grid.get_field('uom').get_query = function(doc, cdt, cdn) {
        var child = locals[cdt][cdn];
        return {
            query: 'erpyemen.customizations.sales_invoice.get_items_uoms',
            filters:{
                'parent': child.item_code
            }
        }
    }
});

// frappe.ui.form.on("Sales Invoice", {
//     before_save: function(frm) {
//         return new Promise((resolve, reject) => {
//             let warnings = [];
//             let promises = [];

//             (frm.doc.items || []).forEach(item => {
//                 if (!item.item_code || !item.rate) return;

//                 promises.push(
//                     frappe.call({
//                         method: "frappe.client.get_value",
//                         args: {
//                             doctype: "Item",
//                             filters: { name: item.item_code },
//                             fieldname: ["last_purchase_rate"]
//                         }
//                     }).then(r => {
//                         const last_rate = parseFloat(r.message?.last_purchase_rate || 0);
//                         const selling_rate = parseFloat(item.rate);
//                         if (last_rate && selling_rate < last_rate) {
//                             warnings.push({
//                                 item_code: item.item_code,
//                                 rate: selling_rate,
//                                 last_rate: last_rate
//                             });
//                         }
//                     })
//                 );
//             });

//             Promise.all(promises).then(() => {
//                 if (warnings.length > 0) {
//                     let msg = warnings.map(w =>
//                         `Item <b>${w.item_code}</b>: Selling Rate <b>${w.rate}</b> is lower than Last Purchase Rate <b>${w.last_rate}</b>`
//                     ).join("<br><br>");

//                     frappe.confirm(
//                         __("Warning:<br><br>{0}<br><br>Do you want to continue saving?", [msg]),
//                         () => resolve(),  // User clicked OK
//                         () => reject()    // User clicked Cancel
//                     );
//                 } else {
//                     resolve();
//                 }
//             }).catch(() => reject());
//         });
//     }
// });