// Auth check - redirect if not logged in
function checkAuth() {
    const user = JSON.parse(localStorage.getItem("qmaUser") || "null");
    if (!user) {
        window.location.href = "auth.html";
        return null;
    }
    return user;
}

const currentUser = checkAuth();

// Display user name
if (currentUser) {
    document.getElementById("userName").textContent = `Hi, ${currentUser.name}!`;
}

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

            if (to === "Celsius") return celsius;
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
        arithmetic: document.getElementById("arithmeticSection")
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
    arithResult: document.getElementById("arithResult")
};

let currentType = "length";
let currentAction = "comparison";

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

function updateComparison() {
    const fromValue = Number(ui.comparisonFromValue.value || 0);
    const converted = convertValue(fromValue, ui.comparisonFromUnit.value, ui.comparisonToUnit.value);
    ui.comparisonToValue.textContent = formatNumber(converted);
}

function updateConversion() {
    const value = Number(ui.conversionInput.value || 0);
    const converted = convertValue(value, ui.conversionFromUnit.value, ui.conversionToUnit.value);
    ui.conversionResult.textContent = formatNumber(converted);
}

function updateArithmetic() {
    const v1 = Number(ui.arithValue1.value || 0);
    const v2 = Number(ui.arithValue2.value || 0);

    const v1InResultUnit = convertValue(v1, ui.arithUnit1.value, ui.arithResultUnit.value);
    const v2InResultUnit = convertValue(v2, ui.arithUnit2.value, ui.arithResultUnit.value);

    const result = ui.arithOperator.value === "+"
        ? v1InResultUnit + v2InResultUnit
        : v1InResultUnit - v2InResultUnit;

    ui.arithResult.textContent = formatNumber(result);
}

function showActionSection(action) {
    Object.entries(ui.sections).forEach(([name, section]) => {
        section.classList.toggle("hidden", name !== action);
    });
}

function refreshAll() {
    updateComparison();
    updateConversion();
    updateArithmetic();
}

ui.typeCards.forEach((card) => {
    card.addEventListener("click", () => {
        currentType = card.dataset.type;

        ui.typeCards.forEach((item) => {
            item.classList.toggle("active", item === card);
            item.setAttribute("aria-selected", item === card ? "true" : "false");
        });

        setDefaultOptions();
        refreshAll();
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

// Logout handler
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("qmaUser");

    if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
    }

    window.location.href = "auth.html";
});

setDefaultOptions();
showActionSection(currentAction);
refreshAll();