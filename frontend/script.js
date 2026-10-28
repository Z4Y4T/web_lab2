const form = document.querySelector("#point-form");
const resultsBody = document.querySelector("#results-body");

const API_BASE_URL = window.location.port === "8000" ? "http://localhost:8080" : "";

form.addEventListener("submit", handleSubmit);

loadResults();

async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(form);

    const xRaw = formData.get("x");
    const yRaw = formData.get("y");
    const rRaw = formData.get("r");

    const validation = validateInput(xRaw, yRaw, rRaw);

    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    const { x, y, r } = validation.data;

    const params = new URLSearchParams({
        x: String(x),
        y: String(y),
        r: String(r),
    });

    const url = `${API_BASE_URL}/api/check?${params.toString()}`;

    try {
        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message ?? "Ошибка сервера.");
        }

        addResultToTable(data, true);
    } catch (error) {
        console.error(error);

        alert(`Не удалось выполнить запрос: ${error.message}`);
    }
}

async function loadResults() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/results`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const results = await response.json();

        if (results.length === 0) {
            return;
        }

        resultsBody.replaceChildren();

        for (const result of results) {
            addResultToTable(result, false);
        }
    } catch (error) {
        console.error("Не удалось загрузить историю:", error);
    }
}

function validateInput(xRaw, yRaw, rRaw) {
    if (xRaw === null) {
        return {
            valid: false,
            message: "Выберите X.",
        };
    }

    if (yRaw === null || yRaw.trim() === "") {
        return {
            valid: false,
            message: "Введите Y.",
        };
    }

    if (rRaw === null || rRaw.trim() === "") {
        return {
            valid: false,
            message: "Введите R.",
        };
    }

    const x = Number(xRaw);
    const y = Number(yRaw);
    const r = Number(rRaw);

    if (!Number.isFinite(y)) {
        return {
            valid: false,
            message: "Y должен быть числом.",
        };
    }

    if (!Number.isFinite(r)) {
        return {
            valid: false,
            message: "R должен быть числом.",
        };
    }

    const allowedX = [-5, -4, -3, -2, -1, 0, 1, 2, 3];

    if (!allowedX.includes(x)) {
        return {
            valid: false,
            message: "Недопустимое значение X.",
        };
    }

    if (y < -3 || y > 3) {
        return {
            valid: false,
            message: "Y должен быть в диапазоне [-3; 3].",
        };
    }

    if (r < 1 || r > 4) {
        return {
            valid: false,
            message: "R должен быть в диапазоне [1; 4].",
        };
    }

    return {
        valid: true,

        data: {
            x,
            y,
            r,
        },
    };
}

function addResultToTable(result, addToTop = true) {
    const emptyRow = resultsBody.querySelector(".empty-row");

    if (emptyRow !== null) {
        emptyRow.remove();
    }

    const row = document.createElement("tr");

    for (const value of [result.x, result.y, result.r]) {
        const cell = document.createElement("td");

        cell.textContent = value;

        row.append(cell);
    }

    const hitCell = document.createElement("td");

    hitCell.textContent = result.hit ? "Попал" : "Не попал";

    hitCell.classList.add(result.hit ? "result-hit" : "result-miss");

    row.append(hitCell);

    const timeCell = document.createElement("td");

    timeCell.textContent = result.currentTime;

    row.append(timeCell);

    const executionCell = document.createElement("td");

    const executionMicroseconds = result.executionTimeNs / 1000;

    executionCell.textContent = `${executionMicroseconds.toFixed(2)} µs`;

    row.append(executionCell);

    if (addToTop) {
        resultsBody.prepend(row);
    } else {
        resultsBody.append(row);
    }
}
