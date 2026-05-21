import { getSession, destroySession } from "@/src/lib/session";
import { redirect } from "next/navigation";
import AnnouncementsList from "./components/AnnouncementsList";

interface CourseUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

export default async function Home() {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
        redirect("/login");
    }

    const user: CourseUser = {
        id: session.userId,
        name: session.name || "",
        email: session.email || "",
        role: session.role || "student",
        status: session.status || "pending"
    };

    if (user.role !== "auditor" && user.status === "pending") {
        await destroySession();
        redirect("/login?pending=true");
    }

    const isStaff = user.role === "instructor" || user.role === "teacher";

    if (user.role !== "auditor" && user.status === "denied") {
        return (
            <div className="screen-container">
                <h1>Access Denied</h1>
                <p>Your request to join this course has been denied.</p>
            </div>
        );
    }

    return (
        <div id="page-home" className="page-section active">
            <div className="section-block">
                <h2>Course Overview</h2>
                <p>
                    This course introduces students to the fundamental ideas and practical applications of machine learning. Students will explore what machine learning is, how models learn from data, and how mathematical concepts from differential calculus support model development. Emphasis is placed on understanding the machine learning development cycle, interpreting results, and evaluating real-world use cases. The course focuses on foundational models such as regression and classification and examines ethical and practical considerations of creating machine learning systems.
                </p>
                <h3>Grading</h3>
                <table className="classic" style={{ width: "auto" }}>
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Homework Sets (10)</td>
                            <td>20%</td>
                        </tr>
                        <tr>
                            <td>Test 1</td>
                            <td>15%</td>
                        </tr>
                        <tr>
                            <td>Test 2</td>
                            <td>15%</td>
                        </tr>
                        <tr>
                            <td>Test 3</td>
                            <td>15%</td>
                        </tr>
                        <tr>
                            <td>Midterm</td>
                            <td>35%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <hr />
            <AnnouncementsList isStaff={isStaff} />
        </div>
    );
}
