export default function Sidebar() {
    return (
        <div id="sidebar">
            <h3>Instructors</h3>
            <div className="staff-entry">
                <strong>Rohit Karthik</strong>
                <span style={{ fontSize: "11px" }}>Instructor</span>
                <br />
                <a href="#">karthik.rohit@charterschool.org</a>
                <br />
                <span className="office-hours">
                    Office Hours Period: Period X
                </span>
            </div>
            <h3>Quick Links</h3>
            <ul>
                <li>
                    <a target="_blank" href="https://picode.education">PiCode (Submissions)</a>
                </li>
                <li>
                    <a href="#">Course Syllabus [PDF]</a>
                </li>
            </ul>
        </div>
    );
}
