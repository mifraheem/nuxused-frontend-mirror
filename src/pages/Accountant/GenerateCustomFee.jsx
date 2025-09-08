import { useState, useEffect } from 'react';

import toast, { Toaster } from 'react-hot-toast';
import apiRequest from '../../helpers/apiRequest';


const GenerateCustomFee = () => {
  const [mode, setMode] = useState(null);
  const [classes, setClasses] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [studentsForSelectedClass, setStudentsForSelectedClass] = useState([]);

  const [formData, setFormData] = useState({
    class_id: '',
    student_id: '',
    selected_students: [],
    fee_type_id: '',
    amount: '',
    due_date: '',
    is_paid: false,
    payment_date: ''
  });

  useEffect(() => {
    if (mode) {
      getClasses();
      getFeeTypes();
    }
  }, [mode]);

  const getClasses = async () => {
    try {
      const res = await apiRequest('/classes');
      setClasses(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const getFeeTypes = async () => {
    try {
      const res = await apiRequest('/fee-types');
      setFeeTypes(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching fee types:', err);
    }
  };

  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => String(c.id) === String(classId));

    setFormData(prev => ({
      ...prev,
      class_id: classId,
      student_id: ''
    }));

    if (selectedClass?.students?.length) {
      const formatted = selectedClass.students.map((name, i) => ({
        id: `${classId}-${i}`,
        name
      }));
      setStudentsForSelectedClass(formatted);
    } else {
      setStudentsForSelectedClass([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'class_id') {
      handleClassChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      fee_structure_id: formData.fee_type_id,
      amount: formData.amount,
      due_date: formData.due_date,
      is_paid: formData.is_paid,
    };
  
    if (formData.is_paid && formData.payment_date) {
      payload.payment_date = formData.payment_date;
    }
  
    try {
      if (mode === 'individual') {
        // student_id must be profile_id (a number)
        const selectedStudent = studentsForSelectedClass.find(s => s.name === formData.student_id);
        if (!selectedStudent || !selectedStudent.profile_id) {
          toast.error("Selected student not valid.");
          return;
        }
  
        await apiRequest('/student-fees/', 'POST', {
          ...payload,
          student_id: selectedStudent.profile_id,
        });
  
        toast.success("Fee generated successfully!");
      } else {
        await Promise.all(
          formData.selected_students.map((sid) =>
            apiRequest('/student-fees/', 'POST', {
              ...payload,
              student_id: sid,
            })
          )
        );
        toast.success("Bulk fee assigned!");
      }
    } catch (err) {
      toast.error(err?.message || "Error assigning fee");
    }
  };
  
  

  return (
    <div className="pt-8">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="flex justify-between items-center bg-blue-800 text-white rounded-lg p-4 mb-8 shadow-md">
        <h2 className="text-2xl font-bold">Generate Custom Fee</h2>
        <div className="flex gap-4">
          {!mode && (
            <>
              <button onClick={() => setMode('individual')} className="bg-cyan-400 hover:bg-cyan-500 px-5 py-2 rounded font-semibold">
                Individual Fee
              </button>
              <button onClick={() => setMode('bulk')} className="bg-cyan-400 hover:bg-cyan-500 px-5 py-2 rounded font-semibold">
                Bulk Fee
              </button>
            </>
          )}
          {mode && (
            <button onClick={() => setMode(null)} className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded font-semibold">
              Close Form
            </button>
          )}
        </div>
      </div>

      <div className="p-8">
        {mode && (
          <div className="flex justify-center">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Class</label>
                <select name="class_id" value={formData.class_id} onChange={handleChange} className="w-full border p-2 rounded">
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} {c.section}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'individual' && (
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Student</label>
                  <select name="student_id" value={formData.student_id} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="">Select Student</option>
                    {studentsForSelectedClass.map(student => (
                      <option key={student.id} value={student.name}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block font-semibold mb-1">Fee Type</label>
                <select name="fee_type_id" value={formData.fee_type_id} onChange={handleChange} className="w-full border p-2 rounded">
                  <option value="">Select Fee Type</option>
                  {feeTypes.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Amount</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>

              <div>
                <label className="block font-semibold mb-1">Due Date</label>
                <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" name="is_paid" checked={formData.is_paid} onChange={handleChange} />
                <label className="font-semibold">Is Paid?</label>
              </div>

              {formData.is_paid && (
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Payment Date</label>
                  <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
              )}

              <div className="col-span-2">
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold">Assign Fee</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateCustomFee;
