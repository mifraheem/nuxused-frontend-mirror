import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import apiRequest from '../../helpers/apiRequest';
import toast, { Toaster } from 'react-hot-toast';
import { Buttons } from '../../components';

const DecrementFee = () => {
  const [discounts, setDiscounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mode, setMode] = useState(null);
  const [formData, setFormData] = useState({ student_id: '', amount: '', reason: '' });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/fee-discounts/');
      setDiscounts(res?.data?.results || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setDiscounts([]);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await apiRequest('/api/auth/users/list_profiles/student');
      setStudents(res?.data?.results || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchStudents();
  }, []);

  const handleEditClick = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      await apiRequest(`/fee-discounts/${editData.student_fee}/`, 'PATCH', {
        amount: Number(editData.amount),
        reason: editData.reason
      });
      toast.success('Discount updated successfully!');
      fetchDiscounts();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating discount:', err);
      toast.error('Failed to update discount!');
    }
  };

  const handleDeleteClick = (student_fee_id) => {
    toast((t) => (
      <div>
        <p>Are you sure you want to delete?</p>
        <div className="flex gap-4 mt-2 justify-center">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiRequest(`/fee-discounts/${student_fee_id}/`, 'DELETE');
                fetchDiscounts();
                toast.success('Discount deleted successfully!');
              } catch (err) {
                console.error('Delete error:', err);
                toast.error('Failed to delete discount!');
              }
            }}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
          >Yes</button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
          >No</button>
        </div>
      </div>
    ), { position: 'top-center' });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/fee-discounts/', 'POST', {
        student_id: Number(formData.student_id),
        amount: Number(formData.amount),
        reason: formData.reason
      });
      toast.success('Discount created successfully!');
      setFormData({ student_id: '', amount: '', reason: '' });
      fetchDiscounts();
      setMode(null);
    } catch (err) {
      console.error('Error creating discount:', err);
      toast.error('Failed to create discount!');
    }
  };

  const handleDoubleClick = () => {
    setMode(null);
    setEditData(null);
  };

  return (
    <div className="mt-4 bg-blue-50 min-h-screen" onDoubleClick={handleDoubleClick}>
      <Toaster />

      <div className="flex justify-between items-center bg-blue-800 text-white rounded-lg p-4 mb-8 shadow-md ">
        <h2 className="text-2xl font-bold">Manage Fee Discounts</h2>
        <div className="flex gap-4">
          {!mode && (
            <>
              <button onClick={() => setMode('create')} className="bg-cyan-400 hover:bg-cyan-500 px-5 py-2 rounded font-semibold flex items-center gap-2">
                Create Discount
              </button>
              <button onClick={() => { setMode('list'); fetchDiscounts(); }} className="bg-cyan-400 hover:bg-cyan-500 px-5 py-2 rounded font-semibold flex items-center gap-2">
                List Discounts
              </button>
            </>
          )}
          {mode && (
            <button onClick={() => setMode(null)} className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded font-semibold flex items-center gap-2">
              Close
            </button>
          )}
        </div>
      </div>

      {mode === 'create' && (
        <form className="bg-white shadow-md rounded-lg p-6 mx-8 w-full max-w-xl mx-auto" onSubmit={handleCreateSubmit}>
          <h2 className="text-xl font-bold mb-4">Create Fee Discount</h2>
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Student</label>
            <select
              name="student_id"
              required
              className="border w-full p-2 rounded"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.profile_id} value={student.profile_id}>
                  {student.user?.username}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Amount</label>
            <input
              type="number"
              name="amount"
              required
              className="border w-full p-2 rounded"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Reason</label>
            <input
              type="text"
              name="reason"
              required
              className="border w-full p-2 rounded"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
              Create Discount
            </button>
          </div>
        </form>
      )}

      {mode === 'list' && (
        <div className="rounded-lg p-4 mt-2 mx-8 overflow-x-auto">
          {loading && <p className="text-center text-blue-600">Loading...</p>}
          <table className="bg-white w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Discount Amount</th>
                <th className="p-2 border">Reason</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((item, index) => (
                <tr key={item.id || index} className="border">
                  <td className="p-2 border text-center">{index + 1}</td>
                  <td className="p-2 border">{item.student_name}</td>
                  <td className="p-2 border">{item.amount}</td>
                  <td className="p-2 border">{item.reason}</td>
                  <td className="p-2 flex justify-center gap-4">
                    <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                    <button onClick={() => handleDeleteClick(item.student_fee)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Edit Fee Discount</h2>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Amount</label>
              <input
                type="number"
                className="border w-full p-2 rounded"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Reason</label>
              <input
                type="text"
                className="border w-full p-2 rounded"
                value={editData.reason}
                onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowEditModal(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleEditSubmit} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecrementFee;