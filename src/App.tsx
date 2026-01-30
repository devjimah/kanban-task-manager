import { useState } from "react";
import { useBoard } from "./context/BoardContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BoardView from "./pages/BoardView";
import ViewTaskModal from "./components/modals/ViewTaskModal";
import AddEditTaskModal from "./components/modals/AddEditTaskModal";
import AddEditBoardModal from "./components/modals/AddEditBoardModal";
import DeleteModal from "./components/modals/DeleteModal";
import { IconShowSidebar } from "./components/Icons";
import type { Task, ModalType } from "./types";

export default function App() {
  const { activeBoard, deleteBoard, deleteTask } = useBoard();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleOpenModal = (type: ModalType) => {
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
    // Don't clear selectedTask immediately to prevent flash during close animation
    setTimeout(() => setSelectedTask(null), 200);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setModalType("viewTask");
  };

  const handleEditTask = () => {
    setModalType("editTask");
  };

  const handleDeleteTaskConfirm = () => {
    setModalType("deleteTask");
  };

  const handleDeleteBoard = () => {
    if (activeBoard) {
      deleteBoard(activeBoard.id);
    }
    handleCloseModal();
  };

  const handleDeleteTask = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
    }
    handleCloseModal();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenModal={handleOpenModal}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenModal={handleOpenModal}
        />

        <BoardView
          onTaskClick={handleTaskClick}
          onOpenModal={handleOpenModal}
        />
      </div>

      {/* Show Sidebar Button (when hidden) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hidden md:flex fixed bottom-8 left-0 items-center justify-center w-14 h-12 rounded-r-full transition-colors hover:bg-[var(--main-purple-hover)]"
          style={{ backgroundColor: "var(--main-purple)" }}
          aria-label="Show sidebar"
        >
          <IconShowSidebar />
        </button>
      )}

      {/* Modals */}
      <ViewTaskModal
        isOpen={modalType === "viewTask"}
        onClose={handleCloseModal}
        task={selectedTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTaskConfirm}
      />

      <AddEditTaskModal
        isOpen={modalType === "addTask" || modalType === "editTask"}
        onClose={handleCloseModal}
        task={modalType === "editTask" ? selectedTask : null}
      />

      <AddEditBoardModal
        isOpen={modalType === "addBoard" || modalType === "editBoard"}
        onClose={handleCloseModal}
        board={modalType === "editBoard" ? activeBoard : null}
      />

      <DeleteModal
        isOpen={modalType === "deleteBoard"}
        onClose={handleCloseModal}
        onConfirm={handleDeleteBoard}
        type="board"
        title={activeBoard?.name || ""}
      />

      <DeleteModal
        isOpen={modalType === "deleteTask"}
        onClose={handleCloseModal}
        onConfirm={handleDeleteTask}
        type="task"
        title={selectedTask?.title || ""}
      />
    </div>
  );
}
