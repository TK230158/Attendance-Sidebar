// ==UserScript==
// @name         LMS: Attendance Sidebar
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add attendance sidebar.
// @author       TK230158
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lms-tokyo.iput.ac.jp
// @match        https://lms-tokyo.iput.ac.jp/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    if (!document.querySelector(".avatars")) return;

    // Add global styles
    function addGlobalStyles() {
        const style = document.createElement("style");
        style.textContent = `
            .custom-attendance-icon-link {
                display: flex; align-items: center; justify-content: center;
                width: 100%; height: 48px; color: rgb(118, 118, 118);
                cursor: pointer; transition: background-color 0.2s ease;
            }
            .custom-attendance-icon-link .icon-svg { transition: transform 0.2s ease-in-out; }
            .custom-attendance-icon-link:hover .icon-svg { transform: scale(1.15); }
            .custom-attendance-icon-link .clipboard-clip {
                transition: fill 0.2s ease-in-out;
            }
            .custom-attendance-icon-link:hover .clipboard-clip {
                fill: #ffffff;
            }
            .loader-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px 20px;
            }
            .loader-dot {
                width: 10px;
                height: 10px;
                margin: 0 4px;
                background-color: #337dbd;
                border-radius: 50%;
                animation: bounce 1.4s infinite ease-in-out both;
            }
            .loader-dot:nth-child(1) { animation-delay: -0.32s; }
            .loader-dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
            }
            #attendance-slide-panel {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #f8f9fa;
            }
            .panel-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px 16px; background: #fff;
                border-bottom: 1px solid #dee2e6;
            }
            .panel-title {
                font-weight: 600; font-size: 16px; color: #495057;
                display: flex; align-items: center; gap: 8px;
            }
            .panel-btn {
                font-size: 13px; border-radius: 4px; padding: 5px 10px;
                border: 1px solid #ced4da; background-color: #f8f9fa;
                cursor: pointer; transition: background-color 0.2s, border-color 0.2s, transform 0.1s ease-out;
                display: inline-flex; align-items: center; gap: 6px;
                color: #495057;
            }
            .panel-btn:hover { background-color: #e9ecef; }
            .panel-btn:disabled { opacity: 0.7; cursor: not-allowed; }
            .panel-btn:active {
                transform: scale(0.97);
            }
            .panel-btn-close { border-color: #f1aeb5; color: #d9534f; }
            .panel-btn-close:hover { background-color: #f8d7da; }

            .panel-btn.active-filter {
                background-color: #d0ebff;
                border-color: #90cff9;
                color: #0d6efd;
            }

            #attendance-panel-content { padding: 8px 16px; }
            .attendance-item {
                background: #fff; border-left: 4px solid #3279b2;
                padding: 12px; margin-bottom: 12px;
                border-radius: 0 4px 4px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .item-row { display: flex; align-items: center; margin-bottom: 6px; }
            .item-row:last-child { margin-bottom: 0; }
            .item-icon { color: #6c757d; width: 20px; text-align: center; margin-right: 8px; }
            .item-text a { color: #0d6efd; text-decoration: none; font-weight: 500; }
            .item-text a:hover { text-decoration: underline; }
            .item-text, .item-text span { font-size: 14px; color: #495057; }
            .submit-attendance-btn {
                background-color: #e7f5ff; border: 1px solid #90cff9; color: #0d6efd;
                border-radius: 4px; padding: 4px 10px; cursor: pointer;
                text-decoration: none; display: inline-block; font-size: 13px;
                transition: background-color 0.2s, transform 0.1s ease-out;
            }
            .submit-attendance-btn:hover { background-color: #d0ebff; }
            .submit-attendance-btn:active {
                transform: scale(0.97);
            }
            #attendance-slide-panel::-webkit-scrollbar,
            #attendance-panel-content::-webkit-scrollbar {
                width: 8px;
            }

            #attendance-slide-panel::-webkit-scrollbar-track,
            #attendance-panel-content::-webkit-scrollbar-track {
                background: transparent;
            }

            #attendance-slide-panel::-webkit-scrollbar-thumb,
            #attendance-panel-content::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }

            #attendance-slide-panel::-webkit-scrollbar-thumb:hover,
            #attendance-panel-content::-webkit-scrollbar-thumb:hover {
                background-color: rgba(0, 0, 0, 0.4);
            }
        `;
        document.head.appendChild(style);
    }
    addGlobalStyles();

    // Define slide panel HTML structure
    const slidePanel = document.createElement("div");
    slidePanel.id = "attendance-slide-panel";
    slidePanel.style = `
        position: fixed; top: 0; right: -30vw; width: 30vw; height: 100%;
        border-left: 1px solid #ccc; box-shadow: -2px 0 8px rgba(0,0,0,0.1);
        z-index: 10000; overflow-y: auto; transition: right 0.3s ease;
        display: flex; flex-direction: column;
    `;
    slidePanel.innerHTML = `
        <div class="panel-header">
            <span class="panel-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                Attendance
            </span>
            <div>
                <button id="toggle-filter-btn" class="panel-btn"></button>
                <button id="reload-attendance-panel" class="panel-btn" style="margin-left: 8px;">🔄️</button>
                <button id="close-attendance-panel" class="panel-btn panel-btn-close" style="margin-left: 8px;">✕</button>
            </div>
        </div>
        <button id="back-to-list" style="display:none; margin: 10px 16px; padding: 6px 10px;" class="panel-btn">◀ Back</button>
        <div id="attendance-panel-content" style="flex-grow: 1; overflow-y: auto;"></div>
        <div id="attendance-iframe-container" style="display:none; flex-grow: 1;"></div>
    `;
    document.body.appendChild(slidePanel);

    const panel = document.getElementById("attendance-panel-content");
    const iframeContainer = document.getElementById("attendance-iframe-container");
    const backToListBtn = document.getElementById("back-to-list");
    const toggleFilterBtn = document.getElementById("toggle-filter-btn");

    document.getElementById("close-attendance-panel").onclick = () => { slidePanel.style.right = "-400px"; };
    document.getElementById("reload-attendance-panel").onclick = () => fetchAttendance(true);
    backToListBtn.onclick = () => restorePanel();

    function updateFilterButtonState() {
        const shouldHide = localStorage.getItem('hidePastLectures') === 'true';
        if (shouldHide) {
            toggleFilterBtn.textContent = 'Show All';
            toggleFilterBtn.classList.add('active-filter');
        } else {
            toggleFilterBtn.textContent = 'Hide Submitted';
            toggleFilterBtn.classList.remove('active-filter');
        }
    }

    toggleFilterBtn.addEventListener('click', () => {
        let shouldHide = localStorage.getItem('hidePastLectures') === 'true';
        localStorage.setItem('hidePastLectures', !shouldHide);
        updateFilterButtonState();
        fetchAttendance(true);
    });

    updateFilterButtonState();

    const loaderHTML = `<div class="loader-container"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div>`;

    const tryAddSidebarItem = () => {
        const menu = document.querySelector(".snap-sidebar-menu-content");
        if (!menu) return setTimeout(tryAddSidebarItem, 500);

        const newMenuItem = document.createElement("div");
        newMenuItem.className = "snap-sidebar-menu-item custom-menu-item";
        const link = document.createElement("a");
        link.href = "#";
        link.title = "Show Attendance Info";
        link.className = "custom-attendance-icon-link";
        link.innerHTML = `
            <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect class="clipboard-clip" x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                <path d="m9 14 2 2 4-4"></path>
            </svg>`;
        link.onclick = (e) => { e.preventDefault(); slidePanel.style.right = "0"; fetchAttendance(); };
        newMenuItem.appendChild(link);
        menu.appendChild(newMenuItem);
    };
    tryAddSidebarItem();

    async function fetchAttendance(forceRefresh = false) {
        panel.style.display = "block";
        iframeContainer.style.display = "none";
        backToListBtn.style.display = "none";

        const shouldHide = localStorage.getItem('hidePastLectures') === 'true';
        const CACHE_KEY = "attendance_cache_" + new Date().toLocaleDateString();
        const cacheKeyWithFilter = `${CACHE_KEY}_${shouldHide}`;

        if (!forceRefresh) {
            const cached = sessionStorage.getItem(cacheKeyWithFilter);
            if (cached) {
                panel.innerHTML = cached;
                bindIframeLinks();
                return;
            }
        }
        panel.innerHTML = loaderHTML;
        try {
            const response = await fetch("https://lms-tokyo.iput.ac.jp/calendar/view.php?view=day", { credentials: "include" });
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");
            const attendanceEvents = doc.querySelectorAll('[data-event-eventtype="attendance"]');

            const now = new Date();

    const results = await Promise.all([...attendanceEvents].map(async (event) => {
        try {
            const eventId = event.getAttribute('data-event-id');
            if (!eventId) return null;

            const statusKey = `attendance_status_${eventId}`;
            if (!forceRefresh) {
                const cached = localStorage.getItem(statusKey);
                if (cached) return cached;
            }

            const link = event.querySelector("a.card-link");
            if (!link) return null;

            const courseInfo = event.querySelector("i.fa-graduation-cap")?.closest(".row")?.querySelector("a");
            const courseTitle = courseInfo?.textContent.trim() ?? "No course name";
            const courseUrl = courseInfo?.href ?? "#";
            const titleHTML = `<a href="${courseUrl}" rel="noopener noreferrer">${courseTitle}</a>`;

            let startTime = "Unknown", endTime = "Unknown";
            const timeRow = [...event.querySelectorAll(".row, .event-name")].find(row =>
                row.textContent.match(/\d{1,2}:\d{2}/)
            );
            if (timeRow) {
                const matches = [...timeRow.textContent.matchAll(/\d{1,2}:\d{2}/g)];
                if (matches.length >= 2) {
                    startTime = matches[0][0];
                    endTime = matches[1][0];
                }
            }

            if (shouldHide && endTime !== "Unknown") {
                const [endHours, endMinutes] = endTime.split(':').map(Number);
                const lectureEndTime = new Date();
                lectureEndTime.setHours(endHours, endMinutes, 0, 0);
                if (Date.now() > lectureEndTime.getTime()) return null;
            }

            const attendancePage = await fetch(link.href, { credentials: "include" });
            const attendanceHtml = await attendancePage.text();
            const attendanceDoc = parser.parseFromString(attendanceHtml, "text/html");
            const statusCells = attendanceDoc.querySelectorAll("tr .statuscol.cell.c2");

            let statusResult = `<span style='color: #dc3545;'>⚠️ Status Unknown</span>`;
            let foundLink = null;
            for (const cell of statusCells) {
                const registerLink = cell.querySelector("a");
                if (cell.textContent.trim().includes("出欠を送信する") && registerLink) {
                    foundLink = registerLink.href;
                    statusResult = `<button class='submit-attendance-btn' data-url='${foundLink}'>Submit</button>`;
                    break;
                }
            }
            if (!foundLink && attendanceDoc.querySelector('td.statuscol:not(:empty)')) {
                statusResult = `<span style='color: #ccc;'>Submitted or Expired</span>`;
            } else if (!foundLink) {
                statusResult = `<span>No submission link</span>`;
            }

            const resultHtml = `
                <div class="attendance-item">
                    <div class="item-row">
                        <i class="fa fa-graduation-cap item-icon"></i>
                        <span class="item-text">${titleHTML}</span>
                    </div>
                    <div class="item-row">
                        <i class="fa fa-clock-o item-icon"></i>
                        <span class="item-text">Time: ${startTime} - ${endTime}</span>
                    </div>
                    <div class="item-row">
                        <i class="fa fa-link item-icon"></i>
                        <span class="item-text">${statusResult}</span>
                    </div>
                </div>`;

            localStorage.setItem(statusKey, resultHtml);
            return resultHtml;

        } catch (e) {
            return `<div class="attendance-item" style="border-color: #dc3545;">Fetch Error: ${e.message}</div>`;
        }
    }));

            let finalHtml = results.filter(Boolean).join("");
            if (!finalHtml) {
                const messages = [
                    `<div style="padding: 20px; text-align: center; color: #6c757d;">
            <div style="font-size: 48px;">☀️</div><br>
            Nothing new.<br>
            Carry on.
        </div>`,
                    `<div style="padding: 20px; text-align: center; color: #6c757d;">
            <div style="font-size: 48px;">🍵</div><br>
            You're all caught up!<br>
            Nice work!
        </div>`,
                    `<div style="padding: 20px; text-align: center; color: #6c757d;">
            <div style="font-size: 48px;">🎉</div><br>
            Ta-da!<br>
            You're up to date.
        </div>`,
                    `<div style="padding: 20px; text-align: center; color: #6c757d;">
            <div style="font-size: 48px;">🐴</div><br>
            All attendance submitted!<br>
            Here's a pony.
        </div>`
                ];
                const randomIndex = Math.floor(Math.random() * messages.length);
                finalHtml = messages[randomIndex];
            }


            panel.innerHTML = finalHtml;
            sessionStorage.setItem(cacheKeyWithFilter, finalHtml);
            bindIframeLinks();
        } catch (e) { panel.innerHTML = `<div class="attendance-item" style="border-color: #dc3545;">Failed to fetch data: ${e.message}</div>`; }
    }

    function bindIframeLinks() {
        document.querySelectorAll(".submit-attendance-btn").forEach(btn => {
            btn.onclick = () => {
                const url = btn.getAttribute("data-url");
                panel.style.display = "none";
                iframeContainer.style.display = "block";
                iframeContainer.innerHTML = `<iframe src='${url}' style='width:100%; height:100%; border:none;'></iframe>`;
                backToListBtn.style.display = "block";
                const iframe = iframeContainer.querySelector("iframe");
                iframe.onload = () => {
                    try {
                        const currentURL = iframe.contentWindow.location.href;
                        const isAllowed = /\/mod\/attendance\/|\/course\/view\.php\?id=\d+/.test(currentURL);
                        if (!isAllowed) restorePanel();
                    } catch (e) {
                        restorePanel(); // Go back on error too
                    }
                };
            };
        });
    }

    function restorePanel() {
        iframeContainer.innerHTML = ""; iframeContainer.style.display = "none";
        backToListBtn.style.display = "none"; panel.style.display = "block";
        panel.innerHTML = loaderHTML;
        fetchAttendance(true);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            const panel = document.getElementById("attendance-slide-panel");
            if (panel && panel.style.right === "0px") {
                panel.style.right = "-400px";
            }
        }
        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.shiftKey && event.key === 'A') {
                const slidePanel = document.getElementById("attendance-slide-panel");
                if (slidePanel) {
                    slidePanel.style.right = "0";
                }
            }
            if (event.ctrlKey && event.shiftKey && event.key === 'A') {
                const slidePanel = document.getElementById("attendance-slide-panel");
                if (slidePanel) {
                    slidePanel.style.right = "0";
                }
            }

            if (event.shiftKey && event.key === 'R') {
                const reloadButton = document.getElementById("reload-attendance-panel");
                if (reloadButton) {
                    reloadButton.click();
                }
            }
        });
    });

    window.addEventListener("load", () => fetchAttendance());
})();