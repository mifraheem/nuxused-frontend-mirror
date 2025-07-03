import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '/school-logo.png'

const Navbar = () => {
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();


  const accountant = () => {
    navigate('/accountant');
  }


  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col rounded-md fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar">
        <div className="px-6 py-4 flex items-center border-b border-blue-700">
          <img src={logo} alt="Acadian Logo" className="w-16 h-16 mr-2 " /> {/* Logo */}
          <span className="font-bold text-2xl">Acadian</span>
        </div>

        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {/* Home */}
            <li>
              <Link
                onClick={() => accountant}
                className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg"
              >
                <i className="pi pi-home mr-3"></i> Home
              </Link>
            </li>

            {/* Manage Fee Payments */}
            <li>
              <button
                onClick={() => toggleTab("feePayments")}
                className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg focus:outline-none"
              >
                <i className="pi pi-wallet mr-3"></i> Manage Fee
                <i
                  className={`pi ${activeTab === "feePayments"
                      ? "pi-chevron-up"
                      : "pi-chevron-down"
                    } ml-auto`}
                ></i>
              </button>
              {activeTab === "feePayments" && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link
                      to="/accountant/fee-type"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Fee Types
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/accountant/fee-structure"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Fee Structure
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      to="/accountant/fee-discount"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Fee Discount
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      to="/accountant/fee-payment"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Fee Payment
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/accountant/student-fee"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Student Fee 
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      to="/accountant/late-payment-fine"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Late Payment
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      to="/accountant/custom-fee"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Generate Fee
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      to="/accountant/transport-fee"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Transport Fee
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      to="/accountant/bulk-fee"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Bulk Fees
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      to="/accountant/family-credits"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Handle Family Credits
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      to="/accountant/fee-calculation"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Fee Calculations
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      to="/accountant/increment-fee"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Fee List and Actions
                    </Link>
                  </li> */}

                  {/* <li>
                    <Link
                      to="/accountant/fee-vouchers"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Print Fee Vouchers
                    </Link>
                  </li> */}
                </ul>
              )}
            </li>

            {/* Manage Staff Salary */}
            <li>
              <button
                onClick={() => toggleTab("staffSalary")}
                className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg focus:outline-none"
              >
                <i className="pi pi-user mr-3"></i> Manage Salary
                <i
                  className={`pi ${activeTab === "staffSalary"
                      ? "pi-chevron-up"
                      : "pi-chevron-down"
                    } ml-auto`}
                ></i>
              </button>
              {activeTab === "staffSalary" && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link
                      to="/accountant/staff-salary"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Generate Staff Salary
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      to="/accountant/loan-applicaton"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Manage Loan
                    </Link>
                  </li> */}
                </ul>
              )}
            </li>

            {/* Reporting */}
            {/* <li>
              <button
                onClick={() => toggleTab("reporting")}
                className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg focus:outline-none"
              >
                <i className="pi pi-chart-bar mr-3"></i> Reporting
                <i
                  className={`pi ${activeTab === "reporting"
                      ? "pi-chevron-up"
                      : "pi-chevron-down"
                    } ml-auto`}
                ></i>
              </button>
              {activeTab === "reporting" && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link
                      to="/accountant/income-expense"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Income/Expense
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/accountant/account-summary"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Account Summary
                    </Link>
                  </li>
                </ul>
              )}
            </li> */}

            {/* Communication */}
            {/* <li>
              <button
                onClick={() => toggleTab("communication")}
                className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg focus:outline-none"
              >
                <i className="pi pi-envelope mr-3"></i> Communication
                <i
                  className={`pi ${activeTab === "communication"
                      ? "pi-chevron-up"
                      : "pi-chevron-down"
                    } ml-auto`}
                ></i>
              </button>
              {activeTab === "communication" && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li>
                    <Link
                      to="/accountant/updates-via-SMS"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Financial Updates via SMS
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/accountant/updates-via-email"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      Financial Updates via Email
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/accountant/sms-history"
                      className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                    >
                      SMS History
                    </Link>
                  </li>
                </ul>
              )}
            </li> */}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default Navbar