import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, GraduationCap, Search, Save, X, UserPlus, UserMinus } from 'lucide-react';
import Cookies from 'js-cookie';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select';

const ClassPermissionsManager = () => {
  const [groupClassPermissions, setGroupClassPermissions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('93047a1b-8cc2-4983-86b1-997bd59dda53');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGCP, setEditingGCP] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGCPForClasses, setSelectedGCPForClasses] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    group: '',
    class_ids: [],
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/';
  const getAuthHeaders = () => {
    const token = Cookies.get('access_token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const confirmToast = (message = 'Are you sure?') =>
    new Promise((resolve) => {
      const id = toast.custom(
        (t) => (
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-800">{message}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  toast.dismiss(id);
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes, delete
              </button>
              <button
                onClick={() => {
                  toast.dismiss(id);
                  resolve(false);
                }}
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

  const buildPatch = (original, current) => {
    const patch = {};
    if (current.title !== original.title) patch.title = current.title;
    if (String(current.group || '') !== String(original.group || '')) patch.group = current.group;
    return patch;
  };

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      toast.error('Please log in to access this feature');
      window.location.href = '/login';
      return;
    }
    fetchInitialData();
  }, [selectedSchool]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGroupClassPermissions(),
        fetchSchools(),
        fetchAvailableGroups(),
        fetchClasses(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      if (String(error?.message || '').includes('401')) {
        toast.error('Session expired. Please log in again.');
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_role');
        Cookies.remove('username');
        localStorage.removeItem('user_permissions');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupClassPermissions = async () => {
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch group class permissions');
      }
      const data = await response.json();
      setGroupClassPermissions(data.results || data);
    } catch (error) {
      console.error('Error fetching GCPs:', error);
      toast.error(`Failed to load permissions: ${error.message}`);
      throw error;
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch(`${API_BASE}api/schools/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch schools');
      }
      const data = await response.json();
      setSchools(data.results || data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error(`Failed to load schools: ${error.message}`);
      throw error;
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/available_groups/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch available groups');
      }
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(`Failed to load groups: ${error.message}`);
      throw error;
    }
  };

  const fetchClasses = async (searchParams = '') => {
    try {
      const url = searchParams ? `${API_BASE}api/classes/?${searchParams}` : `${API_BASE}api/classes/`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data.results || data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error(`Failed to load classes: ${error.message}`);
      throw error;
    }
  };

  const createGroupClassPermission = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/group-class-permissions/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          school: selectedSchool,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create group class permission');
      }
      await fetchGroupClassPermissions();
      toast.success('Permission created successfully');
      return await response.json();
    } catch (error) {
      console.error('Error creating GCP:', error);
      toast.error(`Failed to create permission: ${error.message}`);
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
      await fetchGroupClassPermissions();
      toast.success('Permission updated (partial)');
      return await response.json();
    } catch (error) {
      console.error('Error PATCH GCP:', error);
      toast.error(`Failed to update (partial): ${error.message}`);
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
      await fetchGroupClassPermissions();
      toast.success('Permission updated (full)');
      return await response.json();
    } catch (error) {
      console.error('Error PUT GCP:', error);
      toast.error(`Failed to update (full): ${error.message}`);
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
        throw new Error(errorData.detail

          || 'Failed to delete group class permission');
      }
      await fetchGroupClassPermissions();
      toast.success('Permission deleted successfully');
    } catch (error) {
      console.error('Error deleting GCP:', error);
      toast.error(`Failed to delete permission: ${error.message}`);
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
      return await response.json();
    } catch (error) {
      console.error('Error fetching GCP:', error);
      toast.error(`Failed to load permission: ${error.message}`);
      return null;
    }
  };

  const handleEdit = async (gcp) => {
    try {
      const fullGcp = await getGroupClassPermission(gcp.id);
      if (fullGcp) {
        setFormData({
          title: fullGcp.title,
          group: fullGcp.group || '',
          class_ids: fullGcp.class_ids || [],
        });
        setEditingGCP(fullGcp);
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error('Error preparing edit:', error);
      setFormData({
        title: gcp.title,
        group: gcp.group || '',
        class_ids: gcp.class_ids || [],
      });
      setEditingGCP(gcp);
      setShowCreateForm(true);
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
      const availableClassesData = data.results || data;
      setAvailableClasses(Array.isArray(availableClassesData) ? availableClassesData : []);
      return availableClassesData;
    } catch (error) {
      console.error('Error fetching available classes:', error);
      toast.error(`Failed to fetch available classes: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
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
      await fetchGroupClassPermissions();
      await getAvailableClasses(gcpId);
      toast.success('Class added');
    } catch (error) {
      console.error('Error adding classes:', error);
      toast.error(`Failed to add classes: ${error.message}`);
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
      await fetchGroupClassPermissions();
      await getAvailableClasses(gcpId);
      toast.success('Class removed');
    } catch (error) {
      console.error('Error removing classes:', error);
      toast.error(`Failed to remove classes: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.group) {
      toast.error('Please fill in Title and Group');
      return;
    }

    try {
      if (editingGCP && editingGCP.id) {
        const patch = buildPatch(
          { title: editingGCP.title, group: editingGCP.group },
          { title: formData.title, group: formData.group }
        );

        if (Object.keys(patch).length === 0) {
          toast('No changes to save', { icon: 'ℹ️' });
        } else if (Object.keys(patch).length < 2) {
          await patchGroupClassPermission(editingGCP.id, patch);
        } else {
          await putGroupClassPermission(editingGCP.id, {
            title: formData.title,
            group: formData.group,
            school: selectedSchool,
          });
        }

        setEditingGCP(null);
      } else {
        await createGroupClassPermission(formData);
      }

      setShowCreateForm(false);
      setFormData({ title: '', group: '', class_ids: [] });
    } catch {
      // errors are already toasted
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmToast('Delete this permission? This action cannot be undone.');
    if (ok) {
      await deleteGroupClassPermission(id);
    } else {
      toast('Deletion cancelled', { icon: '🟰' });
    }
  };

  const handleShowClasses = async (gcp) => {
    setSelectedGCPForClasses(gcp);
    await getAvailableClasses(gcp.id);
  };

  const filteredGCPs = groupClassPermissions.filter(
    (gcp) =>
      gcp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gcp.group_name && gcp.group_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-full mx-auto py-4 sm:py-6">
        <Toaster position="top-center" />
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-md sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                Class Permissions
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Manage group access to classes</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              {/* School Dropdown with react-select */}
              <div className="w-full sm:w-48">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  School <span className="text-red-500">*</span>
                </label>
                <Select
                  value={schools.find((school) => school.id === selectedSchool) || null}
                  onChange={(selected) => setSelectedSchool(selected?.id || '')}
                  options={schools}
                  getOptionLabel={(school) => school.school_name || school.name}
                  getOptionValue={(school) => school.id}
                  placeholder="Search & select"
                  isClearable
                  isSearchable
                  className="w-full"
                  classNamePrefix="react-select"
                />
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg mt-5 hover:bg-blue-700 flex items-center gap-2 text-sm"
                disabled={!selectedSchool}
              >
                <Plus size={16} />
                Create Permission
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
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

        {/* Permissions List */}
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
                          className="text-green-600 hover:text-green-700 p-1.5 sm:p

-2 rounded-lg hover:bg-green-50"
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

        {/* Create/Edit Form Modal */}
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
                    setFormData({ title: '', group: '', class_ids: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
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
                    placeholder="Search & select group"
                    isClearable
                    isSearchable
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Classes</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                    {classes.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm p-2">Loading classes...</p>
                    ) : (
                      classes.map((cls) => (
                        <label
                          key={cls.id}
                          className="/flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded"
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
                          <span className="text-xs sm:text-sm">
                            {cls.display_name || cls.class_name || cls.name}
                          </span>
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
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                    disabled={loading}
                  >
                    <Save size={16} />
                    {editingGCP ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingGCP(null);
                      setFormData({ title: '', group: '', class_ids: [] });
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

        {/* Manage Classes Modal */}
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
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* <div>
                  <h3 className="text-sm sm:text-base font-medium mb-3">Current Classes</h3>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 max-h-64 overflow-y-auto bg-blue-50">
                    {!selectedGCPForClasses.class_ids || selectedGCPForClasses.class_ids.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm">No classes assigned</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          {selectedGCPForClasses.classes_count || 0} classes assigned
                        </p>
                        {selectedGCPForClasses.class_ids &&
                          classes
                            .filter((c) => selectedGCPForClasses.class_ids.includes(c.id))
                            .map((cls) => (
                              <div
                                key={cls.id}
                                className="flex items-center justify-between bg-blue-100 p-2 rounded"
                              >
                                <span className="text-xs sm:text-sm">
                                  {cls.display_name || cls.class_name || cls.name}
                                </span>
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
                </div> */}
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
                            <span className="text-xs sm:text-sm">
                              {cls.display_name || cls.class_name || cls.name}
                            </span>
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