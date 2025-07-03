import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FeeForm } from "../../components";

const AdmitIndividual = () => {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [admissionData, setAdmissionData] = useState({
    student: "",
    parent: "",
    class_assigned: "",
    admission_type: "Transfer",
  });
const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}admissions/`;
  const token = Cookies.get("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, parentsRes, classesRes] = await Promise.all([
          axios.get(`${API}api/auth/users/list_profiles/student/`, { headers }),  
          axios.get(`${API}api/auth/users/list_profiles/parent/`, { headers }),   
          axios.get(`${API}classes/`, { headers }),  // ✅ Updated the correct endpoint
        ]);

        console.log("✅ Students API Response:", studentsRes.data);
        console.log("✅ Parents API Response:", parentsRes.data);
        console.log("✅ Classes API Response:", classesRes.data);

        setStudents(studentsRes.data.results || studentsRes.data || []);
        setParents(parentsRes.data.results || parentsRes.data || []);
        setClasses(classesRes.data.results || classesRes.data || []);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        toast.error("Failed to fetch required data. Please check API paths.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdmissionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!admissionData.student || !admissionData.parent || !admissionData.class_assigned) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const response = await axios.post(API_URL, admissionData, { headers });

      if (response.data.status === 201) {
        toast.success("Student admitted successfully!");
        setAdmissionData({
          student: "",
          parent: "",
          class_assigned: "",
          admission_type: "Transfer",
        });
      }
    } catch (error) {
      console.error("Error admitting student:", error);
      toast.error("Admission failed!");
    }
  };

  const fields = [
    {
      id: "student",
      label: "Student Name",
      type: "select",
      options: students.length > 0
        ? students.map((student) => ({
            value: student.id,
            label: `${student.name} - ${student.email}`,
          }))
        : [{ value: "", label: "No students available" }],
    },
    {
      id: "parent",
      label: "Parent Name",
      type: "select",
      options: parents.length > 0
        ? parents.map((parent) => ({
            value: parent.id,
            label: `${parent.name} - ${parent.email}`,
          }))
        : [{ value: "", label: "No parents available" }],
    },
    {
      id: "class_assigned",
      label: "Class Assigned",
      type: "select",
      options: classes.length > 0
        ? classes.map((cls) => ({
            value: cls.id,
            label: `${cls.class_name} - ${cls.section} (${cls.session})`,
          }))
        : [{ value: "", label: "No classes available" }],
    },
    {
      id: "admission_type",
      label: "Admission Type",
      type: "select",
      options: [
        { value: "New", label: "New" },
        { value: "Transfer", label: "Transfer" },
        { value: "Re-admission", label: "Re-admission" },
      ],
    },
  ];

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <div>
        <h1 className="flex justify-start pl-6 text-white font-extrabold my-8 bg-blue-900 py-4 text-xl rounded-sm">
          Admit Individual
        </h1>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <FeeForm fields={fields} onSubmit={handleSubmit} buttonText="Admit Student" />
      )}
    </div>
  );
};

export default AdmitIndividual;
