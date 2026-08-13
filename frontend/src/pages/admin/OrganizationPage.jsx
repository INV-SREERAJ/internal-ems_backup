import { useState, useEffect, useMemo } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import Icon from "../../components/common/Icon";
import { getEmployees } from "../../api/adminApi";
import { formatRole, formatStatus } from "../../utils/enumUtils";

/**
 * Organization chart notes:
 * - Uses every employee returned by the API.
 * - Never invents a reporting relationship just to force everyone under Admin.
 * - Supports manager references by EmployeeCode, Id, ManagerId, ManagerEmployeeCode,
 *   ManagerName and common casing variants.
 * - Handles cycles safely so employees cannot disappear from the tree.
 * - Uses a scroll canvas whose content is centered only when it fits. Wide trees
 *   start at the left edge instead of being centered into negative overflow.
 */

const normalize = (value) =>
    value === null || value === undefined
        ? ""
        : String(value).trim().toLowerCase();

const firstValue = (...values) =>
    values.find((value) => value !== null && value !== undefined && String(value).trim() !== "");

const getEmployeeCode = (employee) =>
    String(
        firstValue(
            employee.employeeCode,
            employee.EmployeeCode,
            employee.employee_code,
            employee.code,
            employee.Code
        ) || ""
    ).trim();

const getEmployeeId = (employee) =>
    firstValue(
        employee.id,
        employee.Id,
        employee.employeeId,
        employee.EmployeeId,
        employee.employeeID
    );

const getEmployeeName = (employee) =>
    String(
        firstValue(
            employee.fullName,
            employee.FullName,
            `${employee.firstName || employee.FirstName || ""} ${employee.lastName || employee.LastName || ""}`.trim()
        ) || getEmployeeCode(employee) || "Unnamed employee"
    ).trim();

const getEmployeeEmail = (employee) =>
    firstValue(employee.email, employee.Email, employee.emailAddress, employee.EmailAddress) || "No email";

const getEmployeeRole = (employee) =>
    formatRole(firstValue(employee.role, employee.Role) || "");

const getEmployeeStatus = (employee) =>
    formatStatus(firstValue(employee.status, employee.Status) || "");

const getManagerReferences = (employee) => {
    /*
     * The admin employee endpoint can represent the reporting manager in
     * different ways depending on the DTO/projection:
     *
     *   managerEmployeeCode
     *   managerId
     *   managerName
     *   Manager { employeeCode, id, fullName, ... }
     *   ReportingManager { ... }
     *
     * Do not assume that managerId is always the employee code or that the
     * manager is always flattened into the DTO. Resolve all supported forms.
     */
    const managerObject = firstValue(
        employee.manager,
        employee.Manager,
        employee.reportingManager,
        employee.ReportingManager,
        employee.managerEmployee,
        employee.ManagerEmployee,
        employee.managerDetails,
        employee.ManagerDetails,
        employee.reporting_manager,
        employee.reportingManagerDetails
    );

    return {
        code: normalize(
            firstValue(
                employee.managerEmployeeCode,
                employee.ManagerEmployeeCode,
                employee.managerCode,
                employee.ManagerCode,
                managerObject?.employeeCode,
                managerObject?.EmployeeCode,
                managerObject?.employee_code,
                managerObject?.employeeCodeValue,
                managerObject?.code,
                managerObject?.Code,
                managerObject?.employee_code_value
            )
        ),
        id: normalize(
            firstValue(
                employee.managerId,
                employee.ManagerId,
                employee.reportingManagerId,
                employee.ReportingManagerId,
                managerObject?.id,
                managerObject?.Id,
                managerObject?.employeeId,
                managerObject?.EmployeeId,
                managerObject?.employeeID,
                managerObject?.employee_id
            )
        ),
        name: normalize(
            firstValue(
                employee.managerName,
                employee.ManagerName,
                employee.reportingManagerName,
                employee.ReportingManagerName,
                managerObject?.fullName,
                managerObject?.FullName,
                managerObject
                    ? `${managerObject.firstName || managerObject.FirstName || ""} ${managerObject.lastName || managerObject.LastName || ""}`.trim()
                    : ""
            )
        ),
    };
};

const getUniqueKey = (employee, index) =>
    normalize(getEmployeeCode(employee)) ||
    normalize(getEmployeeId(employee)) ||
    `employee-${index}`;

/**
 * Fetch as much of the paginated employee collection as the API exposes.
 * This prevents a PageSize=100 limit from silently hiding employees.
 */
const extractItems = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.value?.data)) return response.value.data;
    if (Array.isArray(response.value?.items)) return response.value.items;
    if (Array.isArray(response.value)) return response.value;
    return [];
};

const getPagination = (response) => {
    const root = response?.data && !Array.isArray(response.data) ? response.data : response;
    const value = response?.value && !Array.isArray(response.value) ? response.value : null;

    return {
        pageNumber: Number(
            firstValue(
                root?.pageNumber,
                root?.PageNumber,
                root?.currentPage,
                root?.CurrentPage,
                value?.pageNumber,
                value?.PageNumber
            )
        ) || 1,
        pageSize: Number(
            firstValue(
                root?.pageSize,
                root?.PageSize,
                value?.pageSize,
                value?.PageSize
            )
        ) || 100,
        totalPages: Number(
            firstValue(
                root?.totalPages,
                root?.TotalPages,
                value?.totalPages,
                value?.TotalPages
            )
        ) || 0,
        totalCount: Number(
            firstValue(
                root?.totalCount,
                root?.TotalCount,
                root?.totalItems,
                root?.TotalItems,
                value?.totalCount,
                value?.TotalCount
            )
        ) || 0,
    };
};

async function fetchAllEmployees() {
    const pageSize = 100;
    const collected = [];
    const seen = new Set();

    let page = 1;
    let firstPagination = null;

    // Hard safety limit prevents a broken API from causing an infinite loop.
    for (let request = 0; request < 100; request += 1) {
        const response = await getEmployees({
            PageNumber: page,
            PageSize: pageSize,
        });

        const items = extractItems(response);
        const pagination = getPagination(response);

        if (!firstPagination) firstPagination = pagination;

        let added = 0;
        items.forEach((employee, index) => {
            const key = getUniqueKey(employee, collected.length + index);
            if (!seen.has(key)) {
                seen.add(key);
                collected.push(employee);
                added += 1;
            }
        });

        // If the API ignores pagination and returns the same records again,
        // stop instead of looping forever.
        if (items.length === 0 || added === 0) break;

        if (pagination.totalPages > 0) {
            if (page >= pagination.totalPages) break;
            page += 1;
            continue;
        }

        if (pagination.totalCount > 0 && collected.length >= pagination.totalCount) break;

        // Generic fallback for APIs without pagination metadata.
        if (items.length < pageSize) break;

        page += 1;
    }

    return {
        employees: collected,
        pagination: firstPagination,
    };
}

function EmployeeCard({ employee, childCount, collapsed, onToggle }) {
    const role = getEmployeeRole(employee);
    const status = getEmployeeStatus(employee);
    const isAdmin = role === "Admin";
    const isManager = role === "Manager";
    const code = getEmployeeCode(employee);

    return (
        <div
            style={{
                width: isAdmin ? 270 : isManager ? 240 : 220,
                minWidth: isAdmin ? 270 : isManager ? 240 : 220,
                boxSizing: "border-box",
                background: isAdmin
                    ? "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
                    : isManager
                        ? "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)"
                        : "#ffffff",
                border: `1.5px solid ${isAdmin ? "#6366f1" : isManager ? "#60a5fa" : "#d7dee8"}`,
                borderRadius: 14,
                padding: "15px 16px 13px",
                boxShadow: isAdmin
                    ? "0 8px 22px rgba(79,70,229,0.12)"
                    : "0 4px 14px rgba(15,23,42,0.07)",
                position: "relative",
                zIndex: 3,
                textAlign: "center",
            }}
        >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <div
                    style={{
                        width: isAdmin ? 42 : 36,
                        height: isAdmin ? 42 : 36,
                        borderRadius: 11,
                        background: isAdmin ? "#4f46e5" : isManager ? "#2563eb" : "#64748b",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon
                        name={isAdmin ? "shield" : isManager ? "briefcase" : "user"}
                        size={isAdmin ? 20 : 17}
                    />
                </div>
            </div>

            <div
                title={getEmployeeName(employee)}
                style={{
                    fontSize: isAdmin ? 15 : 13.5,
                    fontWeight: 700,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {getEmployeeName(employee)}
            </div>

            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3 }}>
                Code:{" "}
                <strong style={{ color: isAdmin ? "#4f46e5" : "#2563eb" }}>
                    {code || "—"}
                </strong>
            </div>

            <div
                title={getEmployeeEmail(employee)}
                style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {getEmployeeEmail(employee)}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 9,
                    flexWrap: "wrap",
                }}
            >
                <Badge type="role" value={role} />
                <Badge type="status" value={status} />
            </div>

            {childCount > 0 && (
                <div
                    style={{
                        marginTop: 10,
                        paddingTop: 7,
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>
                        {childCount} {childCount === 1 ? "Report" : "Reports"}
                    </span>

                    <button
                        type="button"
                        onClick={onToggle}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            padding: "3px 7px",
                            fontSize: 10.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#334155",
                        }}
                    >
                        {collapsed ? "Expand" : "Collapse"}
                        <span style={{ marginLeft: 4 }}>
                            {collapsed ? "›" : "⌄"}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Recursive chart.
 *
 * Important layout change:
 * Each child gets its own fixed-width "column". The parent horizontal
 * connector spans the complete child row, while each child has a vertical
 * connector from the shared line into its card.
 */
const GRAPH_NODE_WIDTH = 240;
const GRAPH_NODE_GAP = 28;
const GRAPH_LEVEL_GAP = 86;
const GRAPH_PADDING_X = 56;
const GRAPH_PADDING_Y = 48;

function GraphEmployeeCard({ employee, childCount, collapsed, onToggle }) {
    const role = getEmployeeRole(employee);
    const status = getEmployeeStatus(employee);
    const isAdmin = role === "Admin";
    const isManager = role === "Manager";
    const code = getEmployeeCode(employee);

    return (
        <div
            style={{
                width: GRAPH_NODE_WIDTH,
                minHeight: 164,
                boxSizing: "border-box",
                background: "#ffffff",
                border: `1px solid ${isAdmin ? "#6366f1" : isManager ? "#60a5fa" : "#dbe2ea"}`,
                borderRadius: 14,
                padding: "14px 15px 12px",
                boxShadow: isAdmin
                    ? "0 7px 20px rgba(79,70,229,0.12)"
                    : "0 4px 14px rgba(15,23,42,0.07)",
                position: "relative",
                zIndex: 2,
                textAlign: "center",
            }}
        >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
                <div
                    style={{
                        width: isAdmin ? 40 : 35,
                        height: isAdmin ? 40 : 35,
                        borderRadius: 10,
                        background: isAdmin ? "#4f46e5" : isManager ? "#2563eb" : "#64748b",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon
                        name={isAdmin ? "shield" : isManager ? "briefcase" : "user"}
                        size={isAdmin ? 19 : 16}
                    />
                </div>
            </div>

            <div
                title={getEmployeeName(employee)}
                style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {getEmployeeName(employee)}
            </div>

            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                Code:{" "}
                <strong style={{ color: isAdmin ? "#4f46e5" : "#2563eb" }}>
                    {code || "—"}
                </strong>
            </div>

            <div
                title={getEmployeeEmail(employee)}
                style={{
                    fontSize: 10.5,
                    color: "#94a3b8",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {getEmployeeEmail(employee)}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 5,
                    marginTop: 8,
                    flexWrap: "wrap",
                }}
            >
                <Badge type="role" value={role} />
                <Badge type="status" value={status} />
            </div>

            {childCount > 0 && (
                <div
                    style={{
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: "1px solid #eef2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748b" }}>
                        {childCount} {childCount === 1 ? "Report" : "Reports"}
                    </span>

                    <button
                        type="button"
                        onClick={onToggle}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #d5dce5",
                            borderRadius: 6,
                            padding: "3px 7px",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#334155",
                        }}
                    >
                        {collapsed ? "Expand" : "Collapse"} {collapsed ? "›" : "⌄"}
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Calculates a deterministic tree layout.
 *
 * Every node receives a real x/y coordinate. A parent's x-coordinate is the
 * midpoint of its children's occupied range, which means:
 * - no child cards overlap
 * - wide teams expand naturally
 * - parent/child connectors always meet card centres
 * - the whole graph has a measurable width for horizontal scrolling
 */
function calculateGraphLayout(roots, collapsedNodes, onToggleNode) {
    const nodes = [];
    const edges = [];
    let nextId = 0;

    const visibleChildren = (node) => {
        const code = getEmployeeCode(node.employee);
        const collapsed = Boolean(collapsedNodes[code]) && !node.forceExpand;
        return collapsed ? [] : node.children || [];
    };

    const measure = (node) => {
        const children = visibleChildren(node);

        if (children.length === 0) {
            node.__graphWidth = GRAPH_NODE_WIDTH;
            return GRAPH_NODE_WIDTH;
        }

        const childrenWidth =
            children.reduce((sum, child) => sum + measure(child), 0) +
            GRAPH_NODE_GAP * (children.length - 1);

        node.__graphWidth = Math.max(GRAPH_NODE_WIDTH, childrenWidth);
        return node.__graphWidth;
    };

    roots.forEach(measure);

    const place = (node, left, depth, parentPlaced = null) => {
        const width = node.__graphWidth || GRAPH_NODE_WIDTH;
        const children = visibleChildren(node);

        const x = left + width / 2 - GRAPH_NODE_WIDTH / 2;
        const y = depth * (164 + GRAPH_LEVEL_GAP);

        const placed = {
            id: `graph-node-${nextId++}`,
            node,
            x,
            y,
            width: GRAPH_NODE_WIDTH,
            height: 164,
            depth,
        };

        nodes.push(placed);

        if (parentPlaced) {
            edges.push({
                parent: parentPlaced,
                child: placed,
            });
        }

        if (children.length > 0) {
            const totalChildrenWidth =
                children.reduce((sum, child) => sum + child.__graphWidth, 0) +
                GRAPH_NODE_GAP * (children.length - 1);

            let childLeft = left + (width - totalChildrenWidth) / 2;

            children.forEach((child) => {
                place(child, childLeft, depth + 1, placed);
                childLeft += child.__graphWidth + GRAPH_NODE_GAP;
            });
        }
    };

    let rootLeft = GRAPH_PADDING_X;

    roots.forEach((root) => {
        place(root, rootLeft, 0);
        rootLeft += root.__graphWidth + GRAPH_NODE_GAP * 2;
    });

    const maxX = nodes.reduce(
        (max, node) => Math.max(max, node.x + node.width),
        GRAPH_NODE_WIDTH
    );

    const maxY = nodes.reduce(
        (max, node) => Math.max(max, node.y + node.height),
        164
    );

    return {
        nodes,
        edges,
        width: maxX + GRAPH_PADDING_X,
        height: maxY + GRAPH_PADDING_Y,
    };
}

function OrganizationGraph({ roots, collapsedNodes, onToggleNode }) {
    const layout = useMemo(
        () => calculateGraphLayout(roots, collapsedNodes, onToggleNode),
        [roots, collapsedNodes, onToggleNode]
    );

    return (
        <div
            style={{
                position: "relative",
                width: layout.width,
                height: layout.height,
                minWidth: "100%",
                minHeight: 500,
            }}
        >
            {/* SVG is only responsible for relationship lines. Cards remain
                normal HTML so text, buttons and badges stay accessible. */}
            <svg
                width={layout.width}
                height={layout.height}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
                aria-hidden="true"
            >
                <defs>
                    <filter id="orgGraphLineShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.08" />
                    </filter>
                </defs>

                {layout.edges.map(({ parent, child }, index) => {
                    const startX = parent.x + parent.width / 2;
                    const startY = parent.y + parent.height;
                    const endX = child.x + child.width / 2;
                    const endY = child.y;
                    const middleY = startY + (endY - startY) / 2;

                    return (
                        <path
                            key={`edge-${index}`}
                            d={`M ${startX} ${startY}
                                L ${startX} ${middleY}
                                L ${endX} ${middleY}
                                L ${endX} ${endY}`}
                            fill="none"
                            stroke="#a8b3c2"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#orgGraphLineShadow)"
                        />
                    );
                })}
            </svg>

            {layout.nodes.map((placed) => (
                <div
                    key={placed.id}
                    style={{
                        position: "absolute",
                        left: placed.x,
                        top: placed.y,
                        width: placed.width,
                        height: placed.height,
                    }}
                >
                    <GraphEmployeeCard
                        employee={placed.node.employee}
                        childCount={placed.node.children?.length || 0}
                        collapsed={
                            Boolean(collapsedNodes[getEmployeeCode(placed.node.employee)]) &&
                            !placed.node.forceExpand
                        }
                        onToggle={() =>
                            onToggleNode(getEmployeeCode(placed.node.employee))
                        }
                    />
                </div>
            ))}
        </div>
    );
}

function IndentedTreeNodeCard({ node, collapsedNodes, onToggleNode }) {
    const employee = node.employee;
    const children = node.children || [];
    const code = getEmployeeCode(employee);
    const role = getEmployeeRole(employee);
    const status = getEmployeeStatus(employee);
    const isAdmin = role === "Admin";
    const isManager = role === "Manager";
    const collapsed = Boolean(collapsedNodes[code]) && !node.forceExpand;

    return (
        <div style={{ position: "relative", marginBottom: 12 }}>
            <div
                style={{
                    background: "#fff",
                    border: `1.5px solid ${isAdmin ? "#818cf8" : isManager ? "#93c5fd" : "#e2e8f0"}`,
                    borderRadius: 12,
                    padding: "15px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: isAdmin ? "#4f46e5" : isManager ? "#2563eb" : "#f1f5f9",
                            color: isAdmin || isManager ? "#fff" : "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        <Icon name={isAdmin ? "shield" : isManager ? "briefcase" : "user"} size={18} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                            {getEmployeeName(employee)}
                            {isAdmin && (
                                <span
                                    style={{
                                        marginLeft: 8,
                                        fontSize: 10.5,
                                        background: "#4f46e5",
                                        color: "#fff",
                                        padding: "2px 6px",
                                        borderRadius: 10,
                                    }}
                                >
                                    Administrator
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Code: <strong style={{ color: "#2563eb" }}>{code || "—"}</strong>
                            {" · "}
                            {getEmployeeEmail(employee)}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge type="role" value={role} />
                    <Badge type="status" value={status} />

                    {children.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onToggleNode(code)}
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                borderRadius: 8,
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#334155",
                                cursor: "pointer",
                            }}
                        >
                            {children.length} {children.length === 1 ? "Report" : "Reports"}{" "}
                            {collapsed ? "›" : "⌄"}
                        </button>
                    )}
                </div>
            </div>

            {children.length > 0 && !collapsed && (
                <div
                    style={{
                        marginLeft: 28,
                        paddingLeft: 16,
                        borderLeft: "2px dashed #cbd5e1",
                        marginTop: 8,
                    }}
                >
                    {children.map((child, index) => (
                        <IndentedTreeNodeCard
                            key={getUniqueKey(child.employee, index)}
                            node={child}
                            collapsedNodes={collapsedNodes}
                            onToggleNode={onToggleNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Builds a real forest from the employee data.
 *
 * Unlike the old implementation, this does NOT:
 *   "attach every orphan to the first Admin".
 *
 * That was a major source of incorrect hierarchy and can make the chart
 * appear to lose or misplace employees.
 */
function buildOrganizationTree(employees) {
    const records = employees.map((employee, index) => ({
        employee,
        children: [],
        parent: null,
        index,
    }));

    const byCode = new Map();
    const byId = new Map();
    const byName = new Map();

    records.forEach((record) => {
        const code = normalize(getEmployeeCode(record.employee));
        const id = normalize(getEmployeeId(record.employee));
        const name = normalize(getEmployeeName(record.employee));

        if (code) byCode.set(code, record);
        if (id) byId.set(id, record);

        // Only use names when unique. Matching "John" to the wrong John
        // is worse than leaving the employee temporarily unassigned.
        if (name) {
            if (byName.has(name)) byName.set(name, null);
            else byName.set(name, record);
        }
    });

    records.forEach((record) => {
        const employee = record.employee;
        const selfCode = normalize(getEmployeeCode(employee));
        const selfId = normalize(getEmployeeId(employee));
        const refs = getManagerReferences(employee);

        let manager = null;

        // Most reliable: manager employee code.
        if (refs.code && refs.code !== selfCode) {
            manager = byCode.get(refs.code) || null;
        }

        // Next: manager database ID.
        if (!manager && refs.id && refs.id !== selfId) {
            manager = byId.get(refs.id) || null;

            // Some API projections expose ManagerId but populate it with the
            // employee code rather than the internal database Id. Supporting
            // both makes the chart independent of that DTO detail.
            if (!manager) {
                manager = byCode.get(refs.id) || null;
            }
        }

        // Last resort: unique manager name.
        if (!manager && refs.name) {
            const candidate = byName.get(refs.name);
            if (candidate && candidate !== record) manager = candidate;
        }

        // Never allow self-parenting.
        if (manager && manager !== record) {
            record.parent = manager;
            manager.children.push(record);
        }
    });

    // Break cycles. A cycle means A reports to B while B eventually reports
    // back to A. Both records must still be visible.
    const state = new Map();

    const visit = (record) => {
        const current = state.get(record) || 0;

        if (current === 1) {
            const parent = record.parent;
            if (parent) {
                parent.children = parent.children.filter((child) => child !== record);
                record.parent = null;
            }
            return;
        }

        if (current === 2) return;

        state.set(record, 1);
        record.children.forEach(visit);
        state.set(record, 2);
    };

    records.forEach(visit);

    // Preserve every employee. Roots are employees without a valid manager.
    // Multiple roots are legitimate when the API contains separate branches
    // or when a manager is missing from the returned dataset.
    const roots = records.filter((record) => record.parent === null);

    // Keep the unresolved manager reference on the node for diagnostics.
    // The UI can still display the employee, but this prevents the data issue
    // from being mistaken for a valid top-level employee.
    records.forEach((record) => {
        if (record.parent !== null) return;

        const refs = getManagerReferences(record.employee);
        const hasManagerReference = Boolean(refs.code || refs.id || refs.name);

        if (hasManagerReference) {
            record.unresolvedManagerReference = refs;
        }
    });

    // Sort each branch consistently: Admin -> Manager -> Member -> name.
    const roleWeight = (employee) => {
        const role = getEmployeeRole(employee);
        if (role === "Admin") return 0;
        if (role === "Manager") return 1;
        return 2;
    };

    const sortBranch = (recordsToSort) => {
        recordsToSort.sort((a, b) => {
            const roleDifference = roleWeight(a.employee) - roleWeight(b.employee);
            if (roleDifference !== 0) return roleDifference;
            return getEmployeeName(a.employee).localeCompare(getEmployeeName(b.employee));
        });

        recordsToSort.forEach((record) => sortBranch(record.children));
    };

    sortBranch(roots);

    if (process.env.NODE_ENV !== "production") {
        const unresolved = records.filter((record) => record.unresolvedManagerReference);
        if (unresolved.length > 0) {
            console.warn(
                "[OrganizationChart] Employees with unresolved manager references:",
                unresolved.map((record) => ({
                    employee: getEmployeeCode(record.employee) || getEmployeeName(record.employee),
                    managerReference: record.unresolvedManagerReference,
                }))
            );
        }
    }

    return roots;
}

export default function OrganizationPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [collapsedNodes, setCollapsedNodes] = useState({});
    const [viewMode, setViewMode] = useState("chart");

    useEffect(() => {
        let cancelled = false;

        const fetchOrgData = async () => {
            setLoading(true);

            try {
                const result = await fetchAllEmployees();

                if (!cancelled) {
                    setEmployees(result.employees);

                    // Do not collapse every branch when the data is refreshed.
                    // A manager can have a perfectly valid newly-created report
                    // in the database while the UI hides that relationship simply
                    // because the manager was collapsed during initialization.
                    //
                    // The graph is expanded by default. Users can still collapse
                    // any branch explicitly using its Collapse button.
                    setCollapsedNodes({});
                }
            } catch (error) {
                console.error("Failed to load organization hierarchy:", error);

                if (!cancelled) setEmployees([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchOrgData();

        return () => {
            cancelled = true;
        };
    }, []);

    const treeData = useMemo(
        () => buildOrganizationTree(employees),
        [employees]
    );

    const stats = useMemo(() => {
        let admins = 0;
        let managers = 0;
        let members = 0;

        employees.forEach((employee) => {
            const role = getEmployeeRole(employee);
            if (role === "Admin") admins += 1;
            else if (role === "Manager") managers += 1;
            else members += 1;
        });

        return {
            total: employees.length,
            admins,
            managers,
            members,
        };
    }, [employees]);

    const filterNodes = (nodes, query) => {
        const q = normalize(query);

        if (!q) return nodes;

        return nodes
            .map((node) => {
                const employee = node.employee;

                const searchable = [
                    getEmployeeName(employee),
                    getEmployeeCode(employee),
                    getEmployeeEmail(employee),
                    getEmployeeRole(employee),
                    getEmployeeStatus(employee),
                ]
                    .map(normalize)
                    .join(" ");

                const children = filterNodes(node.children, query);

                if (searchable.includes(q) || children.length > 0) {
                    return {
                        ...node,
                        children,
                        forceExpand: true,
                    };
                }

                return null;
            })
            .filter(Boolean);
    };

    const filteredTree = useMemo(
        () => filterNodes(treeData, searchTerm),
        [treeData, searchTerm]
    );

    const handleToggleNode = (code) => {
        if (!code) return;

        setCollapsedNodes((previous) => ({
            ...previous,
            [code]: !previous[code],
        }));
    };

    const handleExpandAll = () => {
        setCollapsedNodes({});
    };

    const handleCollapseAll = () => {
        const next = {};

        employees.forEach((employee) => {
            const code = getEmployeeCode(employee);
            if (code) next[code] = true;
        });

        setCollapsedNodes(next);
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Organization Hierarchy", active: true },
    ];

    return (
        <PageContainer title="Organization Hierarchy" breadcrumbs={breadcrumbs}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                    Organization Structure
                </h2>
                <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                    A complete reporting hierarchy based on each employee's assigned reporting manager.
                </p>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {[
                    ["Total Headcount", stats.total, "#0f172a"],
                    ["Administrators", stats.admins, "#4f46e5"],
                    ["Reporting Managers", stats.managers, "#2563eb"],
                    ["Team Members", stats.members, "#059669"],
                ].map(([label, value, color]) => (
                    <div
                        key={label}
                        style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: 16,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                            {label}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 14,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 24,
                }}
            >
                <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 420 }}>
                    <div
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94a3b8",
                        }}
                    >
                        <Icon name="search" size={16} />
                    </div>

                    <input
                        type="text"
                        placeholder="Search employee by name, code, email..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "9px 12px 9px 36px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 14,
                            outline: "none",
                        }}
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            background: "#f1f5f9",
                            padding: 3,
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        {[
                            ["chart", "Org Chart"],
                            ["list", "List View"],
                        ].map(([mode, label]) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewMode(mode)}
                                style={{
                                    padding: "6px 13px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: viewMode === mode ? "#fff" : "transparent",
                                    color: viewMode === mode ? "#2563eb" : "#64748b",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    boxShadow:
                                        viewMode === mode
                                            ? "0 1px 3px rgba(0,0,0,0.1)"
                                            : "none",
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleExpandAll}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            padding: "8px 13px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                        }}
                    >
                        Expand All
                    </button>

                    <button
                        type="button"
                        onClick={handleCollapseAll}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            padding: "8px 13px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                        }}
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {loading ? (
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: 60,
                        textAlign: "center",
                        color: "#64748b",
                    }}
                >
                    Loading organization hierarchy...
                </div>
            ) : filteredTree.length === 0 ? (
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: 48,
                        textAlign: "center",
                        color: "#64748b",
                    }}
                >
                    <Icon name="search" size={36} color="#94a3b8" />
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#1e293b",
                            marginTop: 12,
                        }}
                    >
                        No employees found.
                    </div>
                </div>
            ) : viewMode === "chart" ? (
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        overflowX: "auto",
                        overflowY: "auto",
                        minHeight: 520,
                        maxHeight: "calc(100vh - 260px)",
                        position: "relative",
                        scrollbarGutter: "stable",
                    }}
                >
                    {/*
                     * The graph itself has a calculated width. The viewport
                     * scrolls horizontally when a manager has many reports.
                     *
                     * Important: no CSS grid/flex wrapping is used for graph
                     * nodes, so a large team can never overlap or disappear.
                     */}
                    <div
                        style={{
                            width: "max-content",
                            minWidth: "100%",
                            display: "flex",
                            justifyContent: "center",
                            boxSizing: "border-box",
                            padding: "42px 0 64px",
                        }}
                    >
                        <OrganizationGraph
                            roots={filteredTree}
                            collapsedNodes={collapsedNodes}
                            onToggleNode={handleToggleNode}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {filteredTree.map((root, index) => (
                        <IndentedTreeNodeCard
                            key={getUniqueKey(root.employee, index)}
                            node={root}
                            collapsedNodes={collapsedNodes}
                            onToggleNode={handleToggleNode}
                        />
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
