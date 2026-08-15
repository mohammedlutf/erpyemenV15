frappe.pages['mobile_scanner'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Mobile Stock Counter',
        single_column: true
    });

    // 1. Dynamically Load html5-qrcode Library for Camera Support
    if (typeof Html5Qrcode === 'undefined') {
        let script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.type = 'text/javascript';
        document.head.appendChild(script);
    }

    $(wrapper).find('.layout-main-section').html(frappe.render_template('mobile_scanner', {}));

    let current_session = frappe.utils.get_url_arg('session');
    let current_warehouse = frappe.utils.get_url_arg('warehouse');
    let active_item = null;
    let html5QrCodeScanner = null;

    $('#active-session-display').text(current_session || 'Not Selected');
    $('#active-warehouse-display').text(current_warehouse || 'Not Selected');

    // 2. Camera Controls
    $('#btn-toggle-camera').on('click', function() {
        startCameraScanner();
    });

    $('#btn-stop-camera').on('click', function() {
        stopCameraScanner();
    });

    function startCameraScanner() {
        if (typeof Html5Qrcode === 'undefined') {
            frappe.msgprint(__('Camera scanner library is loading. Please try again in 3 seconds.'));
            return;
        }

        $('#camera-reader-wrapper').removeClass('d-none');
        $('#btn-toggle-camera').hide();

        if (!html5QrCodeScanner) {
            html5QrCodeScanner = new Html5Qrcode("camera-reader");
        }

        const config = { 
            fps: 15, 
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0 
        };

        // Prefer back camera ("environment")
        html5QrCodeScanner.start(
            { facingMode: "environment" }, 
            config, 
            onBarcodeScannedSuccess
        ).catch(err => {
            frappe.msgprint(__('Unable to access phone camera. Ensure HTTPS and camera permissions are granted.'));
            stopCameraScanner();
        });
    }

    function stopCameraScanner() {
        if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
            html5QrCodeScanner.stop().then(() => {
                $('#camera-reader-wrapper').addClass('d-none');
                $('#btn-toggle-camera').show();
            }).catch(err => console.error(err));
        } else {
            $('#camera-reader-wrapper').addClass('d-none');
            $('#btn-toggle-camera').show();
        }
    }

    function onBarcodeScannedSuccess(decodedText, decodedResult) {
        // Play success beep sound
        try {
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let osc = audioCtx.createOscillator();
            osc.frequency.value = 800;
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch(e) {}

        // Populate barcode input and fetch details
        $('#barcode-input').val(decodedText);
        stopCameraScanner();
        fetchItemDetails(decodedText);
    }

    // 3. Hardware / Manual Barcode Lookup
    $('#barcode-input').on('keypress', function(e) {
        if (e.which === 13) {
            let barcode = $(this).val().trim();
            if (barcode) {
                fetchItemDetails(barcode);
            }
        }
    });

    $('#btn-manual-search').on('click', function() {
        let barcode = $('#barcode-input').val().trim();
        if (barcode) {
            fetchItemDetails(barcode);
        }
    });

    function fetchItemDetails(barcode) {
        frappe.call({
            method: 'erpyemen.api.scanner.scan_and_fetch_item',
            args: {
                barcode_or_code: barcode,
                warehouse: current_warehouse,
                session: current_session
            },
            callback: function(r) {
                if (r.message) {
                    active_item = r.message;
                    renderItemCard(active_item);
                }
            }
        });
    }

    function renderItemCard(item) {
        $('#disp-item-name').text(item.item_name);
        $('#disp-item-code').text(item.item_code + ' | Stock UOM: ' + item.stock_uom);

        let uom_select = $('#uom-selector').empty();
        item.available_uoms.forEach(u => {
            uom_select.append(new Option(`${u.uom} (x${u.conversion_factor})`, u.uom, false, u.uom === item.stock_uom));
        });

        if (item.current_erp_qty !== null && item.current_erp_qty !== undefined) {
            $('#disp-system-qty').text(item.current_erp_qty);
            $('#system-qty-wrapper').removeClass('d-none');
        } else {
            $('#system-qty-wrapper').addClass('d-none');
        }

        if (item.image) {
            $('#item-image-preview').attr('src', item.image).show();
        } else {
            $('#item-image-preview').hide();
        }

        $('#item-details-card').removeClass('d-none');
        $('#counted-qty-input').val(1.0).focus().select();
    }

    // Stepper Buttons (+ / -)
    $('.btn-step-up').on('click', function() {
        let val = parseFloat($('#counted-qty-input').val()) || 0;
        $('#counted-qty-input').val(val + 1);
    });

    $('.btn-step-down').on('click', function() {
        let val = parseFloat($('#counted-qty-input').val()) || 0;
        if (val > 1) $('#counted-qty-input').val(val - 1);
    });

    // 4. Save Count Entry
    $('#btn-submit-count').on('click', function() {
        if (!active_item) return;

        let selected_uom = $('#uom-selector').val();
        let uom_obj = active_item.available_uoms.find(u => u.uom === selected_uom);

        let payload = {
            session: current_session,
            warehouse: current_warehouse,
            entry_name: active_item.entry_name,
            item_code: active_item.item_code,
            selected_uom: selected_uom,
            conversion_factor: uom_obj ? uom_obj.conversion_factor : 1.0,
            counted_quantity: parseFloat($('#counted-qty-input').val()),
            batch_no: $('#batch-input').val(),
            serial_no: $('#serial-input').val()
        };

        frappe.call({
            method: 'stock_count_management.api.scanner.submit_count_payload',
            args: { payload: payload },
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frappe.show_alert({ message: __('Count Saved Successfully'), indicator: 'green' });
                    resetScanner();
                }
            }
        });
    });

    function resetScanner() {
        active_item = null;
        $('#item-details-card').addClass('d-none');
        $('#barcode-input').val('').focus();
    }
};