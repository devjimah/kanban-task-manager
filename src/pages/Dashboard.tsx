import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBoard } from "../store/boardStore";
import { useAuth } from "../context/AuthContext";
import { IconBoard } from "../components/Icons";
import AddEditBoardModal from "../components/modals/AddEditBoardModal";
import {
  DashboardSkeleton,
  ErrorScreen,
} from "../components/LoadingErrorStates";
import type { ModalType } from "../types";

export default function Dashboard() {
  const { boards, isLoading, error, hasFetched, fetchBoards } = useBoard();
  const [modalType, setModalType] = useState<ModalType>(null);
  const { isLoggedIn, user } = useAuth();
  const handleOpenModal = (type: ModalType) => {
    setModalType(type);
  };
  const handleCloseModal = () => {
    setModalType(null);
    // Don't clear selectedTask immediately to prevent flash during close animation
    setTimeout(() => setSelectedTask(null), 200);
  };
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  



  // Fetch boards on mount if not already fetched
  useEffect(() => {
    if (!hasFetched && !isLoading && !error) {
      fetchBoards();
    }
  }, [hasFetched, isLoading, error, fetchBoards]);

  // Loading state — show skeleton UI
  if (isLoading && !hasFetched) {
    return <DashboardSkeleton />;
  }

  // Error state — show error with retry
  if (error) {
    return <ErrorScreen message={error} onRetry={fetchBoards} />;
  }

  return (
    <main
      className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="heading-xl mb-2">
          {isLoggedIn ? `Welcome back, ${user?.name}!` : "Welcome to Kanban"}
        </h1>
        <p className="body-l" style={{ color: "var(--medium-grey)" }}>
          Select a board to get started or create a new one.
        </p>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/board/${board.id}`}
            className="group p-6 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: "var(--bg-sidebar)",
              border: "1px solid var(--border-color)",
            }}
            
          >
            <div className="flex items-center gap-3 mb-4">
              <IconBoard className="text-[var(--main-purple)]" />
              <h3 className="heading-m truncate group-hover:text-[var(--main-purple)] transition-colors">
                {board.name}
              </h3>
            </div>
            <p className="body-m" style={{ color: "var(--medium-grey)" }}>
              {board.columns.length} column
              {board.columns.length !== 1 ? "s" : ""}
              {" · "}
              {board.columns.reduce(
                (acc, col) => acc + col.tasks.length,
                0,
              )}{" "}
              task
              {board.columns.reduce((acc, col) => acc + col.tasks.length, 0) !==
              1
                ? "s"
                : ""}
            </p>
          </Link>
        ))}

        {/* Create New Board Card */}
        <button
          onClick={() => {
            handleOpenModal("addBoard");
          }}
          className="group p-6 rounded-lg transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center min-h-[120px]"
          style={{
            backgroundColor: "var(--bg-sidebar)",
            border: "2px dashed var(--main-purple)",
            opacity: 0.7,
          }}
        >
          <span
            className="heading-m text-center"
            style={{ color: "var(--main-purple)" }}
          ></span>
          <p
            className="body-m mt-2 text-center"
            style={{ color: "var(--medium-grey)" }}
          >
            Use the sidebar to add a board
          </p>
        </button>
        <AddEditBoardModal
                isOpen={modalType === "addBoard" || modalType === "editBoard"}
                onClose={handleCloseModal}
                board={modalType === "editBoard" ? activeBoard : null}
              />
      </div>

      {boards.length === 0 && (
        <div className="text-center mt-12">
          <p className="heading-l mb-4" style={{ color: "var(--medium-grey)" }}>
            No boards yet
          </p>
          <p className="body-l" style={{ color: "var(--medium-grey)" }}>
            Create your first board using the sidebar.
          </p>
        </div>
      )}
    </main>
  );
}
