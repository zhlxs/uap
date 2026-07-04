const panel = document.querySelector(".panel-card");

if (panel) {
    panel.addEventListener("mousemove", (event) => {
        const rect = panel.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        panel.style.transform = `perspective(900px) rotateX(${y * -2}deg) rotateY(${x * 2}deg)`;
    });

    panel.addEventListener("mouseleave", () => {
        panel.style.transform = "";
    });
}
