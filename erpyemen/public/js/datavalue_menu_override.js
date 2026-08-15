(function () {

    function setupSideMenuHover() {

        const sideMenu = document.querySelector(".side-menu");

        if (!sideMenu) {
            return;
        }

        const icons = sideMenu.querySelectorAll(
            ".side-menu-icons > ul > li"
        );

        if (!icons.length) {
            return;
        }

        icons.forEach(function (icon) {

            icon.addEventListener("mouseenter", function () {

                // Remove active state from other icons
                icons.forEach(function (item) {
                    item.classList.remove("active");
                });

                // Activate current icon
                icon.classList.add("active");

                // Find submenu belonging to this module
                const menuItems =
                    sideMenu.querySelector(".side-menu-items");

                if (menuItems) {
                    menuItems.classList.add("menu-hover-open");
                }
            });

        });

        sideMenu.addEventListener("mouseleave", function () {

            const menuItems =
                sideMenu.querySelector(".side-menu-items");

            if (menuItems) {
                menuItems.classList.remove("menu-hover-open");
            }

        });

    }


    // DataValue creates the side menu dynamically,
    // so wait for it to exist.
    function waitForSideMenu() {

        if (document.querySelector(".side-menu")) {
            setupSideMenuHover();
            return;
        }

        setTimeout(waitForSideMenu, 500);
    }


    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", waitForSideMenu);
    } else {
        waitForSideMenu();
    }

})();