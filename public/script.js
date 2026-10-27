document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('attendanceDate');
    const reportMonthInput = document.getElementById('reportMonth');
    
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    reportMonthInput.value = today.slice(0, 7);

    loadAttendanceGrid();

    dateInput.addEventListener('change', loadAttendanceGrid);
    document.getElementById('saveBtn').addEventListener('click', saveAttendance);
    document.getElementById('loadReportBtn').addEventListener('click', loadMonthlyReport);

    loadMonthlyReport();
});

let studentsList = [];

async function loadAttendanceGrid() {
    const date = document.getElementById('attendanceDate').value;
    
    try {
        const [studentsRes, attRes] = await Promise.all([
            fetch('/api/students'),
            fetch(`/api/attendance?date=${date}`)
        ]);
        
        studentsList = await studentsRes.json();
        const attendanceRecords = await attRes.json();

        const attMap = {};
        attendanceRecords.forEach(r => {
            if (!attMap[r.roll_no]) attMap[r.roll_no] = {};
            attMap[r.roll_no][r.period] = r.status;
        });

        const tbody = document.querySelector('#attendanceTable tbody');
        tbody.innerHTML = '';

        studentsList.forEach(student => {
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${student.roll_no}</td><td>${student.name}</td>`;
            
            for (let p = 1; p <= 7; p++) {
                let status = (attMap[student.roll_no] && attMap[student.roll_no][p]) ? attMap[student.roll_no][p] : 'P';
                let td = document.createElement('td');
                td.innerHTML = `<span class="status-toggle ${status}" data-roll="${student.roll_no}" data-period="${p}">${status}</span>`;
                
                td.querySelector('span').addEventListener('click', function() {
                    let current = this.innerText;
                    let next = current === 'P' ? 'A' : 'P';
                    this.innerText = next;
                    this.className = `status-toggle ${next}`;
                });
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading attendance grid:', err);
    }
}

async function saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const records = [];

    document.querySelectorAll('.status-toggle').forEach(el => {
        records.push({
            roll_no: parseInt(el.getAttribute('data-roll')),
            period: parseInt(el.getAttribute('data-period')),
            status: el.innerText
        });
    });

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, records })
        });

        const data = await res.json();
        if (data.success) {
            alert('Attendance saved successfully!');
            loadMonthlyReport();
        } else {
            alert('Error saving attendance');
        }
    } catch (err) {
        console.error('Error saving attendance:', err);
    }
}

async function loadMonthlyReport() {
    const month = document.getElementById('reportMonth').value;
    try {
        const res = await fetch(`/api/report?month=${month}`);
        const report = await res.json();

        const tbody = document.querySelector('#reportTable tbody');
        tbody.innerHTML = '';

        report.forEach(row => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.roll_no}</td>
                <td>${row.student}</td>
                <td>${row.working_periods}</td>
                <td>${row.present}</td>
                <td>${row.absent}</td>
                <td>${row.attendance_percentage}%</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error generating report:', err);
    }
}
