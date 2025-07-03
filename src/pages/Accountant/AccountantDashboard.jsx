import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { Pie, Bar } from "react-chartjs-2";
import {Chart as ChartJS, ArcElement, Tooltip,Legend,  BarElement, CategoryScale, LinearScale, PointElement, LineElement} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Legend, Tooltip);

export default function AccountantDashboard() {
  const [activeTab, setActiveTab] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("User logged out");
    navigate('/login'); 
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };
  const expenses = [
    { name: "Person1 Name", amount: 1400 },
    { name: "Person2 Name", amount: 1000 },
    { name: "Person3 Name", amount: 1600 },
    { name: "Person4 Name", amount: 2000 },
    { name: "Person5 Name", amount: 1500 },
    { name: "Person6 Name", amount: 1500 },
    { name: "Person7 Name", amount: 1500 },
    { name: "Person8 Name", amount: 1500 },
    { name: "Person9 Name", amount: 1500 },
    { name: "Person10 Name", amount: 1500 },
    { name: "Person11 Name", amount: 1500 },
  ];

  const pieData = {
    labels: [
      "Salaries",
      "Integrations, Servers, and Hosting",
      "Marketing",
      "External Hires",
      "Taxes",
      "Others",
    ],
    datasets: [
      {
        data: [50, 18, 10, 8, 5, 9], 
        backgroundColor: [
          "#012169", 
          "#005A9C", 
          "#4B9CD3", 
          "#23a8f2", 
          "#6CB4EE",
          "#89CFF0", 
        ],
        hoverBackgroundColor: [
          "#00308F",
          "#87CEFA",
          "#6495ED",
          "#6699CC",
          "#72A0C1",
          "#7CB9E8",
        ],
        borderWidth: 1,
      },
    ],
  };

  const data = {
    labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    datasets: [
      {
        label: "Income",
        data: [8000, 10000, 7500, 11000, 15000, 9000, 12000, 10000, 9500, 11000, 9000, 8500],
        backgroundColor: "#4D8AF0",
        barThickness: 20,
      },
      {
        label: "Expenses",
        data: [6000, 7000, 5000, 8000, 12000, 6000, 9000, 8000, 7000, 8500, 6000, 5000],
        backgroundColor: "#77abdf",
        barThickness: 20,
      },
      {
        label: "Profit",
        data: [2000, 3000, 2500, 3000, 3000, 3000, 3000, 2000, 2500, 2500, 3000, 3500],
        type: "line",
        borderColor: "#E74C3C",
        borderWidth: 2,
        pointBackgroundColor: "#E74C3C",
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#333",
          font: {
            size: 14,
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#333",
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "#333",
          callback: (value) => `$${value}`,
        },
        grid: {
          color: "#ddd",
        },
      },
    },
  };

  return (
    <div className="flex min-h-screen">
      
    

      {/* Main Content */}
      <div className="flex-1 p-6 bg-blue-50">
      
        <div className="flex flex-wrap justify-around mt-1 gap-6 px-20 pt-6 py-11">
          {/* Latest Expense List */}
          <div className="bg-white shadow-md rounded-lg p-4 w-5/12  ">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-blue-900">
                Latest Expense
              </h2>
              <i className="pi pi-ellipsis-h text-blue-900"></i>
            </div>
            <span className="block border-b-2 border-solid border-slate-200 mt-2"></span>

            {/* Expense List */}
            <ul className="px-5 mt-4">
              {expenses.map((expense, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-blue-900 text-sm mb-2"
                >
                  <span>{expense.name}</span>
                  <span className="flex-grow border-b border-dotted border-blue-900 mx-2"></span>
                  <span className="font-semibold">Rs. {expense.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pie Chart Section */}
          <div className="bg-white shadow-md rounded-lg p-4 w-5/12 ">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-blue-900">
                Monthly Expense
              </h2>
              <i className="pi pi-ellipsis-h text-blue-900"></i>
            </div>
            <span className="block border-b-2 border-solid border-slate-200 mt-2"></span>

            {/* Pie Chart */}
            <div className="mt-4 ">
              <Pie data={pieData}  />
            </div>
          </div>
        </div>
    <div className="bg-white shadow-md rounded-lg p-4 w-4/12 mt-0 ml-28">
  <div className="flex justify-between items-center border-b border-gray-300 pb-2">
    <h2 className="text-lg font-extrabold text-blue-900">All Time Earning</h2>
    <i className="pi pi-ellipsis-h text-blue-900"></i>
  </div>
  <div className="text-center mt-4 p-4">
    <p className="text-2xl font-bold text-blue-900">Rs. 1,56,6870</p>
  </div>
</div>


      <div className="bg-white rounded-lg shadow-md p-6 w-9/12 mt-10 ml-28 mb-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Yearly Expense</h3>
        <div className="h-80">
          <Bar data={data} options={options} />
        </div>
      </div>
   

      </div>
    </div>
  );
}
