const form = document.querySelector("#point-form");
const resultsBody = document.querySelector("#results-body");
const pointsLayer = document.querySelector("#points-layer");
const pointCount = document.querySelector("#point-count");
const requestStatus = document.querySelector("#request-status");
const submitButton = document.querySelector("#submit-button");

const API_BASE_URL = window.location.port === "8000" ? "http://localhost:8080" : "";

const SVG_NS = "http://www.w3.org/2000/svg";

const GRAPH_CENTER = 210;
const GRAPH_UNIT = 120;
const GRAPH_MIN = 48;
const GRAPH_MAX = 372;

let historyResults = [];

form.addEventListener("submit", handleSubmit);

loadResults();

async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(form);

    const validation = validateInput(formData.get("x"), formData.get("y"), formData.get("r"));

    if (!validation.valid) {
        setStatus(validation.message, "error");
        return;
    }

    const { x, y, r } = validation.data;

    const params = new URLSearchParams({
        x: String(x),
        y: String(y),
        r: String(r),
    });

    setLoading(true);
    setStatus("Отправляю запрос на сервер…", "loading");

    try {
        const response = await fetch(`${API_BASE_URL}/api/check?${params.toString()}`);

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(data?.message ?? `HTTP ${response.status}`);
        }

        if (data === null) {
            throw new Error("Сервер вернул неожиданный формат ответа.");
        }

        historyResults.unshift(data);

        addResultToTable(data, true);
        renderGraphPoints(historyResults);

        setStatus(
            data.hit ? "Точка попала в область" : "Точка не попала в область",
            data.hit ? "success" : "error",
        );
    } catch (error) {
        console.error(error);

        setStatus(error.message, "error");
    } finally {
        setLoading(false);
    }
}

async function loadResults() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/results`);

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(data?.message ?? `HTTP ${response.status}`);
        }

        historyResults = Array.isArray(data) ? data : [];

        renderResultsTable(historyResults);
        renderGraphPoints(historyResults);
    } catch (error) {
        console.error("Не удалось загрузить историю:", error);

        setStatus("История пока недоступна", "error");
    }
}

async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
        return null;
    }

    return response.json();
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

    const y = Number(yRaw.replace(",", "."));

    const r = Number(rRaw.replace(",", "."));

    const allowedX = [-5, -4, -3, -2, -1, 0, 1, 2, 3];

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

function renderResultsTable(results) {
    resultsBody.replaceChildren();

    if (results.length === 0) {
        const row = document.createElement("tr");

        row.className = "empty-row";

        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "Пока нет результатов";

        row.append(cell);
        resultsBody.append(row);

        return;
    }

    for (const result of results) {
        addResultToTable(result, false);
    }
}

function addResultToTable(result, addToTop) {
    const emptyRow = resultsBody.querySelector(".empty-row");

    if (emptyRow !== null) {
        emptyRow.remove();
    }

    const row = document.createElement("tr");

    if (addToTop) {
        row.classList.add("new-result");
    }

    for (const value of [result.x, result.y, result.r]) {
        const cell = document.createElement("td");

        cell.textContent = value;

        row.append(cell);
    }

    const hitCell = document.createElement("td");

    const badge = document.createElement("span");

    badge.className = `result-badge ${result.hit ? "result-hit" : "result-miss"}`;

    badge.textContent = result.hit ? "Попал" : "Не попал";

    hitCell.append(badge);
    row.append(hitCell);

    const timeCell = document.createElement("td");

    timeCell.textContent = result.currentTime;

    row.append(timeCell);

    const executionCell = document.createElement("td");

    executionCell.textContent = `${(result.executionTimeNs / 1000).toFixed(2)} мс`;

    row.append(executionCell);

    if (addToTop) {
        resultsBody.prepend(row);
    } else {
        resultsBody.append(row);
    }
}

function renderGraphPoints(results) {
    pointsLayer.replaceChildren();

    const orderedResults = [...results].reverse();

    orderedResults.forEach((result, index) => {
        const isCurrent = index === orderedResults.length - 1;

        pointsLayer.append(createGraphPoint(result, isCurrent));
    });

    pointCount.textContent = formatPointCount(results.length);
}

function createGraphPoint(result, isCurrent) {
    const normalizedX = result.x / result.r;

    const normalizedY = result.y / result.r;

    const rawX = GRAPH_CENTER + normalizedX * GRAPH_UNIT;

    const rawY = GRAPH_CENTER - normalizedY * GRAPH_UNIT;

    const outside = rawX < GRAPH_MIN || rawX > GRAPH_MAX || rawY < GRAPH_MIN || rawY > GRAPH_MAX;

    const circle = document.createElementNS(SVG_NS, "circle");

    circle.setAttribute("cx", clamp(rawX, GRAPH_MIN, GRAPH_MAX));

    circle.setAttribute("cy", clamp(rawY, GRAPH_MIN, GRAPH_MAX));

    circle.setAttribute("r", isCurrent ? "7" : "5");

    circle.setAttribute("tabindex", "0");

    circle.classList.add("graph-point", result.hit ? "graph-point-hit" : "graph-point-miss");

    if (isCurrent) {
        circle.classList.add("is-current");
    }

    if (outside) {
        circle.classList.add("graph-point-outside");
    }

    const title = document.createElementNS(SVG_NS, "title");

    const positionNote = outside ? " · за пределами масштаба, показана у края" : "";

    title.textContent =
        `X=${result.x}, ` +
        `Y=${result.y}, ` +
        `R=${result.r} · ` +
        `${result.hit ? "попадание" : "промах"}` +
        positionNote;

    circle.append(title);

    return circle;
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;

    const label = submitButton.querySelector("span");

    label.textContent = isLoading ? "Проверяю…" : "Проверить точку";
}

function setStatus(message, type) {
    requestStatus.textContent = message;

    requestStatus.classList.remove("status-success", "status-error", "status-loading");

    if (type === "success") {
        requestStatus.classList.add("status-success");
    }

    if (type === "error") {
        requestStatus.classList.add("status-error");
    }

    if (type === "loading") {
        requestStatus.classList.add("status-loading");
    }
}

function formatPointCount(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return `${count} точка`;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return `${count} точки`;
    }

    return `${count} точек`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
