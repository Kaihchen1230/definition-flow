import { formatEntitlement } from "../config/entitlements";
import type { DemoRequest, User } from "../types/api";

type AppHeaderProps = {
  hasUnsavedChanges: boolean;
  onRequestChange: (requestCaseId: string) => void;
  onStartNewRequest: () => void;
  onUserChange: (userId: string) => void;
  requestCaseId: string;
  requests: DemoRequest[];
  userId: string;
  users: User[];
};

export const AppHeader = ({
  hasUnsavedChanges,
  onRequestChange,
  onStartNewRequest,
  onUserChange,
  requestCaseId,
  requests,
  userId,
  users,
}: AppHeaderProps) => {
  const selectedRequest = requests.find((request) => request.id === requestCaseId);
  const selectedUser = users.find((user) => user.id === userId);
  const selectedEntitlements = selectedUser?.entitlements ?? [];

  return (
    <header className="app-header">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">Startup Investment Approval</h1>
          <span className="text-xs font-medium text-[var(--text-muted)]">{requestCaseId ? `Case ${requestCaseId.slice(0, 8)}` : "New request"}</span>
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          Create, review, and approve startup investment requests using the permissions of the selected user.
        </p>
      </div>
      <div className="app-toolbar">
        <label className="toolbar-field toolbar-request-field">
          <span>Request</span>
          <select className="control" value={requestCaseId} disabled={hasUnsavedChanges} onChange={(event) => onRequestChange(event.target.value)}>
            {!requestCaseId ? <option value="">Open an existing request</option> : null}
            {requests.map((request) => (
              <option value={request.id} key={request.id}>
                {formatRequestLabel(request)}
              </option>
            ))}
          </select>
        </label>
        <div className="toolbar-field toolbar-user-field">
          <label htmlFor="acting-user">User</label>
          <select id="acting-user" className="control" value={userId} disabled={hasUnsavedChanges} onChange={(event) => onUserChange(event.target.value)}>
            {users.map((user) => (
              <option value={user.id} key={user.id}>
                {user.displayName} ({formatRoleName(user.role)})
              </option>
            ))}
          </select>
          {selectedUser ? (
            <div className="toolbar-entitlements" aria-live="polite">
              <span>Entitlements</span>
              <ul aria-label={`Entitlements for ${selectedUser.displayName}`}>
                {selectedEntitlements.map((entitlement) => (
                  <li key={entitlement} title={entitlement}>
                    {formatEntitlement(entitlement)}
                    <span className="sr-only"> ({entitlement})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {selectedRequest ? <p className="toolbar-scenario">{selectedRequest.scenario}</p> : <span />}
        <div className="toolbar-actions">
          {requestCaseId ? <button className="button" onClick={onStartNewRequest} disabled={hasUnsavedChanges}>New request</button> : null}
        </div>
      </div>
    </header>
  );
};

const formatRoleName = (role: string) => role.replace(/([a-z])([A-Z])/g, "$1 $2");

const formatRequestLabel = ({ companyName, id }: DemoRequest) => `${companyName.trim() || "Untitled request"} (${id.slice(0, 8)})`;
