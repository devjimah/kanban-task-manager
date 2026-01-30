import { useState, useRef, useEffect } from "react";
import { useBoard } from "../context/BoardContext";
import { useTheme } from "../context/ThemeContext";
import {
  LogoMobile,
  LogoDark,
  LogoLight,
  IconVerticalEllipsis,
  IconAddTaskMobile,
  IconChevronDown,
  IconChevronUp,
} from "./Icons";
import type { ModalType } from "../types";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenModal: (type: ModalType) => void;
}

export default function Header({ isSidebarOpen, onOpenModal }: HeaderProps) {
  const { activeBoard } = useBoard();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileBoardsOpen, setIsMobileBoardsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditBoard = () => {
    setIsMenuOpen(false);
    onOpenModal("editBoard");
  };

  const handleDeleteBoard = () => {
    setIsMenuOpen(false);
    onOpenModal("deleteBoard");
  };

  return (
    <header
      className="flex items-center border-b h-16 md:h-[81px] lg:h-[97px]"
      style={{
        backgroundColor: "var(--bg-header)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Logo Section (Desktop) - Only show when sidebar is hidden */}
      {!isSidebarOpen && (
        <div
          className="hidden md:flex items-center px-6 lg:px-8 h-full border-r"
          style={{
            borderColor: "var(--border-color)",
            width: "210px",
          }}
        >
          {theme === "dark" ? <LogoLight /> : <LogoDark />}
        </div>
      )}

      {/* Mobile Logo */}
      <div className="md:hidden px-4">
        <LogoMobile />
      </div>

      {/* Board Name Section */}
      <div className="flex-1 flex items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Mobile Board Dropdown Trigger */}
          <button
            className="flex md:hidden items-center gap-2"
            onClick={() => setIsMobileBoardsOpen(!isMobileBoardsOpen)}
          >
            <h1 className="heading-l" style={{ color: "var(--text-primary)" }}>
              {activeBoard?.name || "Select a Board"}
            </h1>
            {isMobileBoardsOpen ? <IconChevronUp /> : <IconChevronDown />}
          </button>

          {/* Desktop Board Name */}
          <h1
            className="hidden md:block heading-xl"
            style={{ color: "var(--text-primary)" }}
          >
            {activeBoard?.name || "Select a Board"}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Add Task Button - Desktop */}
          <button
            onClick={() => onOpenModal("addTask")}
            disabled={!activeBoard || activeBoard.columns.length === 0}
            className="hidden md:flex btn btn-primary-lg disabled:opacity-25 disabled:cursor-not-allowed"
          >
            + Add New Task
          </button>

          {/* Add Task Button - Mobile */}
          <button
            onClick={() => onOpenModal("addTask")}
            disabled={!activeBoard || activeBoard.columns.length === 0}
            className="md:hidden flex items-center justify-center w-12 h-8 rounded-full disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--main-purple)" }}
          >
            <IconAddTaskMobile />
          </button>

          {/* Board Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -mr-2"
              disabled={!activeBoard}
              aria-label="Board options"
            >
              <IconVerticalEllipsis />
            </button>

            {isMenuOpen && activeBoard && (
              <div
                className="absolute right-0 top-full mt-4 w-48 py-4 rounded-lg shadow-lg z-50"
                style={{
                  backgroundColor:
                    theme === "dark" ? "var(--very-dark-grey)" : "var(--white)",
                }}
              >
                <button
                  onClick={handleEditBoard}
                  className="w-full text-left px-4 py-2 body-l hover:opacity-75 transition-opacity"
                  style={{ color: "var(--medium-grey)" }}
                >
                  Edit Board
                </button>
                <button
                  onClick={handleDeleteBoard}
                  className="w-full text-left px-4 py-2 body-l hover:opacity-75 transition-opacity"
                  style={{ color: "var(--red)" }}
                >
                  Delete Board
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
