document.getElementById("attendanceForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let id = document.getElementById("empId").value;
    let name = document.getElementById("empName").value;
    let dept = document.getElementById("dept").value;
    let working = parseInt(document.getElementById("workingDays").value);
    let present = parseInt(document.getElementById("presentDays").value);
    let leave = parseInt(document.getElementById("leaveDays").value);

    // Validation
    if (present > working || leave > working) {
        alert("Present/Leave days cannot exceed Working days");
        return;
    }

    // Calculate Attendance %
    let percent = ((present / working) * 100).toFixed(2);

    // Status
    let status = "";
    let className = "";

    if (percent >= 90) {
        status = "Excellent";
        className = "excellent";
    } else if (percent >= 75) {
        status = "Good";
        className = "good";
    } else if (percent >= 50) {
        status = "Average";
        className = "average";
    } else {
        status = "Poor";
        className = "poor";
    }

    // Add to table
    let row = `
        <tr>
            <td>${id}</td>
            <td>${name}</td>
            <td>${dept}</td>
            <td>${percent}%</td>
            <td><span class="badge ${className}">${status}</span></td>
        </tr>
    `;

    document.getElementById("tableBody").innerHTML += row;

    // Reset form
    document.getElementById("attendanceForm").reset();
});