const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TIMEOUT = 30 * 1000; // 30 seconds — if no ping, user is considered offline

const activeUsers = {}; // { userId: { username, lastSeen } }

// Called every 10s by each executor user to stay registered
app.post("/join", (req, res) => {
    const { userid, username } = req.body;
    if (!userid || !username) return res.status(400).json({ error: "missing fields" });
    activeUsers[String(userid)] = { username, lastSeen: Date.now() };
    res.json({ ok: true });
});

// Called when a user stops the script
app.post("/leave", (req, res) => {
    const { userid } = req.body;
    if (userid) delete activeUsers[String(userid)];
    res.json({ ok: true });
});

// Returns all currently active users
app.get("/active", (req, res) => {
    const now = Date.now();
    // Clean up stale users (missed 3+ pings)
    for (const id in activeUsers) {
        if (now - activeUsers[id].lastSeen > TIMEOUT) {
            delete activeUsers[id];
        }
    }
    res.json(activeUsers);
});

app.get("/", (req, res) => res.send("Authority server running."));

app.listen(PORT, () => console.log(`Authority server on port ${PORT}`));
