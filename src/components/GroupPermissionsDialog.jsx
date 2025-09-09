import React, { useEffect, useMemo, useState } from "react";
import { Search, Shield, Box, Info } from "lucide-react";

const KEY_SEP = "::";

export default function GroupPermissionsDialog({
  open,
  onClose,
  onSave,
  permissions = {},
  mode = "create",
  initialName = "",
  initialPermissionIds = [],
  readOnlyName = false,
  schoolId,
}) {
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [permissionsState, setPermissionsState] = useState({});
  const [customState, setCustomState] = useState({});

  const [models, customPermissions, modelList] = useMemo(() => {
    const models = {};
    const customs = [];
    const modelList = [];

    Object.entries(permissions.data || {}).forEach(([modelName, perms]) => {
      const appLabel = "default_app";
      const modelKey = modelName.toLowerCase().replaceAll(" ", "_");

      if (!models[appLabel]) models[appLabel] = {};
      if (!models[appLabel][modelKey]) models[appLabel][modelKey] = {};

      perms.forEach((perm) => {
        const action = perm.name.toLowerCase();
        const codename = `${action}_${modelKey}`;
        const displayName = `${modelName} | ${perm.name.charAt(0).toUpperCase() + perm.name.slice(1)}`;

        const permissionObj = {
          id: perm.id,
          app_label: appLabel,
          display_name: displayName,
          codename,
          name: perm.name,
        };

        if (["add", "change", "delete", "view"].includes(action)) {
          models[appLabel][modelKey][action] = permissionObj;
        } else {
          customs.push(permissionObj);
        }
      });

      modelList.push({
        key: `${appLabel}${KEY_SEP}${modelKey}`,
        label: modelName
          .replaceAll("_", " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        app: appLabel,
        modelName: modelKey,
      });
    });

    return [models, customs, modelList];
  }, [permissions]);

  const ACTION_KEYS = ["view", "add", "change", "delete"];

  const ACTION_GROUPS = [
    {
      key: "crud",
      label: "Model Permissions",
      actions: [
        { key: "view", label: "Read" },
        { key: "add", label: "Create" },
        { key: "change", label: "Update" },
        { key: "delete", label: "Delete" },
      ],
    },
  ];

  // Initialize states when dialog opens or when initialPermissionIds changes
  useEffect(() => {
    if (open && modelList.length > 0) {
      // Initialize permission states
      const state = {};
      modelList.forEach((m) => {
        state[m.key] = {};
        ACTION_KEYS.forEach((k) => {
          const permId = models[m.app]?.[m.modelName]?.[k]?.id;
          state[m.key][k] = permId ? initialPermissionIds.includes(permId) : false;
        });
      });
      setPermissionsState(state);

      // Initialize custom permission states
      const customInit = Object.fromEntries(
        customPermissions.map((p) => [p.id, initialPermissionIds.includes(p.id)])
      );
      setCustomState(customInit);
    }
  }, [open, modelList, customPermissions, initialPermissionIds, models]);

  // Set group name when dialog opens or initialName changes
  useEffect(() => {
    if (open) {
      setGroupName(initialName);
    }
  }, [open, initialName]);

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const setCell = (modelKey, actionKey, value) => {
    setPermissionsState((prev) => ({
      ...prev,
      [modelKey]: { ...prev[modelKey], [actionKey]: value },
    }));
  };

  const columnState = (actionKey) => {
    const values = modelList.map((m) => permissionsState[m.key]?.[actionKey] || false);
    const all = values.every(Boolean);
    const none = values.every((v) => !v);
    return { all, none, indeterminate: !all && !none };
  };

  const toggleColumn = (actionKey, value) => {
    setPermissionsState((prev) => {
      const next = { ...prev };
      modelList.forEach((m) => {
        next[m.key] = { ...next[m.key], [actionKey]: value };
      });
      return next;
    });
  };

  const buildPayload = () => {
    const selectedIds = [];
    Object.keys(permissionsState).forEach((key) => {
      const [app, modelName] = key.split(KEY_SEP);
      ACTION_KEYS.forEach((k) => {
        if (permissionsState[key][k]) {
          const p = models[app]?.[modelName]?.[k];
          if (p) selectedIds.push(p.id);
        }
      });
    });
    Object.keys(customState).forEach((id) => {
      if (customState[id]) selectedIds.push(Number(id));
    });

    const base = {
      name: groupName.trim(),
      permission_ids: selectedIds,
    };

    return schoolId ? { ...base, school_id: schoolId } : base;
  };

  const handleSave = () => {
    const payload = buildPayload();
    if (!payload.name) return alert("Please enter a group name");
    onSave?.(payload);
  };

  const title =
    mode === "create"
      ? "Create New Group"
      : readOnlyName
        ? `Manage Permissions for ${initialName}`
        : `Edit Group`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[95vw] max-w-6xl bg-white rounded-2xl shadow-lg border border-blue-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <Shield className="text-xl text-blue-600" />
            <h3 className="text-xl font-semibold text-blue-800">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
            >
              Save
            </button>
          </div>
        </div>

        <div className="px-6 pt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-blue-700">Group name</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Project Managers"
              disabled={readOnlyName}
              className={`mt-1 w-full rounded-xl border border-blue-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${readOnlyName ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>
        </div>

        <div className="px-6 py-4 flex items-center gap-3 bg-blue-50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter on models"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-blue-600">
            <Info size={16} />
            <span>Tip: Use the header checkboxes to grant a permission to all models.</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-auto rounded-xl border border-blue-200 max-h-[52vh] md:max-h-[54vh] shadow-inner bg-white">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 bg-blue-100 text-blue-800">
                {ACTION_GROUPS.map((group, gIdx) => (
                  <tr key={group.key}>
                    <th className="sticky left-0 z-20 text-left p-3 text-xs font-semibold bg-blue-100">
                      {gIdx === 0 ? "Models" : ""}
                    </th>
                    {group.actions.map((action) => {
                      const state = columnState(action.key);
                      return (
                        <th key={action.key} className="p-3 text-xs font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <span>{action.label}</span>
                            <HeaderCheckbox
                              checked={state.all}
                              indeterminate={state.indeterminate}
                              onChange={(v) => toggleColumn(action.key, v)}
                              ariaLabel={`Toggle all ${action.label}`}
                            />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {Object.entries(models).map(([app, appModels]) => {
                  let filteredModels = Object.entries(appModels);
                  if (query.trim()) {
                    const q = query.toLowerCase();
                    filteredModels = filteredModels.filter(
                      ([modelName]) =>
                        modelName.toLowerCase().includes(q) ||
                        app.toLowerCase().includes(q) ||
                        `${app}.${modelName}`.toLowerCase().includes(q)
                    );
                  }
                  if (filteredModels.length === 0) return null;

                  return (
                    <React.Fragment key={app}>
                      <tr className="bg-blue-50 font-semibold text-blue-700">
                        <td colSpan={ACTION_GROUPS[0].actions.length + 1} className="p-3 text-sm uppercase tracking-wide">
                          {app}
                        </td>
                      </tr>
                      {filteredModels.map(([modelName, actionMap]) => {
                        const rowKey = `${app}${KEY_SEP}${modelName}`;
                        return (
                          <tr key={rowKey} className="hover:bg-blue-50 transition-colors">
                            <td className="sticky left-0 z-10 p-3 bg-white border-r border-blue-200">
                              <div className="flex items-center gap-3">
                                <Box className="text-blue-400" size={16} />
                                <div>
                                  <div className="text-sm font-medium text-blue-800">
                                    {modelName
                                      .replaceAll("_", " ")
                                      .split(" ")
                                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                      .join(" ")}
                                  </div>
                                  <div className="text-xs text-blue-500">{app}.{modelName}</div>
                                </div>
                              </div>
                            </td>
                            {ACTION_GROUPS[0].actions.map((a) => {
                              const p = actionMap[a.key];
                              if (!p) return <td key={a.key} className="p-2 text-center text-blue-400">-</td>;
                              return (
                                <td key={a.key} className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                    checked={permissionsState[rowKey]?.[a.key] || false}
                                    onChange={(e) => setCell(rowKey, a.key, e.target.checked)}
                                    aria-label={`${app}.${modelName} – ${a.label}`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {(!permissions.data || Object.keys(permissions.data).length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-blue-500">
                      No permissions available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {customPermissions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                <Shield size={18} className="text-blue-600" />
                Custom Permissions
              </h3>
              <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                {customPermissions
                  .filter(
                    (p) =>
                      !query.trim() ||
                      p.name?.toLowerCase().includes(query.toLowerCase()) ||
                      p.codename?.toLowerCase().includes(query.toLowerCase()) ||
                      p.display_name?.toLowerCase().includes(query.toLowerCase())
                  )
                  .map((p) => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded-md transition-colors">
                      <input
                        type="checkbox"
                        checked={customState[p.id] || false}
                        onChange={(e) => setCustomState((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-blue-800">{p.display_name || p.name}</div>
                        <div className="text-xs text-blue-500">({p.codename})</div>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* header checkbox with indeterminate state */
function HeaderCheckbox({ checked, indeterminate, onChange, ariaLabel }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
      checked={!!checked}
      onChange={(e) => onChange?.(e.target.checked)}
    />
  );
}