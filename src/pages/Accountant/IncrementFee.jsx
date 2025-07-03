import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import apiRequest from '../../helpers/apiRequest';
import toast, { Toaster } from 'react-hot-toast';

const IncrementFee = () => {
  const [mode, setMode] = useState(null);
  const [bulkFees, setBulkFees] = useState([]);
  const [individualFees, setIndividualFees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editData, setEditData] = useState(null); // store selected row for editing
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchBulkFees = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/fee-structures/');
      setBulkFees(res?.data?.results || []);
    } catch (err) {
      console.error('Error fetching bulk fees:', err);
      setBulkFees([]);
    }
    setLoading(false);
  };

  const fetchIndividualFees = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/student-fees/');
      setIndividualFees(res?.data?.results || []);
    } catch (err) {
      console.error('Error fetching individual fees:', err);
      setIndividualFees([]);
    }
    setLoading(false);
  };

  const handleModeClick = (selectedMode) => {
    if (mode === selectedMode) {
      setMode(null);
    } else {
      setMode(selectedMode);
    }
  };

  useEffect(() => {
    if (mode === 'bulk') fetchBulkFees();
    else if (mode === 'individual') fetchIndividualFees();
  }, [mode]);

  const handleEditClick = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      if (mode === 'bulk') {
        await apiRequest(`/fee-structures/${editData.id}/`, 'PATCH', {
          amount: Number(editData.amount)
        });
        toast.success('Amount updated successfully!');
        fetchBulkFees();
      } else {
        await apiRequest(`/student-fees/${editData.id}/`, 'PATCH', {
          is_paid: editData.is_paid,
          payment_date: editData.payment_date
        });
        toast.success('Payment updated successfully!');
        fetchIndividualFees();
      }
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating fee:', err);
      toast.error('Failed to update fee!');
    }
  };

  const handleDeleteClick = (id) => {
    toast((t) => (
      <div>
        <p>Are you sure you want to delete?</p>
        <div className="flex gap-4 mt-2 justify-center">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                if (mode === 'bulk') {
                  await apiRequest(`/fee-structures/${id}/`, 'DELETE');
                  fetchBulkFees();
                } else {
                  await apiRequest(`/student-fees/${id}/`, 'DELETE');
                  fetchIndividualFees();
                }
                toast.success('Deleted successfully!');
              } catch (err) {
                console.error('Delete error:', err);
                toast.error('Delete failed!');
              }
            }}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
          >
            No
          </button>
        </div>
      </div>
    ), { position: 'top-center' });
  };

  return (
    <div className="mt-4">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between bg-blue-800 text-white px-8 py-4 rounded-md mb-6 shadow-md">
        <h1 className="text-2xl font-extrabold">Fee List and Actions</h1>
        <div className="flex gap-4">
          <button
            onClick={() => handleModeClick('bulk')}
            className="bg-cyan-400 hover:bg-cyan-500 text-white font-semibold px-5 py-2 rounded-md shadow"
          >Bulk Fee List</button>
          <button
            onClick={() => handleModeClick('individual')}
            className="bg-cyan-400 hover:bg-cyan-500 text-white font-semibold px-5 py-2 rounded-md shadow"
          >Individual Fee List</button>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 min-h-screen">
        {loading && <p className="text-center text-blue-600">Loading...</p>}

        {mode && !loading && (
          <div className="bg-white shadow-md rounded-lg p-4 mx-8 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 border">#</th>
                  {mode === 'individual' ? (
                    <>
                      <th className="p-2 border">Student Name</th>
                      <th className="p-2 border">Class</th>
                      <th className="p-2 border">Section</th>
                      <th className="p-2 border">Session</th>
                      <th className="p-2 border">Fee Type</th>
                      <th className="p-2 border">Is Paid</th>
                      <th className="p-2 border">Payment Date</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2 border">School</th>
                      <th className="p-2 border">Class</th>
                      <th className="p-2 border">Section</th>
                      <th className="p-2 border">Session</th>
                      <th className="p-2 border">Fee Type</th>
                      <th className="p-2 border">Amount</th>
                      <th className="p-2 border">Due Date</th>
                    </>
                  )}
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(mode === 'bulk' ? bulkFees : individualFees).map((item, index) => (
                  <tr key={item.id || index} className="border">
                    <td className="p-2 border text-center">{index + 1}</td>
                    {mode === 'individual' ? (
                      <>
                        <td className="p-2 border">{item.student_name}</td>
                        <td className="p-2 border">{item.class_name}</td>
                        <td className="p-2 border">{item.section}</td>
                        <td className="p-2 border">{item.session}</td>
                        <td className="p-2 border">{item.fee_type}</td>
                        <td className="p-2 border">{item.is_paid ? 'Yes' : 'No'}</td>
                        <td className="p-2 border">{item.payment_date}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 border">{item.school}</td>
                        <td className="p-2 border">{item.class_name}</td>
                        <td className="p-2 border">{item.class_section}</td>
                        <td className="p-2 border">{item.class_session}</td>
                        <td className="p-2 border">{item.fee_type}</td>
                        <td className="p-2 border">{item.amount}</td>
                        <td className="p-2 border">{item.due_date}</td>
                      </>
                    )}
                    <td className="p-2 border flex gap-3 justify-center">
                      <button className="text-blue-600" onClick={() => handleEditClick(item)}><FaEdit /></button>
                      <button className="text-red-600" onClick={() => handleDeleteClick(item.id)}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Edit Fee</h2>
            {mode === 'bulk' ? (
              <div>
                <label className="block mb-2 font-semibold">Amount</label>
                <input
                  type="number"
                  className="border w-full p-2 rounded"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Is Paid?</label>
                  <select
                    className="border w-full p-2 rounded"
                    value={editData.is_paid}
                    onChange={(e) => setEditData({ ...editData, is_paid: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Payment Date</label>
                  <input
                    type="date"
                    className="border w-full p-2 rounded"
                    value={editData.payment_date}
                    onChange={(e) => setEditData({ ...editData, payment_date: e.target.value })}
                  />
                </div>
              </>
            )}
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

export default IncrementFee;