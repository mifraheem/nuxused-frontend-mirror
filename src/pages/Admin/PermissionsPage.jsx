import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit3, Shield, Trash2, X, Loader2, Users, UserPlus, UserCheck, UserX, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";

/* ----------------------------- API LAYER ----------------------------- */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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
  const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
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

// Group API Functions
async function fetchGroups() {
  const res = await http("GET", "/api/groups/");
  return res?.data?.results || res?.results || [];
}

async function createGroup(payload) { 
  return http("POST", "/api/groups/", payload); 
}

async function updateGroup(id, payload) { 
  return http("PUT", `/api/groups/${id}/`, payload); 
}

async function deleteGroup(id) { 
  return http("DELETE", `/api/groups/${id}/`); 
}

async function fetchGroupDetails(id) { 
  return http("GET", `/api/groups/${id}/`); 
}

async function addPermissionsToGroup(groupId, permissionIds) {
  return http("POST", `/api/groups/${groupId}/add_permissions/`, { permission_ids: permissionIds });
}

async function removePermissionsFromGroup(groupId, permissionIds) {
  return http("POST", `/api/groups/${groupId}/remove_permissions/`, { permission_ids: permissionIds });
}

async function fetchAvailablePermissions() {
  const res = await http("GET", "/api/groups/available_permissions/");
  return res?.data?.results || res?.results || res || [];
}

// User Management API Functions
async function fetchManageableUsers() {
  const res = await http("GET", "/api/groups/manageable_users/");
  return res?.data?.results || res?.results || [];
}

async function fetchUsersList() {
  const res = await http("GET", "/api/groups/users_list/");
  return res?.data || res?.results || res || [];
}

async function fetchUserGroups(userId) {
  const res = await http("GET", `/api/groups/user/${userId}/groups/`);
  return res?.data?.results || res?.results || res || [];
}

async function assignGroupsToUser(userId, groupIds) {
  return http("POST", "/api/groups/assign_groups_to_user/", { user_id: userId, group_ids: groupIds });
}

async function removeGroupsFromUser(userId, groupIds) {
  return http("POST", "/api/groups/remove_groups_from_user/", { user_id: userId, group_ids: groupIds });
}

async function fetchAvailableGroupsForAssignment() {
  const res = await http("GET", "/api/groups/available_groups_for_assignment/");
  return res?.data || res?.results || res || [];
}

/* ----------------------------- Main Component ----------------------------- */

export default function PermissionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("groups");
  const [groupSearch, setGroupSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [manageableUsers, setManageableUsers] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingUserGroups, setSavingUserGroups] = useState(false);
  const [authIssue, setAuthIssue] = useState(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showUserGroupsDialog, setShowUserGroupsDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [schoolId, setSchoolId] = useState("d8246712-ae46-454a-8a4d-cf787d5ba1c1"); // Default school ID from your example

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

  // Initial data loading
  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      setAuthIssue("unauth");
      navigate("/login");
      return;
    }

    async function loadInitialData() {
      setLoadingGroups(true);
      setLoadingPermissions(true);
      setAuthIssue(null);

      // Load groups
      try {
        const groupsData = await fetchGroups();
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally { 
        setLoadingGroups(false); 
      }

      // Load permissions
      try {
        const permissionsData = await fetchAvailablePermissions();
        const processedPermissions = (Array.isArray(permissionsData) ? permissionsData : []).map((p) => ({
          ...p,
          app_label: p.content_type || p.app_label || "Other",
        }));
        setPermissions(processedPermissions);
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally { 
        setLoadingPermissions(false); 
      }

      // Load available groups for assignment
      try {
        const availableGroupsData = await fetchAvailableGroupsForAssignment();
        setAvailableGroups(Array.isArray(availableGroupsData) ? availableGroupsData : []);
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      }
    }

    loadInitialData();
  }, [navigate]);

  // Load users data when Users tab is activated
  useEffect(() => {
    if (activeTab === "users") {
      async function loadUsersData() {
        setLoadingUsers(true);
        try {
          const usersData = await fetchUsersList();
          setManageableUsers(Array.isArray(usersData) ? usersData : []);
        } catch (error) {
          if (error.status === 401) setAuthIssue("unauth");
          else if (error.status === 403) setAuthIssue("forbidden");
          showError(error);
        } finally {
          setLoadingUsers(false);
        }
      }
      loadUsersData();
    }
  }, [activeTab]);

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

  const filteredManageableUsers = useMemo(() => {
    if (!userSearch.trim()) return manageableUsers;
    const q = userSearch.toLowerCase();
    return manageableUsers.filter((u) =>
      `${u.username || ""} ${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [manageableUsers, userSearch]);

  const permissionOptions = useMemo(() => {
    const byApp = {};
    filteredPermissions.forEach((p) => {
      const app = p.app_label || "Other";
      if (!byApp[app]) byApp[app] = [];
      byApp[app].push(p);
    });
    return byApp;
  }, [filteredPermissions]);

  /* ---------- Group Handlers ---------- */
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
    } catch (error) { 
      showError(error); 
    }
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return showError("Group name is required");
    if (!schoolId) return showError("School ID not available");

    setSavingGroup(true);
    try {
      const payload = { 
        name: groupName.trim(), 
        permission_ids: selectedPermissions, 
        school_id: schoolId 
      };

      if (selectedGroup) {
        await updateGroup(selectedGroup.id, payload);
        showNotification("Group updated successfully");
      } else {
        await createGroup(payload);
        showNotification("Group created successfully");
      }
      
      // Refresh groups list
      const groupsData = await fetchGroups();
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setShowGroupDialog(false);
      setGroupSearch("");
    } catch (error) {
      showError(error);
    } finally { 
      setSavingGroup(false); 
    }
  };

  const handleDeleteGroup = async (group) => {
    const ok = await confirmToast(`Delete the group "${group.name}"? This cannot be undone.`);
    if (!ok) {
      toast("Deletion cancelled", { icon: "🚫" });
      return;
    }
    try {
      await deleteGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      showNotification("Group deleted successfully");
    } catch (error) { 
      showError(error); 
    }
  };

  const handleManagePermissions = async (group) => {
    try {
      const details = await fetchGroupDetails(group.id);
      setSelectedGroup(group);
      setSelectedPermissions(
        Array.isArray(details.permissions) ? details.permissions.map((p) => p.id) : []
      );
      setShowPermissionDialog(true);
    } catch (error) { 
      showError(error); 
    }
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

      // Refresh groups
      const updatedGroups = await fetchGroups();
      setGroups(Array.isArray(updatedGroups) ? updatedGroups : []);
    } catch (error) { 
      showError(error); 
    } finally { 
      setSavingPermissions(false); 
    }
  };

  /* ---------- User Management Handlers ---------- */
  const handleManageUserGroups = async (user) => {
    try {
      setSelectedUser(user);
      const userGroups = await fetchUserGroups(user.id);
      setSelectedUserGroups(Array.isArray(userGroups) ? userGroups.map((g) => g.id) : []);
      setShowUserGroupsDialog(true);
    } catch (error) {
      showError(error);
    }
  };

  const handleSaveUserGroups = async () => {
    setSavingUserGroups(true);
    try {
      const currentUserGroups = await fetchUserGroups(selectedUser.id);
      const currentGroupIds = Array.isArray(currentUserGroups) ? currentUserGroups.map((g) => g.id) : [];

      const toAssign = selectedUserGroups.filter((id) => !currentGroupIds.includes(id));
      const toRemove = currentGroupIds.filter((id) => !selectedUserGroups.includes(id));

      if (toAssign.length) {
        await assignGroupsToUser(selectedUser.id, toAssign);
      }
      if (toRemove.length) {
        await removeGroupsFromUser(selectedUser.id, toRemove);
      }

      showNotification(`Groups updated for ${selectedUser.username || selectedUser.full_name || 'user'}`);
      setShowUserGroupsDialog(false);

      // Refresh users data
      try {
        const updatedUsers = await fetchUsersList();
        setManageableUsers(Array.isArray(updatedUsers) ? updatedUsers : []);
      } catch (error) {
        console.warn("Could not refresh users:", error);
      }
    } catch (error) {
      showError(error);
    } finally {
      setSavingUserGroups(false);
    }
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

  const getUserDisplayName = (user) => {
    if (user.full_name && user.full_name.trim()) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.username || user.email || 'Unknown User';
  };

  const getRoleColor = (role) => {
    const colors = {
      teacher: "bg-blue-100 text-blue-800",
      admin: "bg-red-100 text-red-800",
      staff: "bg-purple-100 text-purple-800",
      student: "bg-orange-100 text-orange-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Groups & Permissions</h1>
              <p className="text-sm text-gray-600 mt-1">Manage groups, permissions, and user assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === "groups" && (
                <button
                  onClick={handleCreateGroup}
                  disabled={loadingGroups || authIssue}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Group
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "groups"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Groups
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
          </div>
        </div>
      </div>

      <AuthBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "groups" ? (
          /* Groups Tab Content */
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
        ) : (
          /* Users Tab Content */
          <div className="space-y-6">
            <div className="relative max-w-md">
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading users...</span>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage group assignments for users</p>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredManageableUsers.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getUserDisplayName(user)}
                              </p>
                              {user.role && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>
                              )}
                              {!user.is_active && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-500 truncate">
                                {user.email || user.username}
                              </p>
                              {user.group_count !== undefined && (
                                <p className="text-xs text-gray-400">
                                  {user.group_count} group{user.group_count !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleManageUserGroups(user)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Groups
                          </button>
                        </div>
                      </div>
                      
                      {/* Show current groups if available */}
                      {user.groups && user.groups.length > 0 && (
                        <div className="mt-3 ml-16">
                          <div className="flex flex-wrap gap-2">
                            {user.groups.slice(0, 3).map((group) => (
                              <span
                                key={group.id || group.name}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {group.name}
                              </span>
                            ))}
                            {user.groups.length > 3 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                +{user.groups.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {!loadingUsers && filteredManageableUsers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No users found</p>
                      {userSearch && (
                        <button onClick={() => setUserSearch("")} className="mt-2 text-blue-600 hover:text-blue-800">
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* User Groups Management Dialog */}
      {showUserGroupsDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Manage Groups - {getUserDisplayName(selectedUser)}
            </h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{getUserDisplayName(selectedUser)}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email || selectedUser.username}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {availableGroups.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {availableGroups.map((group) => (
                      <label key={group.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUserGroups.includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserGroups((prev) => [...prev, group.id]);
                            } else {
                              setSelectedUserGroups((prev) => prev.filter((id) => id !== group.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {group.name}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No groups available for assignment</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Selected Groups:</span>
                  <span className="font-medium text-gray-900">
                    {selectedUserGroups.length} of {availableGroups.length}
                  </span>
                </div>
                {selectedUserGroups.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableGroups
                      .filter(group => selectedUserGroups.includes(group.id))
                      .map(group => (
                        <span
                          key={group.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {group.name}
                        </span>
                      ))}
                  </div>
                )}
                {selectedUserGroups.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setSelectedUserGroups([])}
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
                onClick={() => setShowUserGroupsDialog(false)}
                disabled={savingUserGroups}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserGroups}
                disabled={savingUserGroups}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingUserGroups && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Groups
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}