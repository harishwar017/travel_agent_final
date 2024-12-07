let currentSession = '';
let sessions = {};
let sessionOrder = [];

// Initialize application
window.onload = () => {
    initializeApp();
};

// Initialize the application
function initializeApp() {
    fetchSessions();
    initializeChatEvents();
    document.addEventListener("click", closeAllDropdowns);
}

// Fetch sessions from the backend
function fetchSessions() {
    fetch("/list_sessions")
        .then(response => response.json())
        .then(data => {
            sessions = {};
            sessionOrder = [];

            data.sessions.forEach(sessionName => {
                sessions[sessionName] = { messages: [] };
                sessionOrder.push(sessionName);
            });

            updateSessionList();

            const lastUsedSession = localStorage.getItem('lastUsedSession');
            if (lastUsedSession && sessions[lastUsedSession]) {
                switchSession(lastUsedSession);
            }
        })
        .catch(error => {
            console.error('Error fetching sessions:', error);
            alert("Failed to load sessions. Please try again later.");
        });
}

// Update the session list in the UI
function updateSessionList() {
    const sessionList = document.getElementById("sessionList");
    sessionList.innerHTML = '';

    if (sessionOrder.length === 0) {
        sessionList.innerHTML = '<li class="empty-state">No sessions available.</li>';
        return;
    }

    sessionOrder.forEach(session => {
        sessionList.innerHTML += `
            <li class="session-item">
                <span class="session-name">${escapeHtml(session)}</span>
                <button class="dropdown-button" onclick="toggleDropdown(event)">▼</button>
                <div class="dropdown-content">
                    <a href="#" onclick="renameSession('${session}'); event.stopPropagation();">Rename</a>
                    <a href="#" onclick="removeSession('${session}'); event.stopPropagation();">Delete</a>
                </div>
            </li>`;
    });
}

// Handle dropdown toggles
function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = event.currentTarget.nextElementSibling;
    closeAllDropdowns();
    dropdown.classList.toggle('show');
}

// Close all dropdown menus
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
}

// Switch between sessions
function switchSession(sessionName) {
    if (currentSession !== sessionName) {
        currentSession = sessionName;
        const chatWindow = document.getElementById("chatWindow");
        chatWindow.innerHTML = '<p class="placeholder-text">Loading messages...</p>';

        fetch(`/load_session/${sessionName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load session");
                }
                return response.json();
            })
            .then(data => {
                chatWindow.innerHTML = '';
                data.messages.forEach(msg => {
                    chatWindow.innerHTML += `
                        <div class="message user">${escapeHtml(msg.user_message)}</div>
                        <div class="message bot">${escapeHtml(msg.bot_response)}</div>`;
                });
                chatWindow.scrollTop = chatWindow.scrollHeight;
            })
            .catch(error => {
                console.error('Error loading session:', error);
                chatWindow.innerHTML = '<div class="message bot error">Could not load session.</div>';
            });

        localStorage.setItem('lastUsedSession', sessionName);
    }
}

// Add a new session
function addSession(sessionName) {
    sessionName = sessionName?.trim();
    if (!sessionName || sessions[sessionName]) {
        alert("Invalid or duplicate session name.");
        return;
    }

    sessions[sessionName] = { messages: [] };
    sessionOrder.unshift(sessionName);
    updateSessionList();

    fetch("/save_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_name: sessionName }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to save session");
            }
            switchSession(sessionName);
            localStorage.setItem('lastUsedSession', sessionName);
        })
        .catch(error => {
            console.error('Error saving session:', error);
            alert("Failed to save the session. Please try again.");
        });
}

// Remove a session
function removeSession(sessionName) {
    if (confirm(`Are you sure you want to delete the session "${sessionName}"?`)) {
        fetch(`/delete_session/${sessionName}`, { method: "DELETE" })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to delete session");
                }
                delete sessions[sessionName];
                sessionOrder = sessionOrder.filter(s => s !== sessionName);
                updateSessionList();
                if (currentSession === sessionName) {
                    currentSession = '';
                    document.getElementById("chatWindow").innerHTML = '';
                    localStorage.removeItem('lastUsedSession');
                }
            })
            .catch(error => {
                console.error('Error deleting session:', error);
                alert("Failed to delete the session. Please try again.");
            });
    }
}

// Rename a session
function renameSession(oldName) {
    const newName = prompt("Enter new session name:", oldName)?.trim();
    if (!newName || newName === oldName || sessions[newName]) {
        alert("Invalid or duplicate session name.");
        return;
    }

    sessions[newName] = sessions[oldName];
    delete sessions[oldName];
    sessionOrder = sessionOrder.map(s => (s === oldName ? newName : s));
    updateSessionList();

    fetch(`/rename_session/${oldName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_session_name: newName }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to rename session");
            }
            switchSession(newName);
            localStorage.setItem('lastUsedSession', newName);
        })
        .catch(error => {
            console.error('Error renaming session:', error);
            alert("Failed to rename the session. Please try again.");
        });
}

// Send user input and get a response
function sendMessage() {
    const userInput = document.getElementById("userInput");
    const chatWindow = document.getElementById("chatWindow");
    const userMessage = userInput.value.trim();

    if (!userMessage || !currentSession) return;

    chatWindow.innerHTML += `<div class="message user">${userMessage}</div>`;
    userInput.value = '';

    fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            session_name: currentSession, 
            question: userMessage,
            mode: "planner" // Or other mode
        }),
    })
    .then(response => response.json())
    .then(data => {
        chatWindow.innerHTML += `<div class="message bot">${data.text_response}</div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    })
    .catch(error => {
        chatWindow.innerHTML += `<div class="message bot error">Error: ${error.message}</div>`;
    });
}

// Sanitize input to prevent HTML injection
function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Initialize chat input events
function initializeChatEvents() {
    const sendButton = document.getElementById("sendButton");
    const userInput = document.getElementById("userInput");

    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
}
