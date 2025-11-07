document.addEventListener("DOMContentLoaded", () => {
    // ==========================
    // Авторизация / Регистрация
    // ==========================
    let currentUser = localStorage.getItem("currentUser") || null;
    let isRegisterMode = false;

    const authBtn = document.getElementById("authBtn");
    const authModal = document.getElementById("auth-modal");
    const closeAuth = document.getElementById("close-auth");
    const authForm = document.getElementById("auth-form");
    const switchRegister = document.getElementById("switch-register");
    const authTitle = document.getElementById("auth-title");
    const authSubmit = document.getElementById("auth-submit");

    if (authBtn) {
        if (currentUser) authBtn.textContent = `👤 ${currentUser}`;

        authBtn.addEventListener("click", () => {
            if (currentUser) {
                const logout = confirm(`Вы вошли как "${currentUser}". Выйти из аккаунта?`);
                if (logout) {
                    localStorage.removeItem("currentUser");
                    currentUser = null;
                    authBtn.textContent = "Авторизация";
                    alert("Вы вышли из аккаунта.");
                }
            } else {
                authModal.classList.add("active");
            }
        });
    }

    if (closeAuth) {
        closeAuth.addEventListener("click", () => authModal.classList.remove("active"));
    }

    if (switchRegister) {
        switchRegister.addEventListener("click", (e) => {
            e.preventDefault();
            isRegisterMode = !isRegisterMode;
            authTitle.textContent = isRegisterMode ? "Регистрация" : "Авторизация";
            authSubmit.textContent = isRegisterMode ? "Зарегистрироваться" : "Войти";
            switchRegister.textContent = isRegisterMode ? "Уже есть аккаунт? Войти" : "Зарегистрироваться";
        });
    }

    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("auth-username").value.trim();
            const password = document.getElementById("auth-password").value.trim();

            if (!username || !password) {
                alert("Введите имя и пароль");
                return;
            }

            const endpoint = isRegisterMode ? "/register" : "/login";

            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();
                alert(data.message);

                if (data.success) {
                    currentUser = username;
                    localStorage.setItem("currentUser", username);
                    authBtn.textContent = `👤 ${username}`;
                    authModal.classList.remove("active");
                    authForm.reset();
                    isRegisterMode = false;
                    authTitle.textContent = "Авторизация";
                    authSubmit.textContent = "Войти";
                    switchRegister.textContent = "Зарегистрироваться";
                }
            } catch (err) {
                console.error(err);
                alert("Ошибка соединения с сервером");
            }
        });
    }

    // ==========================
    // Заказ на странице каталога
    // ==========================
    const orderModal = document.getElementById("order-modal");
    const closeOrder = document.getElementById("close-order");
    const orderForm = document.getElementById("order-form");
    const productInput = document.getElementById("order-product");

    const orderButtons = document.querySelectorAll(".btn-order");
    if (orderButtons.length) {
        orderButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!currentUser) {
                    alert("Для оформления заказа необходимо авторизоваться.");
                    authModal.classList.add("active");
                    return;
                }
                const product = btn.getAttribute("data-product");
                if (productInput) productInput.value = product;
                if (orderModal) orderModal.classList.add("active");
            });
        });
    }

    if (closeOrder) {
        closeOrder.addEventListener("click", () => orderModal.classList.remove("active"));
    }

    if (orderForm) {
        orderForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentUser) {
                alert("Вы не авторизованы.");
                return;
            }

            const product = productInput ? productInput.value : "";
            const phone = document.getElementById("order-phone")?.value.trim() || "";
            const address = document.getElementById("order-address")?.value.trim() || "";

            if (!product || !phone || !address) {
                alert("Заполните все поля формы заказа.");
                return;
            }

            try {
                const res = await fetch("/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user: currentUser, product, phone, address }),
                });

                const data = await res.json();
                alert(data.message);

                if (data.success) {
                    orderModal.classList.remove("active");
                    orderForm.reset();
                }
            } catch (err) {
                console.error(err);
                alert("Ошибка при отправке заказа");
            }
        });
    }

    // ==========================
    // Заказ на странице товара
    // ==========================
    const orderBtnProduct = document.getElementById("order-btn");
    const orderModalProduct = document.getElementById("order-modal");
    const closeModal = document.getElementById("close-modal");
    const orderFormProduct = document.getElementById("order-form");
    const productNameInput = document.getElementById("product-name");

    if (orderBtnProduct) {
        orderBtnProduct.addEventListener("click", (e) => {
            e.preventDefault();

            if (!currentUser) {
                alert("Для оформления заказа необходимо авторизоваться.");
                authModal.classList.add("active");
                return;
            }

            orderModalProduct.classList.add("active");
        });
    }

    if (closeModal) {
        closeModal.addEventListener("click", () => orderModalProduct.classList.remove("active"));
    }

    if (orderFormProduct) {
        orderFormProduct.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!currentUser) {
                alert("Вы не авторизованы.");
                return;
            }

            const product = productNameInput?.value || "";
            const phone = document.getElementById("phone")?.value.trim() || "";
            const address = document.getElementById("address")?.value.trim() || "";

            if (!product || !phone || !address) {
                alert("Заполните все поля формы заказа.");
                return;
            }

            try {
                // Проверка Google reCAPTCHA
                const recaptchaResponse = window.grecaptcha ? grecaptcha.getResponse() : null;
                if (window.grecaptcha && !recaptchaResponse) {
                    alert("Пожалуйста, подтвердите, что вы не робот.");
                    return;
                }

                const res = await fetch("/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user: currentUser, product, phone, address }),
                });

                const data = await res.json();
                alert(data.message);

                if (data.success) {
                    if (window.grecaptcha) grecaptcha.reset();
                    orderModalProduct.classList.remove("active");
                    orderFormProduct.reset();
                }
            } catch (err) {
                console.error(err);
                alert("Ошибка при оформлении заказа");
            }
        });
    }

    // ==========================
    // Закрытие модалок по клику вне
    // ==========================
    window.addEventListener("click", (e) => {
        if (e.target === authModal) authModal.classList.remove("active");
        if (e.target === orderModal) orderModal.classList.remove("active");
        if (e.target === orderModalProduct) orderModalProduct.classList.remove("active");
    });
});
