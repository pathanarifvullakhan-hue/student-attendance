const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Database opening error: ', err.message);
    else console.log('Connected to SQLite database.');
});

// Create Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS students (
    roll_no TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no TEXT,
    date TEXT,
    period INTEGER,
    status TEXT,
    UNIQUE(roll_no, date, period),
    FOREIGN KEY(roll_no) REFERENCES students(roll_no)
)`);

    // Insert Initial Sample Data
    db.get(`SELECT COUNT(*) as count FROM students`, (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO students (roll_no, name, department) VALUES (?, ?, ?)`);
            stmt.run('23911A66C5', 'Harini', 'CSE (AI & ML)');
            stmt.run('23911A6675', 'Gouthami', 'CSE (AI & ML)');
            stmt.run('23911A6665', 'Kalyani', 'CSE (AI & ML)');
            stmt.run('23911A6699', 'Likitha', 'CSE (AI & ML)');
            stmt.run('23911A66B5', 'Arif', 'CSE (AI & ML)');
            stmt.finalize();
        }
    });
});

// API: Get all students
app.get('/api/students', (req, res) => {
    db.all(`SELECT * FROM students`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Get attendance for a specific date
app.get('/api/attendance', (req, res) => {
    const { date } = req.query;
    db.all(`SELECT * FROM attendance WHERE date = ?`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Save or update daily attendance records
app.post('/api/attendance', (req, res) => {
    const { date, records } = req.body;
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(`INSERT INTO attendance (roll_no, date, period, status) 
            VALUES (?, ?, ?, ?) 
            ON CONFLICT(roll_no, date, period) DO UPDATE SET status = ?`);

        records.forEach(rec => {
            stmt.run(rec.roll_no, date, rec.period, rec.status, rec.status);
        });
        stmt.finalize();
        db.run("COMMIT", (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Attendance saved successfully" });
        });
    });
});

// API: Monthly Attendance Calculation Report
app.get('/api/report', (req, res) => {
    const { month } = req.query; // Format: YYYY-MM
    if (!month) return res.status(400).json({ error: "Month parameter (YYYY-MM) is required" });

    const query = `
        SELECT s.roll_no, s.name, 
            COUNT(DISTINCT a.date) * 7 as working_periods,
            SUM(CASE WHEN a.status = 'P' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN a.status = 'A' THEN 1 ELSE 0 END) as absent
        FROM students s
        LEFT JOIN attendance a ON s.roll_no = a.roll_no AND strftime('%Y-%m', a.date) = ?
        GROUP BY s.roll_no, s.name
    `;

    db.all(query, [month], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const report = rows.map(row => {
            const working = row.working_periods || 0;
            const present = row.present || 0;
            const percentage = working > 0 ? ((present / working) * 100).toFixed(2) : "0.00";
            return {
                roll_no: row.roll_no,
                student: row.name,
                working_periods: working,
                present: present,
                absent: row.absent || 0,
                attendance_percentage: percentage
            };
        });
        res.json(report);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
