import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit3, Shield, Trash2, X, Loader2, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Toaster from "../../components/Toaster";
import GroupPermissionsDialog from "../../components/GroupPermissionsDialog";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

const HEADERS = (token) => {
  const base = { "Content-Type": "application/json" };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
};
function extractResults(res, fallbackKey = "results") {
  if (!res) return [];

  // handle paginated style { data: { results: [] } }
  if (res.data?.[fallbackKey]) return res.data[fallbackKey];
  if (res.data?.data?.[fallbackKey]) return res.data.data[fallbackKey];

  // direct array return
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res)) return res;

  // nested results
  if (res[fallbackKey]) return res[fallbackKey];
  if (res.data) return res.data;

  return [];
}

async function http(method, url, body) {
  let token = Cookies.get("access_token");

  const attemptRequest = async (useToken) => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers: HEADERS(useToken),
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    // Handle no-content immediately
    if (res.status === 204) return {};

    let data;
    try {
      data = await res.clone().json();
    } catch {
      data = await res.text();
    }

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
  if (!refresh) throw new Error("No refresh token available");
  const res = await fetch(`${API_BASE_URL}api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    credentials: "include",
  });
  const data = await res.json();
  if (res.ok) {
    Cookies.set("access_token", data.access, { expires: 7,  sameSite: "Strict" });
    return data.access;
  }
  throw new Error("Token refresh failed");
}

// API Functions
async function fetchGroups(schoolId) {
  const url = schoolId ? `api/groups/?school_id=${encodeURIComponent(schoolId)}` : "api/groups/";
  const res = await http("GET", url);
  const results = extractResults(res);

  return results.map((g) => ({
    id: g.id,
    name: g.name || g.group_name || "Unnamed Group",
    school_name: g.school_name || g.school || "",
    permissions_count: g.permissions_count || 0,
  }));
}

async function fetchSchools() {
  const res = await http("GET", "api/schools/");
  const results = extractResults(res);

  return results.map((s) => ({
    id: s.id,
    school_name: s.school_name || s.name || "Unnamed School",
  }));
}

async function createGroup(payload) {
  return http("POST", "api/groups/", payload);
}

async function updateGroup(id, payload) {
  return http("PATCH", `api/groups/${id}/`, payload);
}

async function deleteGroup(id) {
  return http("DELETE", `api/groups/${id}/`);
}

async function fetchGroupDetails(id) {
  return http("GET", `api/groups/${id}/`);
}

async function addPermissionsToGroup(groupId, permissionIds) {
  return http("POST", `api/groups/${groupId}/add_permissions/`, { permission_ids: permissionIds });
}

async function removePermissionsFromGroup(groupId, permissionIds) {
  return http("POST", `api/groups/${groupId}/remove_permissions/`, { permission_ids: permissionIds });
}

async function fetchAvailablePermissions() {
  const res = await http("GET", "api/groups/available_permissions/");
  return res || {};
}

async function fetchUsersList() {
  const res = await http("GET", "api/groups/users_list/");
  return extractResults(res);
}

// -------------------- FIXED fetchUserGroups --------------------
async function fetchUserGroups(userId) {
  try {
    if (!userId) throw new Error("User ID is required to fetch user groups");
    const res = await http("GET", `api/groups/${userId}/user_detail/`);

    // ✅ The API response has groups under res.data.groups
    const groups = res?.data?.groups || [];

    return groups; // always an array
  } catch (error) {
    console.error(`Error fetching groups for user ${userId}:`, error);
    if (error.status === 404) return [];
    throw error;
  }
}


async function assignGroupsToUser(userId, groupIds) {
  if (!userId || !Array.isArray(groupIds)) {
    throw new Error("Valid user ID and group IDs array are required");
  }
  return http("POST", "api/groups/assign_groups/", { user_id: userId, group_ids: groupIds });
}

async function removeGroupsFromUser(userId, groupIds) {
  if (!userId || !Array.isArray(groupIds)) {
    throw new Error("Valid user ID and group IDs array are required");
  }
  console.log("Removing groups with payload:", { user_id: userId, group_ids: groupIds });
  return http("POST", "api/groups/remove_groups/", { user_id: userId, group_ids: groupIds });
}


async function fetchAvailableGroupsForAssignment(schoolId) {
  const url = schoolId ? `api/groups/?school_id=${encodeURIComponent(schoolId)}` : "api/groups/";
  const res = await http("GET", url);
  const results = extractResults(res);

  return results.map((g) => ({
    id: g.id,
    name: g.name || g.group_name || "Unnamed Group",
    school_name: g.school_name || g.school || "",
    permissions_count: g.permissions_count || 0,
  }));
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
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingUserGroups, setSavingUserGroups] = useState(false);
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);
  const [authIssue, setAuthIssue] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [showUserGroupsDialog, setShowUserGroupsDialog] = useState(false);

  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    mode: "create",
    initialName: "",
    initialPermissionIds: [],
    readOnlyName: false,
    groupId: null,
  });
  const [toaster, setToaster] = useState({
    message: "",
    type: "success",
    duration: 3000,
    onConfirm: null,
    onCancel: null,
  });

  const showToast = (message, type = "success", duration = 3000) => {
    setToaster({ message, type, duration, onConfirm: null, onCancel: null });
  };

  const showConfirm = (message, onConfirm, onCancel) => {
    setToaster({
      message,
      type: "confirmation",
      duration: 3000, 
      onConfirm,
      onCancel,
    });
  };


  const showError = (err) => {
    const msg = typeof err === "string" ? err : err?.message || "Something went wrong";
    console.error("Error:", msg, err);
    if (msg.includes("Authentication failed")) {
      setAuthIssue("unauth");
      navigate("/login");
    } else {
      showToast(msg, "error");
    }
  };

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      setAuthIssue("unauth");
      navigate("/login");
      return;
    }

    async function loadInitialData() {
      setLoadingSchools(true);
      setLoadingGroups(true);
      setLoadingPermissions(true);
      setAuthIssue(null);

      try {
        const [schoolsData, groupsData, permissionsData, availableGroupsData] = await Promise.all([
          fetchSchools(),
          fetchGroups(null),
          fetchAvailablePermissions(),
          fetchAvailableGroupsForAssignment(null),
        ]);

        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
        setPermissions(permissionsData);
        setAvailableGroups(Array.isArray(availableGroupsData) ? availableGroupsData : []);

        if (schoolsData.length > 0 && !selectedSchoolId) {
          setSelectedSchoolId(schoolsData[0].id);
        }
      } catch (error) {
        if (error.status === 401) setAuthIssue("unauth");
        else if (error.status === 403) setAuthIssue("forbidden");
        showError(error);
      } finally {
        setLoadingSchools(false);
        setLoadingGroups(false);
        setLoadingPermissions(false);
      }
    }

    loadInitialData();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "users") {
      setLoadingUsers(true);
      fetchUsersList()
        .then((usersData) => {
          setManageableUsers(Array.isArray(usersData) ? usersData : []);
        })
        .catch((error) => {
          if (error.status === 401) setAuthIssue("unauth");
          else if (error.status === 403) setAuthIssue("forbidden");
          showError(error);
        })
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSchoolId) {
      setLoadingGroups(true);
      fetchGroups(selectedSchoolId)
        .then((groupsData) => {
          setGroups(Array.isArray(groupsData) ? groupsData : []);
          return fetchAvailableGroupsForAssignment(selectedSchoolId);
        })
        .then((availableGroupsData) => {
          setAvailableGroups(Array.isArray(availableGroupsData) ? availableGroupsData : []);
        })
        .catch((error) => {
          showError(error);
        })
        .finally(() => setLoadingGroups(false));
    }
  }, [selectedSchoolId]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.name?.toLowerCase().includes(q) || g.school_name?.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const filteredManageableUsers = useMemo(() => {
    if (!userSearch.trim()) return manageableUsers;
    const q = userSearch.toLowerCase();
    return manageableUsers.filter((u) =>
      `${u.username || ""} ${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [manageableUsers, userSearch]);

  const handleCreateGroup = () => {
    if (!selectedSchoolId) {
      showToast("Please select a school first", "error");
      return;
    }
    setDialogConfig({
      open: true,
      mode: "create",
      initialName: "",
      initialPermissionIds: [],
      readOnlyName: false,
      groupId: null,
    });
  };

  const handleEditGroup = async (group) => {
    try {
      const details = await fetchGroupDetails(group.id);
      const d = details.data; // unwrap
      setSelectedGroup(group);
      setDialogConfig({
        open: true,
        mode: "edit",
        initialName: d.name || group.name || "",
        initialPermissionIds: Array.isArray(d.permissions) ? d.permissions.map((p) => p.id) : [],
        readOnlyName: false,
        groupId: d.id,
      });
    } catch (error) {
      showError(error);
    }
  };

  const handleManagePermissions = async (group) => {
    try {
      const details = await fetchGroupDetails(group.id);
      const d = details.data; // unwrap
      setSelectedGroup(group);
      setDialogConfig({
        open: true,
        mode: "manage",
        initialName: d.name || group.name || "",
        initialPermissionIds: Array.isArray(d.permissions) ? d.permissions.map((p) => p.id) : [],
        readOnlyName: true,
        groupId: d.id,
      });
    } catch (error) {
      showError(error);
    }
  };

  const handleDialogSave = async (payloadFromDialog) => {
    if (!selectedSchoolId) {
      showToast("No school selected", "error");
      return;
    }

    setSavingGroup(true);
    try {
      if (dialogConfig.mode === "create") {
        const response = await createGroup({ ...payloadFromDialog, school_id: selectedSchoolId });
        showToast("Group created successfully", "success");
        const [updatedGroups, updatedAvailableGroups] = await Promise.all([
          fetchGroups(selectedSchoolId),
          fetchAvailableGroupsForAssignment(selectedSchoolId),
        ]);
        setGroups(updatedGroups);
        setAvailableGroups(updatedAvailableGroups);
      } else if (dialogConfig.mode === "edit") {
        await updateGroup(dialogConfig.groupId, { name: payloadFromDialog.name });
        showToast("Group updated successfully", "success");
        const updatedGroups = await fetchGroups(selectedSchoolId);
        setGroups(updatedGroups);
        const updatedAvailableGroups = await fetchAvailableGroupsForAssignment(selectedSchoolId);
        setAvailableGroups(updatedAvailableGroups);
      } else if (dialogConfig.mode === "manage") {
        const currentPermissions = dialogConfig.initialPermissionIds || [];
        const newPermissions = payloadFromDialog.permission_ids || [];
        const toAdd = newPermissions.filter((id) => !currentPermissions.includes(id));
        const toRemove = currentPermissions.filter((id) => !newPermissions.includes(id));

        if (toAdd.length > 0) {
          await addPermissionsToGroup(dialogConfig.groupId, toAdd);
        }
        if (toRemove.length > 0) {
          await removePermissionsFromGroup(dialogConfig.groupId, toRemove);
        }
        showToast("Permissions updated successfully", "success");
        const updatedGroups = await fetchGroups(selectedSchoolId);
        setGroups(updatedGroups);
        const updatedAvailableGroups = await fetchAvailableGroupsForAssignment(selectedSchoolId);
        setAvailableGroups(updatedAvailableGroups);
      }

      setDialogConfig((prev) => ({ ...prev, open: false, groupId: null }));
    } catch (error) {
      showError(error);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = (group) => {
    showConfirm(
      `Delete the group "${group.name}"? This cannot be undone.`,
      async () => {
        try {
          await deleteGroup(group.id);
          setGroups((prev) => prev.filter((g) => g.id !== group.id));

          const updatedAvailableGroups = await fetchAvailableGroupsForAssignment(selectedSchoolId);
          setAvailableGroups(updatedAvailableGroups);

          showToast("Group deleted successfully", "success");
        } catch (error) {
          showToast(error.message || "Failed to delete group", "error");
        }
      },
      () => {
        showToast("Deletion cancelled", "error");
      }
    );
  };

  // -------------------- FIXED handleManageUserGroups --------------------
  const handleManageUserGroups = async (user) => {
    if (!user || !user.id) {
      showToast("Invalid user selected", "error");
      return;
    }

    try {
      setLoadingUserGroups(true);
      setSelectedUser(user);

      const userGroups = await fetchUserGroups(user.id);
      const userGroupIds = userGroups.map((g) => g.id); // ✅ just ids
      setSelectedUserGroups([...new Set(userGroupIds)]);

      setShowUserGroupsDialog(true);
    } catch (error) {
      showError(error);
    } finally {
      setLoadingUserGroups(false);
    }
  };


  // -------------------- FIXED handleSaveUserGroups --------------------
  const handleSaveUserGroups = async () => {
    if (!selectedUser || !selectedUser.id) {
      showToast("No user selected", "error");
      return;
    }

    setSavingUserGroups(true);

    try {
      const originalGroups = await fetchUserGroups(selectedUser.id);
      const originalIds = originalGroups.map((g) => g.id);
      const newIds = [...selectedUserGroups];

      const toAssign = newIds.filter((id) => !originalIds.includes(id));
      const toRemove = originalIds.filter((id) => !newIds.includes(id));

      if (toAssign.length > 0) {
        await assignGroupsToUser(selectedUser.id, toAssign);
      }
      if (toRemove.length > 0) {
        await removeGroupsFromUser(selectedUser.id, toRemove);
      }

      // ✅ update user.groups immediately
      setManageableUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
              ...u,
              group_count: newIds.length,
              groups: availableGroups.filter((g) => newIds.includes(g.id)),
            }
            : u
        )
      );

      // ✅ Close modal and show success toast
      setShowUserGroupsDialog(false);
      setSelectedUser(null);
      showToast(`Groups updated for ${getUserDisplayName(selectedUser)}`, "success");
    } catch (error) {
      showError(error);
    } finally {
      setSavingUserGroups(false);
    }
  };








  const getUserDisplayName = (user) => {
    if (user.full_name?.trim()) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.username || user.email || "Unknown User";
  };

  const getRoleColor = (role) => {
    const colors = {
      teacher: "bg-blue-100 text-blue-800",
      admin: "bg-red-100 text-red-800",
      staff: "bg-purple-100 text-purple-800",
      student: "bg-orange-100 text-orange-800",
      parent: "bg-green-100 text-green-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const AuthBanner = () => {
    if (!authIssue) return null;
    const isUnauth = authIssue === "unauth";
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className={`rounded-md p-4 border ${isUnauth ? "bg-yellow-50 text-yellow-800 border-yellow-200" : "bg-red-50 text-red-800 border-red-200"}`}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={toaster.duration}
        onClose={() => setToaster({ ...toaster, message: "" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />


      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Groups & Permissions</h1>
              <p className="text-sm text-gray-600 mt-1">Manage groups, permissions, and user assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === "groups" && (
                <>
                  <select
                    value={selectedSchoolId || ""}
                    onChange={(e) => setSelectedSchoolId(e.target.value || null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingSchools}
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleCreateGroup}
                    disabled={loadingGroups || authIssue || !selectedSchoolId}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Group
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "groups"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Roles
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          onClick={() => setActiveTab("users")}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Manage users"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <button
                        onClick={() => handleManagePermissions(group)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {group.permissions_count || 0} permissions
                      </button>
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
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                                  >
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
                              disabled={loadingUserGroups}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingUserGroups ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Settings className="w-4 h-4 mr-2" />
                              )}
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
        onClose={() => setDialogConfig((prev) => ({ ...prev, open: false, groupId: null }))}
        onSave={handleDialogSave}
        permissions={permissions}
        mode={dialogConfig.mode}
        initialName={dialogConfig.initialName}
        initialPermissionIds={dialogConfig.initialPermissionIds}
        readOnlyName={dialogConfig.readOnlyName}
        schoolId={selectedSchoolId}
        saving={savingGroup}
      />

      {showUserGroupsDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Manage Groups - {getUserDisplayName(selectedUser)}
              </h2>
              {loadingUserGroups && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>



            <div className="space-y-6">
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {availableGroups.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {availableGroups.map((group) => (
                      <label
                        key={group.id}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${selectedUserGroups.includes(group.id) ? "bg-blue-50" : ""
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserGroups.includes(group.id)}
                          onChange={(e) => {
                            const groupId = group.id;
                            setSelectedUserGroups((prev) => {
                              const newGroups = e.target.checked
                                ? [...new Set([...prev, groupId])]
                                : prev.filter((id) => id !== groupId);
                              return newGroups;
                            });
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                          disabled={savingUserGroups || loadingUserGroups}
                        />
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedUserGroups.includes(group.id)
                                ? "bg-blue-200 text-blue-800"
                                : "bg-blue-100 text-blue-600"
                                }`}
                            >
                              <Shield className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {group.name}
                              {selectedUserGroups.includes(group.id) && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Assigned
                                </span>
                              )}
                            </div>
                            {group.school_name && (
                              <div className="text-xs text-gray-500 truncate">{group.school_name}</div>
                            )}
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
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Selected Groups:</span>
                  <span className="font-medium text-gray-900">
                    {selectedUserGroups.length} of {availableGroups.length}
                  </span>
                </div>
                {selectedUserGroups.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {availableGroups
                        .filter((group) => selectedUserGroups.includes(group.id))
                        .map((group) => (
                          <span
                            key={group.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {group.name}
                            <button
                              onClick={() => {
                                setSelectedUserGroups((prev) => prev.filter((id) => id !== group.id));
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
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
                onClick={() => {
                  setShowUserGroupsDialog(false);
                  setSelectedUser(null);
                  showToast(`Groups updated `, "success");

                }}
                disabled={savingUserGroups}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserGroups}
                disabled={savingUserGroups || loadingUserGroups}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {savingUserGroups && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {savingUserGroups ? "Saving..." : "Save Groups"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}