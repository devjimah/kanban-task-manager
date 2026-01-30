import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBoard } from "../context/BoardContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { LogoDark, LogoLight, IconBoard, IconHideSidebar } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import type { ModalType } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (type: ModalType) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  onOpenModal,
}: SidebarProps) {
  const { boards } = useBoard();
  const { theme } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get active board ID from URL
  const activeBoardId = location.pathname.startsWith("/board/")
    ? location.pathname.split("/board/")[1]
    : null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          inset-y-0 left-0 z-40
          w-[260px] lg:w-[300px]
          flex flex-col
          border-r transition-all duration-300
          ${isOpen ? "fixed md:relative translate-x-0" : "fixed -translate-x-full"}
        `}
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Logo */}
        <div className="px-6 lg:px-8 pt-8 pb-[54px] hidden md:block">
          {theme === "dark" ? <LogoLight /> : <LogoDark />}
        </div>

        {/* Boards List */}
        <div className="flex-1 overflow-y-auto pr-6">
          <h3 className="heading-s px-6 lg:px-8 mb-5">
            ALL BOARDS ({boards.length})
          </h3>

          <nav className="space-y-0.5">
            {/* Dashboard Link */}
            <Link
              to="/"
              className={`
                w-full flex items-center gap-4 px-6 lg:px-8 py-3.5
                rounded-r-full transition-colors text-left heading-m
                ${
                  location.pathname === "/"
                    ? "text-white"
                    : "text-[var(--medium-grey)] hover:text-[var(--main-purple)]"
                }
              `}
              style={{
                backgroundColor:
                  location.pathname === "/"
                    ? "var(--main-purple)"
                    : "transparent",
              }}
            >
              <IconBoard
                className={location.pathname === "/" ? "text-white" : ""}
              />
              <span className="truncate">Dashboard</span>
            </Link>

            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/board/${board.id}`}
                className={`
                  w-full flex items-center gap-4 px-6 lg:px-8 py-3.5
                  rounded-r-full transition-colors text-left heading-m
                  ${
                    activeBoardId === board.id
                      ? "text-white"
                      : "text-[var(--medium-grey)] hover:text-[var(--main-purple)]"
                  }
                `}
                style={{
                  backgroundColor:
                    activeBoardId === board.id
                      ? "var(--main-purple)"
                      : "transparent",
                }}
              >
                <IconBoard
                  className={activeBoardId === board.id ? "text-white" : ""}
                />
                <span className="truncate">{board.name}</span>
              </Link>
            ))}

            {/* Create New Board Button */}
            <button
              onClick={() => onOpenModal("addBoard")}
              className="w-full flex items-center gap-4 px-6 lg:px-8 py-3.5 rounded-r-full transition-colors text-left heading-m"
              style={{ color: "var(--main-purple)" }}
            >
              <IconBoard />
              <span>+ Create New Board</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="px-4 lg:px-6 pb-8 space-y-2">
          {/* Admin Link (if logged in) */}
          {isLoggedIn && (
            <Link
              to="/admin"
              className={`
                flex items-center gap-4 px-4 py-3.5 w-full rounded-r-full transition-colors heading-m
                ${
                  location.pathname === "/admin"
                    ? "text-white"
                    : "text-[var(--medium-grey)] hover:text-[var(--main-purple)]"
                }
              `}
              style={{
                backgroundColor:
                  location.pathname === "/admin"
                    ? "var(--main-purple)"
                    : "transparent",
              }}
            >
              <span>👤</span>
              <span>Admin</span>
            </Link>
          )}

          {/* Auth Section */}
          <div
            className="p-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            {isLoggedIn ? (
              <>
                <span
                  className="body-m truncate"
                  style={{ color: "var(--medium-grey)" }}
                >
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1 rounded transition-colors"
                  style={{ color: "var(--red)" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="w-full text-center body-m py-1 transition-colors"
                style={{ color: "var(--main-purple)" }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Hide Sidebar Button (Desktop only) */}
          <button
            onClick={onClose}
            className="hidden md:flex items-center gap-4 px-4 py-3.5 w-full rounded-r-full transition-colors heading-m"
            style={{ color: "var(--medium-grey)" }}
          >
            <IconHideSidebar />
            <span>Hide Sidebar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
