
// frappe.ready(function() {

//     console.log("dddddddddddd");
//     $('.btn-sendd').click(function() {
        
//         console.log("clicked")
//     });
// });

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("contact-form");
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhh")
    // frappe.msgprint('{{ _("Thank you for your message") }}', '{{ _("Message Sent") }}');
    form.addEventListener("submit", function (e) {

        e.preventDefault();

        frappe.call({
            type: "POST",
            method: "erpyemen.www.comm.submit_contact",

            args: {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                subject: document.getElementById("subject").value,
                message: document.getElementById("message").value
            },

            callback: function (r) {

                if (r.message.success) {

                    frappe.msgprint('{{ _("Thank you for your message") }}', '{{ _("Message Sent") }}');

                    form.reset();

                } else {

                    alert("Something went wrong.");

                }

            }
        });

    });

});

