import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast, { Toaster } from 'react-hot-toast';
import apiRequest from '../../helpers/apiRequest';
import { MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import Select from 'react-select';




const CreateExam = () => {
  const [form, setForm] = useState({
    term_name: '',
    session: '',
    class_id: '',
    start_date: '',
    end_date: '',
    subjects: [{
      subject_id: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      room_id: '',
      invigilator_id: null // Changed from '' to null
    }]
  });


  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjectsOptions, setSubjectsOptions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [invigilators, setInvigilators] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewExam, setViewExam] = useState(null); // for modal
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);


  const printRef = useRef();

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}exams/`;

  useEffect(() => {
    getClasses();
    getSubjects();
    getRooms();
    getInvigilators();
    getExams();
  }, []);

  const getClasses = async () => {
    const res = await apiRequest('/classes');
    setClasses(res.data.results || res.data);
  };

  const getSubjects = async () => {
    const res = await apiRequest('/subjects');
    setSubjectsOptions(res.data.results || res.data);
  };

  const getRooms = async () => {
    const res = await apiRequest('/rooms');
    setRooms(res.data.results || res.data);
  };

  const getInvigilators = async () => {
    const res = await apiRequest('/api/auth/users/list_profiles/teacher/');
    setInvigilators(res.data.results || res.data);
  };
  const getExams = async (currentPage = page, currentSize = pageSize) => {
    try {
      const res = await apiRequest(`/exams/?page=${currentPage}&page_size=${currentSize}`);
      const data = res.data || res;

      if (data.results) {
        setExams(data.results);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error('Unexpected exam response format');
      }
    } catch (error) {
      toast.error('Failed to fetch exams');
    }
  };



  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...form.subjects];

    // Special handling for ID fields
    if (['subject_id', 'room_id', 'invigilator_id'].includes(field)) {
      updatedSubjects[index][field] = value === '' || value === null ? null : Number(value);
    } else {
      updatedSubjects[index][field] = value;
    }

    // Force state update by creating new array reference
    setForm({
      ...form,
      subjects: [...updatedSubjects]
    });
  };

  const addSubject = () => {
    setForm({
      ...form,
      subjects: [
        ...form.subjects,
        {
          subject_id: '',
          exam_date: '',
          start_time: '',
          end_time: '',
          room_id: '',
          invigilator_id: null // Changed from '' to null
        }
      ]
    });
  };


  const handleSubmit = async () => {
    const payload = {
      ...form,
      class_id: Number(form.class_id),
      subjects: form.subjects.map(s => ({
        subject_id: Number(s.subject_id),
        exam_date: s.exam_date,
        start_time: s.start_time,
        end_time: s.end_time,
        room_id: Number(s.room_id),
        invigilator_id: s.invigilator_id ? Number(s.invigilator_id) : null
      }))
    };

    try {
      const method = selectedExam ? 'put' : 'post';
      const url = selectedExam ? `${API_URL}${selectedExam.exam_id}/` : API_URL;

      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${Cookies.get('access_token')}` }
      });

      setForm({
        term_name: '',
        session: '',
        class_id: '',
        start_date: '',
        end_date: '',
        subjects: [{
          subject_id: '',
          exam_date: '',
          start_time: '',
          end_time: '',
          room_id: '',
          invigilator_id: null
        }]
      });
      setSelectedExam(null);
      setShowForm(false);
      toast.success(`Exam ${selectedExam ? 'updated' : 'created'} successfully`);
      getExams();
    } catch (error) {
      toast.error(`Failed to ${selectedExam ? 'update' : 'create'} exam`);
      console.error(error);
    }
  };



  // Add this right before your return statement
  useEffect(() => {
    console.log('Current form state:', JSON.stringify(form, null, 2));
  }, [form]);

  const handleDeleteExam = (id) => {
    if (!canDelete) {
      toast((t) => (
        <div className="text-center font-semibold p-4 bg-red-100 border border-red-400 rounded shadow-md">
          🚫 You do not have permission to delete exams.
          <div className="mt-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      ), { position: 'top-center' });
      return;
    }

    toast((t) => (
      <div>
        <p className="text-gray-800">Are you sure you want to delete this exam?</p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                const token = Cookies.get('access_token');
                await axios.delete(`${API_URL}${id}/`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Exam deleted successfully!");
                setExams((prev) => prev.filter((exam) => exam.exam_id !== id));
                toast.dismiss(t.id);
              } catch (error) {
                toast.error("Failed to delete exam");
              }
            }}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            No
          </button>
        </div>
      </div>
    ), { position: 'top-center', duration: 5000 });
  };

  useEffect(() => {
    getClasses();
    getSubjects();
    getRooms();
    getInvigilators();
  }, []);

  useEffect(() => {
    getExams();
  }, [page, pageSize]);

  // Get permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

  // Define what the user can do
  const canAdd = permissions.includes("users.add_exam");
  const canEdit = permissions.includes("users.change_exam");
  const canDelete = permissions.includes("users.delete_exam");

  <style>
    {`
    @media print {
      .no-print {
        display: none !important;
      }
    }
  `}
  </style>

  return (
    <div>
      <Toaster />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Manage Exams</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) setSelectedExam(null); // reset edit mode on closing
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">{showForm ? '-' : '+'}</span>
            </div>
            {showForm ? 'Close Form' : 'Create Exam'}
          </button>
        )}

      </div>

      {(canAdd || canEdit) && showForm && (
        <div className="p-6  bg-white rounded-lg shadow-md border border-gray-200 mt-6 max-w-6xl mx-7">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4" >
            {selectedExam ? "Edit Exam Schedule" : "Create New Exam Schedule"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Name</label>
              <input
                placeholder="e.g. Mid Term"
                value={form.term_name}
                onChange={(e) => setForm({ ...form, term_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <input
                placeholder="e.g. 2024-2025"
                value={form.session}
                onChange={(e) => setForm({ ...form, session: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <Select
                name="class_id"
                value={classes.find(c => c.id === Number(form.class_id)) || null}
                onChange={(selected) => setForm({ ...form, class_id: selected?.id || "" })}
                options={classes}
                getOptionLabel={(cls) => `${cls.class_name}-${cls.section} (${cls.session})`}
                getOptionValue={(cls) => cls.id}
                placeholder="Select Class"
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <h3 className="mt-8 text-xl font-semibold text-blue-800">Subjects</h3>

          {form.subjects.map((sub, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4 p-4 bg-gray-50 border rounded-lg">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Select
                  name="subject"
                  className="w-full"
                  value={subjectsOptions.find(s => s.id === Number(sub.subject_id)) || null}
                  onChange={(selected) => handleSubjectChange(idx, "subject_id", selected?.id || "")}
                  options={subjectsOptions}
                  getOptionLabel={(s) => s.subject_name}
                  getOptionValue={(s) => s.id}
                  placeholder="Select Subject"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
                <input
                  type="date"
                  value={sub.exam_date}
                  onChange={(e) => handleSubjectChange(idx, 'exam_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={sub.start_time}
                  onChange={(e) => handleSubjectChange(idx, 'start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={sub.end_time}
                  onChange={(e) => handleSubjectChange(idx, 'end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <Select
                  name="room"
                  className="w-full"
                  value={rooms.find(r => r.id === Number(sub.room_id)) || null}
                  onChange={(selected) => handleSubjectChange(idx, "room_id", selected?.id || "")}
                  options={rooms}
                  getOptionLabel={(r) => r.room_name}
                  getOptionValue={(r) => r.id}
                  placeholder="Room"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invigilator</label>
                <Select
                  name="invigilator"
                  className="w-full"
                  value={invigilators.find(t => t.profile_id === Number(sub.invigilator_id)) || null}
                  onChange={(selected) =>
                    handleSubjectChange(idx, "invigilator_id", selected?.profile_id || null)
                  }
                  options={invigilators}
                  getOptionLabel={(t) => `${t.first_name || ""} ${t.last_name || ""}`.trim()}
                  getOptionValue={(t) => t.profile_id}
                  placeholder="Invigilator"
                  isClearable
                />
              </div>
            </div>
          ))}

          <div className="mt-4">
            <button
              onClick={addSubject}
              className="text-blue-600 font-semibold hover:underline"
            >
              + Add Subject
            </button>
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
            >
              {selectedExam ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </div>
      )}

      {/* Exam Table */}
      <div className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Exam Terms</h2>
        <table className="w-full border-collapse border border-gray-300 bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">#ID</th>
              <th className="border p-2">Term</th>
              <th className="border p-2">Session</th>
              <th className="border p-2">Class ID</th>
              <th className="border p-2">Start</th>
              <th className="border p-2">End</th>
              {(canEdit || canDelete) && (
                <th className="border p-2">Action</th>
              )}

            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam.exam_id}>
                <td className="border p-2 text-center">{exam.exam_id}</td>
                <td className="border p-2">{exam.term_name}</td>
                <td className="border p-2">{exam.session}</td>
                <td className="border p-2 text-center">{exam.class_id}</td>
                <td className="border p-2 text-center">{exam.start_date}</td>
                <td className="border p-2 text-center">{exam.end_date}</td>
                {(canEdit || canDelete) && (
                  <td className="border p-2 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <MdVisibility
                        className="text-blue-500 text-xl cursor-pointer hover:text-blue-700"
                        onClick={() => setViewExam(exam)}
                      />
                      {canEdit && (
                        <MdEdit
                          onClick={() => {
                            setForm({
                              term_name: exam.term_name,
                              session: exam.session,
                              class_id: exam.class_id,
                              start_date: exam.start_date,
                              end_date: exam.end_date,
                              subjects: exam.subjects.map(s => ({
                                subject_id: s.subject_id,
                                exam_date: s.exam_date,
                                start_time: s.start_time,
                                end_time: s.end_time,
                                room_id: s.room_id,
                                invigilator_id: s.invigilator_id?.id || s.invigilator_id || null
                              }))
                            });
                            setSelectedExam(exam);
                            setShowForm(true);
                            setViewExam(null);
                          }}
                          className="text-yellow-500 text-xl cursor-pointer hover:text-yellow-700"
                        />
                      )}

                      {canDelete && (
                        <MdDelete
                          className="text-red-500 text-xl cursor-pointer hover:text-red-700"
                          onClick={() => handleDeleteExam(exam.exam_id)}
                        />
                      )}

                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-b-md">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-semibold">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-md px-3 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md font-semibold ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100'
                }`}
            >
              Prev
            </button>

            {/* Current Page Number */}
            <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md">{page}</span>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md font-semibold ${page === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100'
                }`}
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {viewExam && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6">

          {/* Printable Exam Details */}
          <div ref={printRef} className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-6 py-4 border-b">
              <h2 className="text-2xl font-bold text-blue-800">📝 Exam Details</h2>
            </div>

            {/* Exam Info */}
            <div className="px-6 py-4 text-gray-700 grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">📘 Term Name:</span> {viewExam.term_name}</div>
              <div><span className="font-semibold">📆 Session:</span> {viewExam.session}</div>
              <div><span className="font-semibold">🏫 Class ID:</span> {viewExam.class_id}</div>
              <div><span className="font-semibold">🗓️ Start Date:</span> {viewExam.start_date}</div>
              <div><span className="font-semibold">🗓️ End Date:</span> {viewExam.end_date}</div>
            </div>

            {/* Subject Schedule Table */}
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-blue-700 mt-4 mb-2">📚 Subject Schedule</h3>
              <table className="w-full text-sm border border-gray-300 rounded overflow-hidden">
                <thead className="bg-gray-100 text-gray-800">
                  <tr>
                    <th className="border px-4 py-2 text-left">Subject</th>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Time</th>
                    <th className="border px-4 py-2 text-left">Room</th>
                    <th className="border px-4 py-2 text-left">Invigilator</th>
                  </tr>
                </thead>
                <tbody>
                  {viewExam.subjects?.map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{s.subject_name}</td>
                      <td className="border px-4 py-2">{s.exam_date}</td>
                      <td className="border px-4 py-2">{s.start_time} - {s.end_time}</td>
                      <td className="border px-4 py-2">{s.room_name}</td>
                      <td className="border px-4 py-2">{s.invigilator_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Buttons (non-printable) */}
          <div className="absolute bottom-6 flex flex-wrap justify-center gap-4 no-print">
            <button
              onClick={() =>
                html2pdf().from(printRef.current).save(`${viewExam.term_name}_Exam.pdf`)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
            >
              🖨️ Print PDF
            </button>
            <button
              onClick={() => setViewExam(null)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
            >
              ❌ Close
            </button>
          </div>
        </div>
      )}





    </div >
  );
};

export default CreateExam;
