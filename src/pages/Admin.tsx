import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBoard } from "../context/BoardContext";

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { boards } = useBoard();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Calculate stats
  const totalBoards = boards.length;
  const totalColumns = boards.reduce((acc, b) => acc + b.columns.length, 0);
  const totalTasks = boards.reduce(
    (acc, b) => acc + b.columns.reduce((a, c) => a + c.tasks.length, 0),
    0,
  );
  const completedSubtasks = boards.reduce(
    (acc, b) =>
      acc +
      b.columns.reduce(
        (a, c) =>
          a +
          c.tasks.reduce(
            (t, task) => t + task.subtasks.filter((s) => s.isCompleted).length,
            0,
          ),
        0,
      ),
    0,
  );
  const totalSubtasks = boards.reduce(
    (acc, b) =>
      acc +
      b.columns.reduce(
        (a, c) => a + c.tasks.reduce((t, task) => t + task.subtasks.length, 0),
        0,
      ),
    0,
  );

  return (
    <main
      className="flex-1 overflow-y-auto p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-xl mb-2">Admin Dashboard</h1>
          <p className="body-l" style={{ color: "var(--medium-grey)" }}>
            Welcome, {user?.name}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-destructive">
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Boards" value={totalBoards} />
        <StatCard title="Total Columns" value={totalColumns} />
        <StatCard title="Total Tasks" value={totalTasks} />
        <StatCard
          title="Subtasks Completed"
          value={`${completedSubtasks}/${totalSubtasks}`}
        />
      </div>

      {/* Quick Links */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: "var(--bg-sidebar)",
          border: "1px solid var(--border-color)",
        }}
      >
        <h2 className="heading-l mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/" className="btn btn-secondary">
            View Dashboard
          </Link>
          {boards.length > 0 && (
            <Link to={`/board/${boards[0].id}`} className="btn btn-primary-sm">
              Go to First Board
            </Link>
          )}
        </div>
      </div>

      {/* Boards Overview */}
      <div className="mt-8">
        <h2 className="heading-l mb-4">Boards Overview</h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: "var(--bg-sidebar)",
            border: "1px solid var(--border-color)",
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-main)" }}>
                <th className="text-left p-4 heading-s">Board Name</th>
                <th className="text-left p-4 heading-s">Columns</th>
                <th className="text-left p-4 heading-s">Tasks</th>
                <th className="text-left p-4 heading-s">Action</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr
                  key={board.id}
                  style={{ borderTop: "1px solid var(--border-color)" }}
                >
                  <td className="p-4 body-l">{board.name}</td>
                  <td
                    className="p-4 body-m"
                    style={{ color: "var(--medium-grey)" }}
                  >
                    {board.columns.length}
                  </td>
                  <td
                    className="p-4 body-m"
                    style={{ color: "var(--medium-grey)" }}
                  >
                    {board.columns.reduce((acc, c) => acc + c.tasks.length, 0)}
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/board/${board.id}`}
                      className="text-[var(--main-purple)] hover:underline body-m"
                    >
                      View Board →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        border: "1px solid var(--border-color)",
      }}
    >
      <p className="body-m mb-2" style={{ color: "var(--medium-grey)" }}>
        {title}
      </p>
      <p className="heading-xl" style={{ color: "var(--main-purple)" }}>
        {value}
      </p>
    </div>
  );
}
