document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu li");

    menuItems.forEach((item) => {
        item.addEventListener("click", () => {
            // Remove 'active' class from all menu items
            menuItems.forEach((menuItem) => menuItem.classList.remove("active"));

            // Add 'active' class to the clicked item
            item.classList.add("active");
        });
    });
});