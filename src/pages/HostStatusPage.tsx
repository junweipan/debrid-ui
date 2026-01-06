import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HOST_STATUS_ENDPOINT = "https://debrid-link.com/api/v2/downloader/hosts";
const HOST_STATUS_TOKEN =
  "if_1BfqjEJeAr8UPujFL9Ji3nzgJIsJSW76GGYyQSwjcVk3_GevHH7kOCCTEd0No";

type HostDescriptor = {
  name: string;
  type: "host" | "stream";
  status: number;
  isFree: boolean;
  domains: string[];
  regexs: string[];
};

type HostsResponse = {
  success: boolean;
  value: HostDescriptor[];
};

type RequestState = "idle" | "loading" | "success" | "error";

type HostStatusState = {
  items: HostDescriptor[];
  status: RequestState;
  message: string;
  lastUpdated?: string;
};

type SortField = "name" | "domain" | "status";
type SortDirection = "asc" | "desc";

type SortState = {
  field: SortField | null;
  direction: SortDirection;
};

const summarizeDomains = (domains: string[]) => {
  if (!domains?.length) return "Domain info unavailable";
  const preview = domains.slice(0, 3);
  const remainder = domains.length - preview.length;
  const baseLine = preview.join(" · ");
  return remainder > 0 ? `${baseLine} +${remainder}` : baseLine;
};

export function HostStatusPage() {
  const navigate = useNavigate();
  const [hostStatus, setHostStatus] = useState<HostStatusState>({
    items: [],
    status: "idle",
    message: "Tap refresh to sync host data.",
  });
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });
  const [filterText, setFilterText] = useState<string>("");

  const fetchHostStatuses = useCallback(async () => {
    setHostStatus((prev) => ({
      ...prev,
      status: "loading",
      message: "Syncing active hosts…",
    }));

    try {
      const response = await fetch(HOST_STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${HOST_STATUS_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const payload: HostsResponse = await response.json();

      if (!payload.success || !Array.isArray(payload.value)) {
        throw new Error("Malformed host catalog");
      }

      const orderedHosts = [...payload.value].sort(
        (a, b) => b.status - a.status
      );
      const activeCount = orderedHosts.filter(
        (host) => host.status === 1
      ).length;

      setHostStatus({
        items: orderedHosts,
        status: "success",
        message: orderedHosts.length
          ? `Live catalog · ${activeCount} active / ${
              orderedHosts.length - activeCount
            } offline`
          : "No hosts reported",
        lastUpdated: new Date().toISOString(),
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load host catalog";
      setHostStatus({
        items: [],
        status: "error",
        message,
      });
    }
  }, []);

  useEffect(() => {
    void fetchHostStatuses();
  }, [fetchHostStatuses]);

  const handleSort = (field: SortField) => {
    setSortState((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedItems = [...hostStatus.items].sort((a, b) => {
    if (!sortState.field) return 0;

    let compareA: string | number;
    let compareB: string | number;

    switch (sortState.field) {
      case "name":
        compareA = a.name.toLowerCase();
        compareB = b.name.toLowerCase();
        break;
      case "domain":
        compareA = (a.domains[0] ?? "").toLowerCase();
        compareB = (b.domains[0] ?? "").toLowerCase();
        break;
      case "status":
        compareA = a.status;
        compareB = b.status;
        break;
      default:
        return 0;
    }

    if (compareA < compareB) return sortState.direction === "asc" ? -1 : 1;
    if (compareA > compareB) return sortState.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredItems = sortedItems.filter((host) => {
    if (!filterText.trim()) return true;
    const searchText = filterText.toLowerCase();
    const hostName = host.name.toLowerCase();
    const primaryDomain = (host.domains[0] ?? "").toLowerCase();
    return hostName.includes(searchText) || primaryDomain.includes(searchText);
  });

  const lastUpdatedCopy = hostStatus.lastUpdated
    ? new Date(hostStatus.lastUpdated).toLocaleTimeString()
    : null;

  return (
    <div className="host-page-shell">
      <header className="host-page-header">
        <button
          type="button"
          className="ghost-button host-back-button"
          onClick={() => navigate("/login")}
        >
          ← Back to login
        </button>
        <div>
          <p className="login-eyebrow">Status center</p>
          <h1>Active host status</h1>
          <p className="host-status-subhead">
            Mirrors pulled directly from Debrid-Link&apos;s live availability
            feed.
          </p>
        </div>
      </header>

      <section className="host-status-section" aria-live="polite">
        <div className="host-status-header">
          <div>
            <p className="eyebrow">Live availability</p>
            <h2>Network availability monitor</h2>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => void fetchHostStatuses()}
            disabled={hostStatus.status === "loading"}
          >
            {hostStatus.status === "loading" ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div
          className={`host-status-panel state-${hostStatus.status}`}
          aria-live="polite"
        >
          <div className="host-status-pill">
            <span className="status-dot" />
            <p>{hostStatus.message}</p>
          </div>
          {lastUpdatedCopy && (
            <p className="host-status-timestamp">Updated {lastUpdatedCopy}</p>
          )}
        </div>

        <div className="host-filter-wrapper">
          <input
            type="text"
            className="host-filter-input"
            placeholder="Filter by host name or primary domain..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Filter hosts by name or domain"
          />
        </div>

        {hostStatus.status === "error" ? (
          <p className="host-status-error">
            Unable to reach Debrid-Link. Retry the sync to view live host data.
          </p>
        ) : (
          <div
            className="host-status-table-wrapper"
            role="region"
            aria-live="polite"
          >
            <table className="host-status-table">
              <thead>
                <tr>
                  <th scope="col">
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => handleSort("name")}
                    >
                      Host
                      {sortState.field === "name" && (
                        <span className="sort-indicator">
                          {sortState.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th scope="col">Tier</th>
                  <th scope="col">
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => handleSort("domain")}
                    >
                      Primary domain
                      {sortState.field === "domain" && (
                        <span className="sort-indicator">
                          {sortState.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th scope="col">Domain coverage</th>
                  <th scope="col">
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      {sortState.field === "status" && (
                        <span className="sort-indicator">
                          {sortState.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {hostStatus.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="host-status-empty-cell">
                      No hosts reported.
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="host-status-empty-cell">
                      No hosts match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((host) => (
                    <tr key={host.name}>
                      <td>
                        <div className="host-name-cell">
                          <span className="host-type-pill">
                            {host.type === "stream" ? "Stream" : "Host"}
                          </span>
                          <span className="host-name">{host.name}</span>
                        </div>
                      </td>
                      <td>{host.isFree ? "Free tier" : "Premium"}</td>
                      <td>{host.domains[0] ?? "No domain reported"}</td>
                      <td>{summarizeDomains(host.domains)}</td>
                      <td>
                        <span
                          className={`status-chip ${
                            host.status === 1 ? "online" : "offline"
                          }`}
                        >
                          <span
                            className={`status-dot ${
                              host.status === 1 ? "online" : "offline"
                            }`}
                          />
                          {host.status === 1 ? "Online" : "Offline"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default HostStatusPage;
