import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_SERVER_URL;


const BulkFee = () => {
  const [classes, setClasses] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [form, setForm] = useState({
    classId: '',
    feeTypeId: '',
    feeMonth: '',
    amount: '',
    dueDate: '',
  });

  useEffect(() => {
    axios.get(`${API}classes`, { withCredentials: true })
      .then(res => setClasses(res.data.data || []));
    axios.get(`$${API}fee-types`, { withCredentials: true })
      .then(res => setFeeTypes(res.data.data || []));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      class_id: form.classId,
      fee_structure_id: form.feeTypeId,
      amount: form.amount,
      due_date: form.dueDate,
      fee_month: form.feeMonth,
    };

    try {
      const res = await axios.post(`${API}bulk-fees/`, payload, {
        withCredentials: true
      });
      alert(res.data.message || 'Bulk fee generated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating bulk fee');
    }
  };

  return (
    <div className='bg-blue-50 min-h-screen p-6'>
      <h1 className="text-white font-extrabold bg-blue-900 py-4 px-6 text-xl rounded-sm mb-6">
        Generate Bulk Fee
      </h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md p-6 rounded-md space-y-4 max-w-xl mx-auto">
        <div>
          <label className="block mb-1 font-semibold">Class</label>
          <select name="classId" value={form.classId} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.class_name} {c.section}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Fee Type</label>
          <select name="feeTypeId" value={form.feeTypeId} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Fee Type</option>
            {feeTypes.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Fee Month</label>
          <select name="feeMonth" value={form.feeMonth} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Month</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
              .map(month => (
                <option key={month} value={month.toLowerCase()}>{month}</option>
              ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Amount</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Due Date</label>
          <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded">
          Generate Fee
        </button>
      </form>
    </div>
  );
};

export default BulkFee;
