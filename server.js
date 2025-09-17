// ------------------------------
// 1. Import Module และ Setup Middleware
// ------------------------------
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// เปิดใช้งาน CORS เพื่อให้ frontend fetch ได้ไม่มีปัญหา
app.use(cors());

// เปิดใช้งานอ่าน JSON จาก request body
app.use(express.json());

// ------------------------------
// 2. ข้อมูล Agents ตัวอย่าง (ใช้ในระบบ)
// ------------------------------
const agents = [
  {
    code: "A001",
    name: "Kittaphon LA",
    status: "Available",
    department: "QA",
    loginTime: "2025-09-17T07:30:00Z"
  },
  {
    code: "A002",
    name: "Worawit SW",
    status: "Busy",
    department: "DEV",
    loginTime: "2025-09-17T08:00:00Z"
  },
  {
    code: "A003",
    name: "Nattakit K",
    status: "Offline",
    department: "DEV",
    loginTime: null
  }
];

// ------------------------------
// 3. Route เบื้องต้น
// ------------------------------
app.get('/', (req, res) => {
    res.send("Hello Agent Wallboard!");
});

app.get('/health', (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

// ------------------------------
// 4. API: GET /api/agents
// ส่งข้อมูล agents ทั้งหมด
// ------------------------------
app.get('/api/agents', (req, res) => {
    res.json({
        success: true,
        data: agents,
        count: agents.length,
        timestamp: new Date().toISOString()
    });
});

// ------------------------------
// 5. API: GET /api/agents/count
// ส่งจำนวน agents ทั้งหมด
// ------------------------------
app.get('/api/agents/count', (req, res) => {
    res.json({
        success: true,
        count: agents.length,
        timestamp: new Date().toISOString()
    });
});

// ------------------------------
// 6. API: PATCH /api/agents/:code/status
// เปลี่ยนสถานะ agent
// ------------------------------
app.patch('/api/agents/:code/status', (req, res) => {
    const agentCode = req.params.code;
    const newStatus = req.body.status;

    if (!newStatus) {
        return res.status(400).json({
            success: false,
            message: "Missing 'status' in request body"
        });
    }

    const agent = agents.find(a => a.code === agentCode);

    if (!agent) {
        return res.status(404).json({
            success: false,
            message: `Agent with code ${agentCode} not found`
        });
    }

    const validStatuses = ["Available", "Active", "Wrap Up", "Not Ready", "Offline"];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status '${newStatus}'. Valid statuses: ${validStatuses.join(', ')}`
        });
    }

    const oldStatus = agent.status;
    agent.status = newStatus;

    console.log(`[${new Date().toISOString()}] Agent ${agentCode}: ${oldStatus} → ${newStatus}`);

    res.json({
        success: true,
        message: `Status updated for agent ${agentCode}`,
        data: agent,
        timestamp: new Date().toISOString()
    });
});

// ------------------------------
// 7. API: GET /api/dashboard/stats
// สรุปสถิติ agent แยกตามสถานะ
// ------------------------------
app.get('/api/dashboard/stats', (req, res) => {
    const totalAgents = agents.length;

    const available = agents.filter(a => a.status === "Available").length;
    const active = agents.filter(a => a.status === "Active").length;
    const wrapUp = agents.filter(a => a.status === "Wrap Up").length;
    const notReady = agents.filter(a => a.status === "Not Ready").length;
    const offline = agents.filter(a => a.status === "Offline").length;

    const percent = (count) => totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;

    res.json({
        success: true,
        data: {
            total: totalAgents,
            statusBreakdown: {
                available: { count: available, percent: percent(available) },
                active: { count: active, percent: percent(active) },
                wrapUp: { count: wrapUp, percent: percent(wrapUp) },
                notReady: { count: notReady, percent: percent(notReady) },
                offline: { count: offline, percent: percent(offline) }
            },
            timestamp: new Date().toISOString()
        }
    });
});

// ------------------------------
// 8. API: POST /api/agents/:code/login
// Agent Login - สร้าง agent ใหม่ถ้าไม่มีในระบบ
// ------------------------------
app.post('/api/agents/:code/login', (req, res) => {
    const agentCode = req.params.code;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Missing 'name' in request body"
        });
    }

    let agent = agents.find(a => a.code === agentCode);
    const now = new Date().toISOString();

    if (!agent) {
        agent = {
            code: agentCode,
            name: name,
            status: "Available",
            department: "Unknown",
            loginTime: now
        };
        agents.push(agent);
    } else {
        agent.name = name;
        agent.status = "Available";
        agent.loginTime = now;
    }

    res.json({
        success: true,
        message: `Agent ${agentCode} logged in`,
        data: agent,
        timestamp: now
    });
});

// ------------------------------
// 9. API: POST /api/agents/:code/logout
// Agent Logout - เปลี่ยนสถานะเป็น Offline และลบ loginTime
// ------------------------------
app.post('/api/agents/:code/logout', (req, res) => {
    const agentCode = req.params.code;
    const agent = agents.find(a => a.code === agentCode);

    if (!agent) {
        return res.status(404).json({
            success: false,
            message: `Agent with code ${agentCode} not found`
        });
    }

    agent.status = "Offline";
    agent.loginTime = null;

    res.json({
        success: true,
        message: `Agent ${agentCode} logged out`,
        data: agent,
        timestamp: new Date().toISOString()
    });
});

// ------------------------------
// 10. เริ่ม Server
// ------------------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
