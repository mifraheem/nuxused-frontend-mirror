import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit3, Shield, Trash2, X, Loader2, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import GroupPermissionsDialog from "../../components/GroupPermissionsDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const HEADERS = (token) => {
  const base = { "Content-Type": "application/json" };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
};

async function http(method, url, body) {
  let token = Cookies.get("access_token");
  console.log(`HTTP ${method} request to ${url}, token: ${token ? "present" : "missing"}`);

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
    console.log(`Response from ${url}:`, data);

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
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Authentication failed. Please log in again.");
      }
    }
    throw error;
  }
}

async function refreshToken() {
  const refresh = Cookies.get("refresh_token");
  console.log("Refresh token:", refresh ? "present" : "missing");
  if (!refresh) throw new Error("No refresh token available");
  const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    credentials: "include",
  });
  const data = await res.json();
  console.log("Token refresh response:", data);
  if (res.ok) {
    Cookies.set("access_token", data.access, { expires: 7, secure: true, sameSite: "Strict" });
    return data.access;
  }
  throw new Error("Token refresh failed");
}

// Group API Functions
async function fetchGroups() {
  const res = await http("GET", "/api/groups/");
  const data = res?.data?.results || res?.results || res || [];
  console.log("fetchGroups response:", data);
  return Array.isArray(data) ? data : [];
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
  console.log("fetchAvailablePermissions response:", res);
  return res || {};
}

async function fetchManageableUsers() {
  const res = await http("GET", "/api/groups/manageable_users/");
  const data = res?.data?.results || res?.results || res || [];
  console.log("fetchManageableUsers response:", data);
  return Array.isArray(data) ? data : [];
}

async function fetchUsersList() {
  const res = await http("GET", "/api/groups/users_list/");
  const data = res?.data?.results || res?.results || res?.data || res || [];
  console.log("fetchUsersList response:", data);
  return Array.isArray(data) ? data : [];
}

async function fetchUserGroups(userId) {
  const res = await http("GET", `/api/groups/user/${userId}/groups/`);
  const data = res?.data?.results || res?.results || res || [];
  console.log(`fetchUserGroups for user ${userId} response:`, data);
  return Array.isArray(data) ? data : [];
}

async function assignGroupsToUser(userId, groupIds) {
  return http("POST", "/api/groups/assign_groups_to_user/", { user_id: userId, group_ids: groupIds });
}

async function removeGroupsFromUser(userId, groupIds) {
  return http("POST", "/api/groups/remove_groups_from_user/", { user_id: userId, group_ids: groupIds });
}

async function fetchAvailableGroupsForAssignment() {
  const res = await http("GET", "/api/groups/available_groups_for_assignment/");
  const data = res?.data || res?.results || res || [];
  console.log("fetchAvailableGroupsForAssignment response:", data);
  return Array.isArray(data) ? data : [];
}

export default function PermissionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("groups");
  const [groupSearch, setGroupSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [manageableUsers, setManageableUsers] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingUserGroups, setSavingUserGroups] = useState(false);
  const [authIssue, setAuthIssue] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [showUserGroupsDialog, setShowUserGroupsDialog] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    mode: "create",
    initialName: "",
    initialPermissionIds: [],
    readOnlyName: false,
  });

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
    const token = Cookies.get("access_token");
    console.log("Initial check - Access token:", token ? "present" : "missing");
    if (!token) {
      setAuthIssue("unauth");
      navigate("/login");
      return;
    }

    async function loadInitialData() {
      setLoadingGroups(true);
      setLoadingPermissions(true);
      setAuthIssue(null);

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

      try {
        const permissionsData = await fetchAvailablePermissions();
        setPermissions(permissionsData);
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally {
        setLoadingPermissions(false);
      }

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

  useEffect(() => {
    if (activeTab === "users") {
      console.log("Users tab activated, fetching users...");
      async function loadUsersData() {
        setLoadingUsers(true);
        try {
          const usersData = await fetchUsersList();
          setManageableUsers(Array.isArray(usersData) ? usersData : []);
          console.log("manageableUsers updated:", usersData);
        } catch (error) {
          console.error("Users loading error:", error);
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

  useEffect(() => {
    console.log("manageableUsers state:", manageableUsers);
  }, [manageableUsers]);

  useEffect(() => {
    (async () => {
      try {
        const res = await http("GET", `/api/schools/?_=${Date.now()}`);
        // Your API shape: { status, message, data: { results: [...] } }
        const results = res?.data?.results ?? res?.results ?? [];
        if (results.length > 0) {
          setSelectedSchoolId(results[0].id); // pick the first school (or your selection logic)
        } else {
          console.warn("No schools returned from /api/schools/");
        }
      } catch (e) {
        console.error("Failed to load schools", e);
        toast?.error?.("Failed to load schools");
      }
    })();
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.name?.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const filteredManageableUsers = useMemo(() => {
    console.log("Filtering users, manageableUsers:", manageableUsers, "userSearch:", userSearch);
    if (!userSearch.trim()) return manageableUsers;
    const q = userSearch.toLowerCase();
    return manageableUsers.filter((u) =>
      `${u.username || ""} ${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [manageableUsers, userSearch]);

  const handleCreateGroup = () => {
    setDialogConfig({
      open: true,
      mode: "create",
      initialName: "",
      initialPermissionIds: [],
      readOnlyName: false,
    });
  };

  const handleEditGroup = async (group) => {
    try {
      const details = await fetchGroupDetails(group.id);
      console.log("Group details:", details);
      setSelectedGroup(group);
      setDialogConfig({
        open: true,
        mode: "edit",
        initialName: details.name || group.name || "",
        initialPermissionIds: Array.isArray(details.permissions) ? details.permissions.map((p) => p.id) : [],
        readOnlyName: false,
      });
    } catch (error) {
      showError(error);
    }
  };

  async function reloadGroups(schoolId) {
    if (!schoolId) throw new Error("School id missing");

    const res = await http(
      "GET",
      `/api/groups/?school_id=${encodeURIComponent(schoolId)}&_=${Date.now()}`
    );

    // normalize result list across shapes
    const results =
      res?.data?.results ??
      res?.results ??
      (Array.isArray(res) ? res : []);

    if (!Array.isArray(results)) {
      throw new Error("Unexpected groups response shape");
    }

    setGroups(results);
  }


  // 4) Ensure your save handler always includes school_id
  const handleDialogSave = async (payloadFromDialog) => {
    if (!selectedSchoolId) {
      toast.error("No school selected");
      return;
    }

    const body = { ...payloadFromDialog, school_id: selectedSchoolId };

    try {
      if (dialogConfig.mode === "create") {
        await http("POST", "/api/groups/", body);
      } else {
        await http("PATCH", `/api/groups/${dialogConfig.groupId}/`, body);
      }

      try {
        await reloadGroups(selectedSchoolId);      // ✅ refetch with cache-bust + parsing
        toast.success(
          `Group ${dialogConfig.mode === "create" ? "created" : "updated"} successfully`
        );
      } catch (e) {
        console.error(e);
        toast(
          (t) => (
            <div>
              <div className="font-medium">Group saved ✅</div>
              <div className="text-sm text-red-600">
                But refreshing the list failed: {String(e.message || e)}
              </div>
            </div>
          ),
          { icon: "⚠️" }
        );
      }

      setDialogConfig((prev) => ({ ...prev, open: false }));
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Save failed");
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
      console.log("Group details for permissions:", details);
      setSelectedGroup(group);
      setDialogConfig({
        open: true,
        mode: "manage",
        initialName: details.name || group.name || "",
        initialPermissionIds: Array.isArray(details.permissions) ? details.permissions.map((p) => p.id) : [],
        readOnlyName: true,
      });
    } catch (error) {
      showError(error);
    }
  };

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

      console.log("Groups to assign:", toAssign);
      console.log("Groups to remove:", toRemove);

      if (toAssign.length) {
        await assignGroupsToUser(selectedUser.id, toAssign);
      }
      if (toRemove.length) {
        await removeGroupsFromUser(selectedUser.id, toRemove);
      }

      showNotification(`Groups updated for ${selectedUser.username || selectedUser.full_name || 'user'}`);
      setShowUserGroupsDialog(false);

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

  const handleNavigateToUsers = () => {
    console.log("Navigating to users tab");
    setActiveTab("users");
  };

  const AuthBanner = () => {
    if (!authIssue) return null;
    const isUnauth = authIssue === "unauth";
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className={`rounded-md p-4 border ${isUnauth
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

          <div className="flex space-x-8 -mb-px">
            <button
              onClick={() => {
                console.log("Switching to groups tab");
                setActiveTab("groups");
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "groups"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Roles
            </button>
            <button
              onClick={() => {
                console.log("Switching to users tab");
                setActiveTab("users");
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "users"
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
                        <button
                          onClick={handleNavigateToUsers}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Manage users"
                        >
                          <Users className="w-4 h-4" />
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
                  {filteredManageableUsers.length > 0 ? (
                    filteredManageableUsers.map((user) => (
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
                                    {user.group_count} group{user.group_count !== 1 ? "s" : ""}
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
                              Manage Role
                            </button>
                          </div>
                        </div>
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
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {userSearch ? "No users found for search query" : "No users available"}
                      </p>
                      {userSearch && (
                        <button
                          onClick={() => setUserSearch("")}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
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

      <GroupPermissionsDialog
        open={dialogConfig.open}
        onClose={() => setDialogConfig((prev) => ({ ...prev, open: false }))}
        onSave={handleDialogSave}
        permissions={permissions}
        mode={dialogConfig.mode}
        initialName={dialogConfig.initialName}
        initialPermissionIds={dialogConfig.initialPermissionIds}
        readOnlyName={dialogConfig.readOnlyName}
        schoolId={selectedSchoolId}   // ✅ add this line
      />


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
                            <div className="text-sm font-medium text-gray-900 truncate">{group.name}</div>
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
                      .filter((group) => selectedUserGroups.includes(group.id))
                      .map((group) => (
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