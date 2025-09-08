import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, GraduationCap, Search, Save, X, UserPlus, UserMinus } from 'lucide-react';
import Cookies from 'js-cookie';
import Toaster from '../../components/Toaster'; // Import custom Toaster component
import Select from 'react-select';

const ClassPermissionsManager = () => {
  const [groupClassPermissions, setGroupClassPermissions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGCP, setEditingGCP] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGCPForClasses, setSelectedGCPForClasses] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [currentClasses, setCurrentClasses] = useState([]);
  const [toaster, setToaster] = useState({ message: "", type: "success" });
  const [confirmResolve, setConfirmResolve] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    group: '',
    class_ids: [],
    school: '',
  });

  const API_BASE = import.meta.env.VITE_SERVER_URL ;
  const getAuthHeaders = () => {
    const token = Cookies.get('access_token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const confirmToast = (message = 'Are you sure?') => {
    return new Promise((resolve) => {
      setConfirmResolve(() => resolve); // Store the resolve function
      setToaster({
        message: (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-medium">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes, delete
              </button>
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(false);
                }}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        type: "confirmation",
      });
    });
  };

  const buildPatch = (original, current) => {
    const patch = {};
    if (current.title !== original.title) patch.title = current.title;
    if (String(current.group || '') !== String(original.group || '')) patch.group = current.group;
    if (current.school !== original.school) patch.school = current.school;
    return patch;
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [gcpResponse, schoolsResponse, groupsResponse, classesResponse] = await Promise.all([
        fetch(`${API_BASE}api/group-class-permissions/`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}api/schools/`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}api/group-class-permissions/available_groups/`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}api/classes/`, { headers: getAuthHeaders() }),
      ]);

      const [gcpData, schoolsData, groupsData, classesData] = await Promise.all([
        gcpResponse.json(),
        schoolsResponse.json(),
        groupsResponse.json(),
        classesResponse.json(),
      ]);

      if (!gcpResponse.ok) throw new Error(gcpData.detail || 'Failed to fetch group class permissions');
      if (!schoolsResponse.ok) throw new Error(schoolsData.detail || 'Failed to fetch schools');
      if (!groupsResponse.ok) throw new Error(groupsData.detail || 'Failed to fetch available groups');
      if (!classesResponse.ok) throw new Error(classesData.detail || 'Failed to fetch classes');

      setGroupClassPermissions(gcpData.data?.results || []);
      setSchools(schoolsData.data?.results || []);
      setGroups(groupsData.data || []);
      setClasses(classesData.data?.results || []);

      if (!selectedSchool && schoolsData.data?.results?.length > 0) {
        setSelectedSchool(schoolsData.data.results[0].id);
        setFormData((prev) => ({ ...prev, school: schoolsData.data.results[0].id }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      if (String(error?.message || '').includes('401')) {
        showToast('Session expired. Please log in again.', 'error');
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_role');
        Cookies.remove('username');
        localStorage.removeItem('user_permissions');
        window.location.href = '/login';
      } else {
        showToast(`Failed to load data: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSchool]);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      showToast('Please log in to access this feature', 'error');
      window.location.href = '/login';
      return;
    }
    fetchInitialData();
  }, [fetchInitialData]);

  const createGroupClassPermission = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create group class permission');
      }
      await fetchInitialData();
      showToast('Permission created successfully', 'success');
      return await response.json();
    } catch (error) {
      console.error('Error creating GCP:', error);
      showToast(`Failed to create permission: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const patchGroupClassPermission = async (id, patch) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to partially update group class permission');
      }
      await fetchInitialData();
      showToast('Permission updated (partial)', 'success');
      return await response.json();
    } catch (error) {
      console.error('Error PATCH GCP:', error);
      showToast(`Failed to update (partial): ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const putGroupClassPermission = async (id, payload) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${id}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fully update group class permission');
      }
      await fetchInitialData();
      showToast('Permission updated (full)', 'success');
      return await response.json();
    } catch (error) {
      console.error('Error PUT GCP:', error);
      showToast(`Failed to update (full): ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroupClassPermission = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete group class permission');
      }
      await fetchInitialData();
      showToast('Permission deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting GCP:', error);
      showToast(`Failed to delete permission: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getGroupClassPermission = async (id) => {
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${id}/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch group class permission');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching GCP:', error);
      showToast(`Failed to load permission: ${error.message}`, 'error');
      return null;
    }
  };

  const getAvailableClasses = async (gcpId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${gcpId}/available_classes/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch available classes');
      }
      const data = await response.json();
      const availableClassesData = Array.isArray(data.data) ? data.data : data.data?.results || [];
      setAvailableClasses(availableClassesData);
      return availableClassesData;
    } catch (error) {
      console.error('Error fetching available classes:', error);
      showToast(`Failed to fetch available classes: ${error.message}`, 'error');
      setAvailableClasses([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCurrentClasses = async (gcpId) => {
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${gcpId}/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch current classes');
      }
      const data = await response.json();
      const classesData = Array.isArray(data.data.classes) ? data.data.classes : [];
      setCurrentClasses(classesData);
      return classesData;
    } catch (error) {
      console.error('Error fetching current classes:', error);
      showToast(`Failed to fetch current classes: ${error.message}`, 'error');
      setCurrentClasses([]);
      return [];
    }
  };

  const addClassesToGCP = async (gcpId, classIds) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${gcpId}/add_classes/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ class_ids: classIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add classes');
      }
      await Promise.all([fetchInitialData(), getAvailableClasses(gcpId), getCurrentClasses(gcpId)]);
      showToast('Class added', 'success');
    } catch (error) {
      console.error('Error adding classes:', error);
      showToast(`Failed to add classes: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeClassesFromGCP = async (gcpId, classIds) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/${gcpId}/remove_classes/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ class_ids: classIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove classes');
      }
      await Promise.all([fetchInitialData(), getAvailableClasses(gcpId), getCurrentClasses(gcpId)]);
      showToast('Class removed', 'success');
    } catch (error) {
      console.error('Error removing classes:', error);
      showToast(`Failed to remove classes: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (gcp) => {
    const fullGcp = await getGroupClassPermission(gcp.id);
    if (fullGcp) {
      setFormData({
        title: fullGcp.title,
        group: fullGcp.group,
        class_ids: fullGcp.classes?.map((c) => c.id) || [],
        school: fullGcp.school,
      });
      setEditingGCP(fullGcp);
      setShowCreateForm(true);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.group || !formData.school) {
      showToast('Please fill in Title, Group, and School', 'error');
      return;
    }

    try {
      if (editingGCP && editingGCP.id) {
        const patch = buildPatch(
          { title: editingGCP.title, group: editingGCP.group, school: editingGCP.school },
          { title: formData.title, group: formData.group, school: formData.school }
        );

        if (Object.keys(patch).length === 0) {
          showToast('No changes to save', 'confirmation');
        } else if (Object.keys(patch).length < 3) {
          await patchGroupClassPermission(editingGCP.id, patch);
        } else {
          await putGroupClassPermission(editingGCP.id, {
            title: formData.title,
            group: formData.group,
            school: formData.school,
            class_ids: formData.class_ids,
          });
        }
      } else {
        await createGroupClassPermission({
          title: formData.title,
          group: formData.group,
          school: formData.school,
          class_ids: formData.class_ids,
        });
      }

      setShowCreateForm(false);
      setEditingGCP(null);
      setFormData({ title: '', group: '', class_ids: [], school: selectedSchool || '' });
    } catch {
      // Errors are already toasted
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmToast('Delete this permission? This action cannot be undone.');
    if (ok) {
      await deleteGroupClassPermission(id);
    } else {
      showToast('Deletion cancelled', 'confirmation');
    }
  };

  const handleShowClasses = async (gcp) => {
    setSelectedGCPForClasses(gcp);
    await Promise.all([getAvailableClasses(gcp.id), getCurrentClasses(gcp.id)]);
  };

  const filteredGCPs = groupClassPermissions.filter(
    (gcp) =>
      gcp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gcp.group_name && gcp.group_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 md:px-6 lg:px-8">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
      />
      <div className="max-w-7xl mx-auto py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-md sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                Class Permissions
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Manage group access to classes</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  School <span className="text-red-500">*</span>
                </label>
                <Select
                  value={schools.find((school) => school.id === selectedSchool) || null}
                  onChange={(selected) => {
                    setSelectedSchool(selected?.id || '');
                    setFormData((prev) => ({ ...prev, school: selected?.id || '' }));
                  }}
                  options={schools}
                  getOptionLabel={(school) => school.school_name}
                  getOptionValue={(school) => school.id}
                  placeholder="Select school"
                  isClearable
                  isSearchable
                  className="w-full"
                  classNamePrefix="react-select"
                />
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg mt-5 hover:bg-blue-700 flex items-center gap-2 text-sm disabled:bg-gray-400"
                disabled={!selectedSchool || loading}
              >
                <Plus size={16} />
                Create Permission
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Group Class Permissions</h2>
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
            {!loading && filteredGCPs.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No permissions found. Create your first permission to get started.
              </div>
            )}
            {!loading && filteredGCPs.length > 0 && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {filteredGCPs.map((gcp) => (
                  <div
                    key={gcp.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900">{gcp.title}</h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {gcp.group_name || 'Unknown Group'}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />
                            {gcp.classes_count || 0} classes
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs sm:text-sm text-gray-500">School: </span>
                          <span className="text-xs sm:text-sm text-gray-700">
                            {gcp.school_name || 'Unknown School'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShowClasses(gcp)}
                          className="text-green-600 hover:text-green-700 p-1.5 sm:p-2 rounded-lg hover:bg-green-50"
                          title="Manage Classes"
                        >
                          <UserPlus size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(gcp)}
                          className="text-blue-600 hover:text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(gcp.id)}
                          className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold">
                  {editingGCP ? 'Edit Permission' : 'Create New Permission'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingGCP(null);
                    setFormData({ title: '', group: '', class_ids: [], school: selectedSchool || '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Teachers → Primary Classes"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Group <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={groups.find((group) => group.id === formData.group) || null}
                    onChange={(selected) => setFormData({ ...formData, group: selected?.id || '' })}
                    options={groups}
                    getOptionLabel={(group) => group.name}
                    getOptionValue={(group) => group.id}
                    placeholder="Select group"
                    isClearable
                    isSearchable
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    School <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={schools.find((school) => school.id === formData.school) || null}
                    onChange={(selected) => setFormData({ ...formData, school: selected?.id || '' })}
                    options={schools}
                    getOptionLabel={(school) => school.school_name}
                    getOptionValue={(school) => school.id}
                    placeholder="Select school"
                    isSearchable
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Classes</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                    {classes.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm p-2">No classes available</p>
                    ) : (
                      classes.map((cls) => (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.class_ids.includes(cls.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  class_ids: [...formData.class_ids, cls.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  class_ids: formData.class_ids.filter((id) => id !== cls.id),
                                });
                              }
                            }}
                            className="rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-xs sm:text-sm">{cls.display_name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tip: After creating, use “Manage Classes” to add/remove classes.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm disabled:bg-gray-400"
                    disabled={loading}
                  >
                    <Save size={16} />
                    {editingGCP ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingGCP(null);
                      setFormData({ title: '', group: '', class_ids: [], school: selectedSchool || '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedGCPForClasses && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md sm:max-w-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold">
                  Manage Classes - {selectedGCPForClasses.title}
                </h2>
                <button
                  onClick={() => {
                    setSelectedGCPForClasses(null);
                    setAvailableClasses([]);
                    setCurrentClasses([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-sm sm:text-base font-medium mb-3">Current Classes</h3>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 max-h-64 overflow-y-auto bg-blue-50">
                    {currentClasses.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm">No classes assigned</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          {currentClasses.length} classes assigned
                        </p>
                        {currentClasses.map((cls) => (
                          <div
                            key={cls.id}
                            className="flex items-center justify-between bg-blue-100 p-2 rounded"
                          >
                            <span className="text-xs sm:text-sm">{cls.display_name}</span>
                            <button
                              onClick={() => removeClassesFromGCP(selectedGCPForClasses.id, [cls.id])}
                              className="text-red-600 hover:text-red-700"
                              title="Remove class"
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-medium mb-3">Available Classes</h3>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 max-h-64 overflow-y-auto bg-gray-50">
                    {availableClasses.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm">No available classes</p>
                    ) : (
                      <div className="space-y-2">
                        {availableClasses.map((cls) => (
                          <div
                            key={cls.id}
                            className="flex items-center justify-between bg-gray-100 p-2 rounded"
                          >
                            <span className="text-xs sm:text-sm">{cls.display_name}</span>
                            <button
                              onClick={() => addClassesToGCP(selectedGCPForClasses.id, [cls.id])}
                              className="text-green-600 hover:text-green-700"
                              title="Add class"
                            >
                              <UserPlus size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassPermissionsManager;