import { useCallback, useEffect, useId, useState } from "react";
import Modal from "./Modal";
import { kanbanApi, type BoardMember } from "../../api/kanban";
import { useToastStore } from "../../store/toastStore";
import { IconCross } from "../Icons";
import type { Board } from "../../types";

type Access = "viewer" | "editor";

interface ManageCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
}

// What: Collaborator management form component.
// Does: Lets a board owner list, invite, re-role, remove, and promote collaborators.
// If removed: The board collaboration endpoints have no user-facing workflow.
function CollaboratorsForm({ board, onClose }: Readonly<Omit<ManageCollaboratorsModalProps, "isOpen">>) {
  const { addToast } = useToastStore();
  const formId = useId();
  const emailId = `${formId}-email`;
  const emailErrorId = `${formId}-email-error`;
  const accessId = `${formId}-access`;

  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access>("editor");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const boardId = board?.id;

  // What: Membership refresh callback function.
  // Does: Reloads the collaborator list after a mutation or an explicit retry.
  // If removed: The list cannot recover after mutations or transient errors.
  const loadMembers = useCallback(async () => {
    if (!boardId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      setMembers(await kanbanApi.listMembers(boardId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Collaborators could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  // Initial load. State is only written once the request settles, and a
  // cancellation flag prevents updates after the modal closes.
  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    kanbanApi
      .listMembers(boardId)
      .then((result) => {
        if (!cancelled) {
          setMembers(result);
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Collaborators could not be loaded.");
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }
    // Mirror the server contract (z.email()) with a light client-side check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!boardId) return;
    setPendingAction("invite");
    try {
      await kanbanApi.inviteMember(boardId, trimmed, access);
      addToast(`Invitation sent to ${trimmed}`, "success");
      setEmail("");
      setEmailError(null);
      await loadMembers();
    } catch (error) {
      // The API returns 404 when no account exists for the address.
      addToast(error instanceof Error ? error.message : "The invitation could not be sent.", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const handleAccessChange = async (userId: string, next: Access) => {
    if (!boardId) return;
    setPendingAction(userId);
    try {
      await kanbanApi.updateMemberAccess(boardId, userId, next);
      addToast("Collaborator access updated", "success");
      await loadMembers();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Access could not be updated.", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!boardId) return;
    setPendingAction(userId);
    try {
      await kanbanApi.removeMember(boardId, userId);
      addToast(`${name} no longer has access`, "success");
      await loadMembers();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "The collaborator could not be removed.", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const handleTransfer = async (userId: string, name: string) => {
    if (!boardId) return;
    setPendingAction(userId);
    try {
      await kanbanApi.transferOwnership(boardId, userId);
      addToast(`${name} now owns this board`, "success");
      // Ownership loss revokes the owner-only endpoints backing this modal.
      onClose();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Ownership could not be transferred.", "error");
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null;

  return (
    <>
      {/* Invite */}
      <div className="mb-6">
        <label htmlFor={emailId} className="input-label">
          Invite by email
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="teammate@example.com"
              className={`input-field ${emailError ? "error" : ""}`}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? emailErrorId : undefined}
              disabled={isBusy}
            />
          </div>
          <select
            id={accessId}
            value={access}
            onChange={(event) => setAccess(event.target.value as Access)}
            className="input-field sm:w-32"
            aria-label="Access level for the invited collaborator"
            disabled={isBusy}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={handleInvite}
            className="btn btn-primary-sm sm:w-auto sm:px-5"
            disabled={isBusy}
          >
            {pendingAction === "invite" ? "Inviting…" : "Invite"}
          </button>
        </div>
        {emailError && (
          <span id={emailErrorId} className="text-xs mt-1 block" style={{ color: "var(--red)" }} role="alert">
            {emailError}
          </span>
        )}
        <p className="text-xs mt-2" style={{ color: "var(--medium-grey)" }}>
          The person must already have an account. They gain access once they accept.
        </p>
      </div>

      {/* Current members */}
      <section aria-labelledby={`${formId}-list-heading`}>
        <h3 id={`${formId}-list-heading`} className="input-label">
          People with access
        </h3>

        {isLoading && (
          <p className="body-l py-4" style={{ color: "var(--medium-grey)" }}>
            Loading collaborators…
          </p>
        )}

        {loadError && !isLoading && (
          <div className="py-4">
            <p className="body-l mb-3" style={{ color: "var(--red)" }} role="alert">
              {loadError}
            </p>
            <button type="button" onClick={() => void loadMembers()} className="btn btn-secondary">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !loadError && members.length === 0 && (
          <p className="body-l py-4" style={{ color: "var(--medium-grey)" }}>
            No collaborators yet.
          </p>
        )}

        {!isLoading && !loadError && members.length > 0 && (
          <ul className="space-y-3 list-none p-0 m-0">
            {members.map((member) => {
              // A membership row is only actionable when its user still resolves.
              const user = member.user;
              const isOwner = member.access === "owner";
              const rowBusy = user ? pendingAction === user.id : false;

              return (
                <li
                  key={user?.id ?? `${member.access}-${member.status}`}
                  className="flex items-center gap-3 rounded-md p-3"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="body-l truncate" style={{ color: "var(--text-primary)" }}>
                      {user?.name ?? "Unknown user"}
                      {member.status === "pending" && (
                        <span className="body-m ml-2" style={{ color: "var(--medium-grey)" }}>
                          (pending)
                        </span>
                      )}
                    </p>
                    <p className="body-m truncate" style={{ color: "var(--medium-grey)" }}>
                      {user?.email ?? "—"}
                    </p>
                  </div>

                  {isOwner ? (
                    <span className="body-m px-2" style={{ color: "var(--main-purple)" }}>
                      Owner
                    </span>
                  ) : (
                    <>
                      <select
                        value={member.access}
                        onChange={(event) => user && void handleAccessChange(user.id, event.target.value as Access)}
                        className="input-field w-28"
                        aria-label={`Access level for ${user?.name ?? "collaborator"}`}
                        disabled={!user || rowBusy}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {member.status === "accepted" && (
                        <button
                          type="button"
                          onClick={() => user && void handleTransfer(user.id, user.name)}
                          className="body-m underline hover:opacity-75 transition-opacity whitespace-nowrap"
                          style={{ color: "var(--medium-grey)" }}
                          disabled={!user || rowBusy}
                        >
                          Make owner
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => user && void handleRemove(user.id, user.name)}
                        className="p-1 hover:opacity-75 transition-opacity"
                        aria-label={`Remove ${user?.name ?? "collaborator"}`}
                        disabled={!user || rowBusy}
                      >
                        <IconCross />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

// What: Collaborator management modal component.
// Does: Wraps the collaborator form in the shared modal shell for board owners.
// If removed: Owners have no entry point for managing shared board access.
export default function ManageCollaboratorsModal({
  isOpen,
  onClose,
  board,
}: Readonly<ManageCollaboratorsModalProps>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Collaborators">
      {isOpen && board ? <CollaboratorsForm key={board.id} board={board} onClose={onClose} /> : null}
    </Modal>
  );
}
