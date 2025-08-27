import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit3, Shield, Trash2, X, Loader2, Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";

/* ----------------------------- API LAYER ----------------------------- */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const HEADERS = (token) => {
  const base = { "Content-Type": "application/json" };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
};

async function http(method, url, body) {
  let token = Cookies.get("access_token");

  const attemptRequest = async (useToken) => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers: HEADERS(useToken),
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (res.status === 304) return data || {};

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && (data.detail || data.message)) ||
        (typeof data === "string" && data) ||
        `${res.status} ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  };

  try {
    return await attemptRequest(token);
  } catch (error) {
    if (error.status === 401 && String(error.message || "").includes("Authentication credentials")) {
      try {
        token = await refreshToken();
        return await attemptRequest(token);
      } catch {
        throw new Error("Authentication failed. Please log in again.");
      }
    }
    throw error;
  }
}

async function refreshToken() {
  const refresh = Cookies.get("refresh_token");
  if (!refresh) throw new Error("No refresh token available");
  const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    credentials: "include",
  });
  const data = await res.json();
  if (res.ok) {
    Cookies.set("access_token", data.access, { expires: 7, secure: true, sameSite: "Strict" });
    return data.access;
  }
  throw new Error("Token refresh failed");
}

// Group API
async function fetchGroups() {
  const res = await http("GET", "/groups/");
  return Array.isArray(res) ? res : res?.results || [];
}
async function createGroup(payload) { return http("POST", "/groups/", payload); }
async function updateGroup(id, payload) { return http("PUT", `/groups/${id}/`, payload); }
async function deleteGroup(id) { return http("DELETE", `/groups/${id}/`); }
async function fetchGroupDetails(id) { return http("GET", `/groups/${id}/`); }
async function addPermissionsToGroup(groupId, permissionIds) {
  return http("POST", `/groups/${groupId}/add_permissions/`, { permission_ids: permissionIds });
}
async function removePermissionsFromGroup(groupId, permissionIds) {
  return http("POST", `/groups/${groupId}/remove_permissions/`, { permission_ids: permissionIds });
}
async function fetchAvailablePermissions() {
  const res = await http("GET", "/groups/available_permissions/");
  return Array.isArray(res) ? res : res?.results || [];
}

// Users API
async function fetchUsers() {
  const [teachers, parents, staff, students] = await Promise.allSettled([
    http("GET", "/auth/users/list_profiles/teacher/"),
    http("GET", "/auth/users/list_profiles/parent/"),
    http("GET", "/auth/users/list_profiles/staff/"),
    http("GET", "/auth/users/list_profiles/student/")
  ]);

  let all = [];
  if (teachers.status === "fulfilled") {
    const d = Array.isArray(teachers.value) ? teachers.value : teachers.value?.results || [];
    all = all.concat(d.map(u => ({ ...u, user_type: "teacher" })));
  }
  if (parents.status === "fulfilled") {
    const d = Array.isArray(parents.value) ? parents.value : parents.value?.results || [];
    all = all.concat(d.map(u => ({ ...u, user_type: "parent" })));
  }
  if (staff.status === "fulfilled") {
    const d = Array.isArray(staff.value) ? staff.value : staff.value?.results || [];
    all = all.concat(d.map(u => ({ ...u, user_type: "staff" })));
  }
  if (students.status === "fulfilled") {
    const d = Array.isArray(students.value) ? students.value : students.value?.results || [];
    all = all.concat(d.map(u => ({ ...u, user_type: "student" })));
  }

  return all;
}
async function fetchGroupUsers(groupId) {
  const res = await http("GET", `/groups/${groupId}/`);
  return Array.isArray(res.users) ? res.users : res?.user_set || [];
}
async function addUsersToGroup(groupId, userIds) {
  return http("POST", `/groups/${groupId}/add_users/`, { user_ids: userIds });
}
async function removeUsersFromGroup(groupId, userIds) {
  return http("POST", `/groups/${groupId}/remove_users/`, { user_ids: userIds });
}
async function fetchSchoolId() {
  const res = await http("GET", "/schools/");
  const schools = Array.isArray(res.results) ? res.results : [];
  return schools.length > 0 ? schools[0].id : null;
}

/* ----------------------------- Main Component ----------------------------- */

export default function PermissionsPage() {
  const navigate = useNavigate();
  const [groupSearch, setGroupSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingUsers, setSavingUsers] = useState(false);
  const [authIssue, setAuthIssue] = useState(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [schoolId, setSchoolId] = useState(null);

  /* ---------- Toast helpers ---------- */
  const confirmToast = (message = "Are you sure?") =>
    new Promise((resolve) => {
      const id = toast.custom(
        (t) => (
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-800">{message}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => { toast.dismiss(id); resolve(true); }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes, delete
              </button>
              <button
                onClick={() => { toast.dismiss(id); resolve(false); }}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

  const showNotification = (message, type = "success") => {
    type === "success" ? toast.success(message) : toast.error(message);
  };

  const showError = (err) => {
    const msg = typeof err === "string" ? err : err?.message || "Something went wrong";
    console.error("Error:", msg);
    if (msg.includes("Authentication failed")) {
      setAuthIssue("unauth");
      navigate("/login");
    } else {
      toast.error(msg);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const id = await fetchSchoolId();
        setSchoolId(id);
      } catch (e) { showError(e); }
    })();
  }, []);

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      setAuthIssue("unauth");
      navigate("/login");
      return;
    }

    (async function loadInitialData() {
      setLoadingGroups(true);
      setLoadingPermissions(true);
      setLoadingUsers(true);
      setAuthIssue(null);

      try {
        const groupsData = await fetchGroups();
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally { setLoadingGroups(false); }

      try {
        const permissionsData = await fetchAvailablePermissions();
        setPermissions(
          (Array.isArray(permissionsData) ? permissionsData : []).map((p) => ({
            ...p,
            app_label: p.display_name ? p.display_name.split(" | ")[0] : "Other",
          }))
        );
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally { setLoadingPermissions(false); }

      try {
        const usersData = await fetchUsers();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally { setLoadingUsers(false); }
    })();
  }, [navigate]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.name?.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return permissions;
    const q = permissionSearch.toLowerCase();
    return permissions.filter((p) =>
      `${p.name || ""} ${p.codename || ""} ${p.app_label || ""}`.toLowerCase().includes(q)
    );
  }, [permissions, permissionSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      `${u.username || ""} ${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const permissionOptions = useMemo(() => {
    const byApp = {};
    filteredPermissions.forEach((p) => {
      const app = p.app_label || "Other";
      if (!byApp[app]) byApp[app] = [];
      byApp[app].push(p);
    });
    return byApp;
  }, [filteredPermissions]);

  /* ---------- Handlers ---------- */
  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setGroupName("");
    setSelectedPermissions([]);
    setShowGroupDialog(true);
  };

  const handleEditGroup = async (group) => {
    try {
      const details = await fetchGroupDetails(group.id);
      setSelectedGroup(group);
      setGroupName(details.name || group.name || "");
      setSelectedPermissions(
        Array.isArray(details.permissions) ? details.permissions.map((p) => p.id) : []
      );
      setShowGroupDialog(true);
    } catch (error) { showError(error); }
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return showError("Group name is required");
    if (!schoolId) return showError("School ID not available");

    setSavingGroup(true);
    try {
      const payload = { name: groupName.trim(), permission_ids: selectedPermissions, school_id: schoolId };

      if (selectedGroup) {
        const updated = await updateGroup(selectedGroup.id, payload);
        setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? { ...g, ...updated } : g)));
        showNotification("Group updated successfully");
      } else {
        await createGroup(payload);
        const groupsData = await fetchGroups();
        setGroups(Array.isArray(groupsData) ? groupsData : []);
        setGroupSearch("");
        showNotification("Group created successfully");
      }
      setShowGroupDialog(false);
    } catch (error) {
      showError(error);
    } finally { setSavingGroup(false); }
  };

  const handleDeleteGroup = async (group) => {
    const ok = await confirmToast(`Delete the group "${group.name}"? This cannot be undone.`);
    if (!ok) {
      toast("Deletion cancelled", { icon: "🟰" });
      return;
    }
    try {
      await deleteGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      showNotification("Group deleted successfully");
    } catch (error) { showError(error); }
  };

  const handleManagePermissions = async (group) => {
    try {
      const details = await fetchGroupDetails(group.id);
      setSelectedGroup(group);
      setSelectedPermissions(
        Array.isArray(details.permissions) ? details.permissions.map((p) => p.id) : []
      );
      setShowPermissionDialog(true);
    } catch (error) { showError(error); }
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const currentGroup = await fetchGroupDetails(selectedGroup.id);
      const current = Array.isArray(currentGroup.permissions) ? currentGroup.permissions.map((p) => p.id) : [];

      const toAdd = selectedPermissions.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !selectedPermissions.includes(id));

      if (toAdd.length) await addPermissionsToGroup(selectedGroup.id, toAdd);
      if (toRemove.length) await removePermissionsFromGroup(selectedGroup.id, toRemove);

      showNotification(`Permissions updated for ${selectedGroup.name}`);
      setShowPermissionDialog(false);

      const updatedGroups = await fetchGroups();
      setGroups(Array.isArray(updatedGroups) ? updatedGroups : []);
    } catch (error) { showError(error); }
    finally { setSavingPermissions(false); }
  };

  const handleManageUsers = async (group) => {
    try {
      setSelectedGroup(group);
      // If backend returns users, you can preselect here:
      // const groupUsers = await fetchGroupUsers(group.id);
      // setSelectedUsers(Array.isArray(groupUsers) ? groupUsers.map((u) => u.id) : []);
      setSelectedUsers([]);
      setShowUserDialog(true);
    } catch {
      showError("User management endpoints not yet implemented in backend");
    }
  };

  const handleSaveUsers = async () => {
    setSavingUsers(true);
    try {
      const currentUsers = await fetchGroupUsers(selectedGroup.id);
      const currentIds = Array.isArray(currentUsers) ? currentUsers.map((u) => u.id) : [];

      const toAdd = selectedUsers.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedUsers.includes(id));

      if (toAdd.length) await addUsersToGroup(selectedGroup.id, toAdd);
      if (toRemove.length) await removeUsersFromGroup(selectedGroup.id, toRemove);

      showNotification(`Users updated for ${selectedGroup.name}`);
      setShowUserDialog(false);

      const updatedGroups = await fetchGroups();
      setGroups(Array.isArray(updatedGroups) ? updatedGroups : []);
    } catch (error) { showError(error); }
    finally { setSavingUsers(false); }
  };

  const AuthBanner = () => {
    if (!authIssue) return null;
    const isUnauth = authIssue === "unauth";
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className={`rounded-md p-4 border ${
            isUnauth
              ? "bg-yellow-50 text-yellow-800 border-yellow-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <p className="text-sm">
            {isUnauth
              ? "You are not authenticated. Redirecting to login..."
              : "You lack permission to access this data. Contact an administrator."}
          </p>
        </div>
      </div>
    );
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" reverseOrder={false} />
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Groups & Permissions</h1>
              <p className="text-sm text-gray-600 mt-1">Manage groups, their permissions, and assigned users</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateGroup}
                disabled={loadingGroups || authIssue}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search groups..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {groupSearch && (
              <button
                onClick={() => setGroupSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loadingGroups ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading groups...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.school_name}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit group"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleManagePermissions(group)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Manage permissions"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleManageUsers(group)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Manage users"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleManagePermissions(group)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {group.permissions_count || 0} permissions
                      </button>
                      <button
                        onClick={() => handleManageUsers(group)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        {group.user_count || 0} users
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!loadingGroups && filteredGroups.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No groups found</p>
                  {groupSearch && (
                    <button onClick={() => setGroupSearch("")} className="mt-2 text-blue-600 hover:text-blue-800">
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Group Create/Edit Dialog */}
      {showGroupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedGroup ? "Edit Group" : "Create New Group"}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {permissionSearch && (
                    <button
                      onClick={() => setPermissionSearch("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {Object.entries(permissionOptions).map(([app, perms]) => (
                    <div key={app} className="mb-4 last:mb-0">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">{app}</h3>
                      <div className="space-y-2 ml-4">
                        {perms.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermissions((prev) => [...prev, permission.id]);
                                } else {
                                  setSelectedPermissions((prev) => prev.filter((id) => id !== permission.id));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.codename}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredPermissions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No permissions found</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowGroupDialog(false)}
                disabled={savingGroup}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={savingGroup || !schoolId}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingGroup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedGroup ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Management Dialog */}
      {showPermissionDialog && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Permissions - {selectedGroup.name}
            </h2>
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {permissionSearch && (
                  <button
                    onClick={() => setPermissionSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {Object.entries(permissionOptions).map(([app, perms]) => (
                  <div key={app} className="space-y-2 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{app}</h3>
                    <div className="space-y-2 ml-4">
                      {perms.map((permission) => (
                        <label key={permission.id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions((prev) => [...prev, permission.id]);
                              } else {
                                setSelectedPermissions((prev) => prev.filter((id) => id !== permission.id));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.codename}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredPermissions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No permissions found</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowPermissionDialog(false)}
                disabled={savingPermissions}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingPermissions && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Dialog */}
      {showUserDialog && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Manage Users - {selectedGroup.name}
            </h2>
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading users...</span>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredUsers.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <label key={user.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers((prev) => [...prev, user.id]);
                              } else {
                                setSelectedUsers((prev) => prev.filter((id) => id !== user.id));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                          />
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {user.email || user.username}
                              </div>
                              {user.is_staff && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                  Staff
                                </span>
                              )}
                              {user.is_superuser && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1 ml-2">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">
                        {userSearch ? "No users found matching your search" : "No users available"}
                      </p>
                      {userSearch && (
                        <button
                          onClick={() => setUserSearch("")}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Selected Users:</span>
                  <span className="font-medium text-gray-900">
                    {selectedUsers.length} of {filteredUsers.length}
                  </span>
                </div>
                {selectedUsers.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear all selections
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowUserDialog(false)}
                disabled={savingUsers}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUsers}
                disabled={savingUsers}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingUsers && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
