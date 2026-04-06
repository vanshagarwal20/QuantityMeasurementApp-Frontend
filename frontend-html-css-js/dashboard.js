function getCurrentUser() {
    return JSON.parse(localStorage.getItem("qmaUser") || "null");
}

let currentUser = getCurrentUser();

const unitSets = {
    length: {
        units: {
            Kilometer: 1000,
            Meter: 1,
            Centimeter: 0.01,
            Millimeter: 0.001,
            Mile: 1609.34,
            Yard: 0.9144,
            Foot: 0.3048,
            Inch: 0.0254
        },
        convert: (value, from, to) => value * (unitSets.length.units[from] / unitSets.length.units[to])
    },
    weight: {
        units: {
            Kilogram: 1,
            Gram: 0.001,
            Pound: 0.453592,
            Ounce: 0.0283495
        },
        convert: (value, from, to) => value * (unitSets.weight.units[from] / unitSets.weight.units[to])
    },
    temperature: {
        units: {
            Celsius: "C",
            Fahrenheit: "F",
            Kelvin: "K"
        },
        convert: (value, from, to) => {
            let celsius;
            if (from === "Celsius") celsius = value;
            if (from === "Fahrenheit") celsius = (value - 32) * (5 / 9);
            if (from === "Kelvin") celsius = value - 273.15;

            if (to === "Celsius") {
                return celsius;
            }
            if (to === "Fahrenheit") return celsius * (9 / 5) + 32;
            return celsius + 273.15;
        }
    },
    volume: {
        units: {
            Liter: 1,
            Milliliter: 0.001,
            Gallon: 3.78541,
            CubicMeter: 1000
        },
        convert: (value, from, to) => value * (unitSets.volume.units[from] / unitSets.volume.units[to])
    }
};

const ui = {
    typeCards: document.querySelectorAll(".type-card"),
    actionTabs: document.querySelectorAll(".action-tab"),
    sections: {
        comparison: document.getElementById("comparisonSection"),
        conversion: document.getElementById("conversionSection"),
        arithmetic: document.getElementById("arithmeticSection"),
        history: document.getElementById("historySection")
    },

    comparisonFromValue: document.getElementById("comparisonFromValue"),
    comparisonFromUnit: document.getElementById("comparisonFromUnit"),
    comparisonToUnit: document.getElementById("comparisonToUnit"),
    comparisonToValue: document.getElementById("comparisonToValue"),

    conversionInput: document.getElementById("conversionInput"),
    conversionFromUnit: document.getElementById("conversionFromUnit"),
    conversionToUnit: document.getElementById("conversionToUnit"),
    conversionResult: document.getElementById("conversionResult"),

    arithValue1: document.getElementById("arithValue1"),
    arithUnit1: document.getElementById("arithUnit1"),
    arithValue2: document.getElementById("arithValue2"),
    arithUnit2: document.getElementById("arithUnit2"),
    arithOperator: document.getElementById("arithOperator"),
    arithResultUnit: document.getElementById("arithResultUnit"),
    arithResult: document.getElementById("arithResult"),

    userName: document.getElementById("userName"),
    loginBtn: document.getElementById("loginBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    historyTab: document.getElementById("historyTab"),
    goToAuthBtn: document.getElementById("goToAuthBtn"),
    historyList: document.getElementById("historyList"),
    historyEmptyMessage: document.getElementById("historyEmptyMessage"),
    historyLoginHint: document.getElementById("historyLoginHint")
};

let currentType = "length";
let currentAction = "comparison";
let lastHistorySignature = "";

const HISTORY_STORAGE_KEY = "qmaOperationHistory";

function getUserHistoryMap() {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "{}");
}

function saveUserHistoryMap(map) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(map));
}

function addHistoryEntry(action, expression) {
    if (!currentUser || !currentUser.email) {
        return;
    }

    const signature = `${action}:${expression}`;
    if (signature === lastHistorySignature) {
        return;
    }

    const map = getUserHistoryMap();
    const userKey = currentUser.email;
    const records = map[userKey] || [];

    records.unshift({
        action,
        expression,
        timestamp: new Date().toISOString()
    });

    map[userKey] = records.slice(0, 50);
    saveUserHistoryMap(map);
    lastHistorySignature = signature;

    if (currentAction === "history") {
        renderHistory();
    }
}

function renderHistory() {
    const isLoggedIn = Boolean(currentUser && currentUser.email);

    ui.historyLoginHint.classList.toggle("hidden", isLoggedIn);
    ui.historyList.classList.toggle("hidden", !isLoggedIn);

    if (!isLoggedIn) {
        ui.historyList.innerHTML = "";
        ui.historyEmptyMessage.classList.add("hidden");
        return;
    }

    const map = getUserHistoryMap();
    const records = map[currentUser.email] || [];

    if (!records.length) {
        ui.historyList.innerHTML = "";
        ui.historyEmptyMessage.classList.remove("hidden");
        return;
    }

    ui.historyEmptyMessage.classList.add("hidden");
    ui.historyList.innerHTML = records.map((entry) => {
        const time = new Date(entry.timestamp).toLocaleString();
        return `
            <li class="history-item">
                <p class="history-meta">${entry.action} | ${time}</p>
                <p class="history-expression">${entry.expression}</p>
            </li>
        `;
    }).join("");
}

function syncAuthUI() {
    const isLoggedIn = Boolean(currentUser);
    ui.userName.textContent = isLoggedIn ? `Hi, ${currentUser.name || currentUser.email}!` : "Guest Mode";
    ui.loginBtn.classList.toggle("hidden", isLoggedIn);
    ui.logoutBtn.classList.toggle("hidden", !isLoggedIn);
    ui.historyTab.classList.toggle("hidden", !isLoggedIn);

    if (!isLoggedIn && currentAction === "history") {
        currentAction = "comparison";
        showActionSection(currentAction);

        ui.actionTabs.forEach((item) => {
            const isActive = item.dataset.action === currentAction;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", isActive ? "true" : "false");
        });
    }
}

function formatNumber(value) {
    if (!Number.isFinite(value)) return "0";
    return Number(value.toFixed(6)).toString();
}

function fillSelect(select, units) {
    const names = Object.keys(units);
    select.innerHTML = names.map((name) => `<option value="${name}">${name}</option>`).join("");
}

function setDefaultOptions() {
    const unitNames = Object.keys(unitSets[currentType].units);

    [ui.comparisonFromUnit, ui.comparisonToUnit, ui.conversionFromUnit, ui.conversionToUnit, ui.arithUnit1, ui.arithUnit2, ui.arithResultUnit]
        .forEach((select) => fillSelect(select, unitSets[currentType].units));

    ui.comparisonFromUnit.value = unitNames[0];
    ui.comparisonToUnit.value = unitNames[Math.min(1, unitNames.length - 1)];

    ui.conversionFromUnit.value = unitNames[0];
    ui.conversionToUnit.value = unitNames[Math.min(1, unitNames.length - 1)];

    ui.arithUnit1.value = unitNames[0];
    ui.arithUnit2.value = unitNames[Math.min(1, unitNames.length - 1)];
    ui.arithResultUnit.value = unitNames[Math.min(1, unitNames.length - 1)];
}

function convertValue(value, from, to) {
    return unitSets[currentType].convert(Number(value), from, to);
}

function updateComparison(shouldRecord = true) {
    const fromValue = Number(ui.comparisonFromValue.value || 0);
    const fromUnit = ui.comparisonFromUnit.value;
    const toUnit = ui.comparisonToUnit.value;
    const converted = convertValue(fromValue, fromUnit, toUnit);
    const result = formatNumber(converted);
    ui.comparisonToValue.textContent = result;

    if (shouldRecord) {
        addHistoryEntry("Comparison", `${formatNumber(fromValue)} ${fromUnit} = ${result} ${toUnit}`);
    }
}

function updateConversion(shouldRecord = true) {
    const value = Number(ui.conversionInput.value || 0);
    const fromUnit = ui.conversionFromUnit.value;
    const toUnit = ui.conversionToUnit.value;
    const converted = convertValue(value, fromUnit, toUnit);
    const result = formatNumber(converted);
    ui.conversionResult.textContent = result;

    if (shouldRecord) {
        addHistoryEntry("Conversion", `${formatNumber(value)} ${fromUnit} = ${result} ${toUnit}`);
    }
}

function updateArithmetic(shouldRecord = true) {
    const v1 = Number(ui.arithValue1.value || 0);
    const v2 = Number(ui.arithValue2.value || 0);
    const unit1 = ui.arithUnit1.value;
    const unit2 = ui.arithUnit2.value;
    const resultUnit = ui.arithResultUnit.value;
    const operator = ui.arithOperator.value;

    const v1InResultUnit = convertValue(v1, unit1, resultUnit);
    const v2InResultUnit = convertValue(v2, unit2, resultUnit);

    const result = operator === "+"
        ? v1InResultUnit + v2InResultUnit
        : v1InResultUnit - v2InResultUnit;

    const formattedResult = formatNumber(result);
    ui.arithResult.textContent = formattedResult;

    if (shouldRecord) {
        addHistoryEntry("Arithmetic", `${formatNumber(v1)} ${unit1} ${operator} ${formatNumber(v2)} ${unit2} = ${formattedResult} ${resultUnit}`);
    }
}

function showActionSection(action) {
    Object.entries(ui.sections).forEach(([name, section]) => {
        section.classList.toggle("hidden", name !== action);
    });
}

function refreshAll(shouldRecord = false) {
    updateComparison(shouldRecord);
    updateConversion(shouldRecord);
    updateArithmetic(shouldRecord);
}

ui.typeCards.forEach((card) => {
    card.addEventListener("click", () => {
        currentType = card.dataset.type;

        ui.typeCards.forEach((item) => {
            item.classList.toggle("active", item === card);
            item.setAttribute("aria-selected", item === card ? "true" : "false");
        });

        setDefaultOptions();
        refreshAll(false);
    });
});

ui.actionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        currentAction = tab.dataset.action;

        ui.actionTabs.forEach((item) => {
            item.classList.toggle("active", item === tab);
            item.setAttribute("aria-selected", item === tab ? "true" : "false");
        });

        showActionSection(currentAction);

        if (currentAction === "history") {
            renderHistory();
        }
    });
});

[
    ui.comparisonFromValue,
    ui.comparisonFromUnit,
    ui.comparisonToUnit
].forEach((el) => el.addEventListener("input", updateComparison));

[
    ui.conversionInput,
    ui.conversionFromUnit,
    ui.conversionToUnit
].forEach((el) => el.addEventListener("input", updateConversion));

[
    ui.arithValue1,
    ui.arithUnit1,
    ui.arithValue2,
    ui.arithUnit2,
    ui.arithOperator,
    ui.arithResultUnit
].forEach((el) => el.addEventListener("input", updateArithmetic));

ui.loginBtn.addEventListener("click", () => {
    window.location.href = "auth.html";
});

ui.goToAuthBtn.addEventListener("click", () => {
    window.location.href = "auth.html";
});

ui.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("qmaUser");
    currentUser = null;

    if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
    }

    syncAuthUI();

    if (currentAction === "history") {
        renderHistory();
    }
});

setDefaultOptions();
showActionSection(currentAction);
refreshAll(false);
syncAuthUI();