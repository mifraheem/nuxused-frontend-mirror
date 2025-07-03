import React from 'react'

const SMS = () => {
    return (
        <div>
             <div className="bg-blue-900 text-white py-4 px-6 rounded-md mt-5">
            <h1 className="text-xl font-bold">Financial updates via SMS</h1>
          </div>
        <div className="bg-blue-50 min-h-screen p-8">
          {/* Header Section */}
         
    
          {/* Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Left Form */}
            <div className="bg-white p-6 rounded-md shadow-md">
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  SMS Template
                </label>
                <select className="w-full bg-gray-100 px-4 py-2 rounded-md border border-gray-300">
                  <option value="">Select Template</option>
                  <option value="Template1">Template 1</option>
                  <option value="Template2">Template 2</option>
                  <option value="Template3">Template 3</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Write your title here"
                  className="w-full bg-gray-100 px-4 py-2 rounded-md border border-gray-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Write your message here"
                  rows="6"
                  className="w-full bg-gray-100 px-4 py-2 rounded-md border border-gray-300"
                ></textarea>
              </div>
            </div>
    
            {/* Right Options */}
            <div className="bg-white p-6 rounded-md shadow-md">
              <label className="block text-gray-700 font-semibold mb-2">
                Message to <span className="text-red-500">*</span>
              </label>
              <div className="bg-gray-100 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <input type="checkbox" id="students" className="mr-2" />
                  <label htmlFor="students" className="text-gray-700">
                    Students
                  </label>
                </div>
                <div className="flex items-center mb-2">
                  <input type="checkbox" id="guardians" className="mr-2" />
                  <label htmlFor="guardians" className="text-gray-700">
                    Guardians
                  </label>
                </div>
                <div className="flex items-center mb-2">
                  <input type="checkbox" id="admin" className="mr-2" />
                  <label htmlFor="admin" className="text-gray-700">
                    Admin
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="teachers" className="mr-2" />
                  <label htmlFor="teachers" className="text-gray-700">
                    Teachers
                  </label>
                </div>
              </div>
            </div>
          </div>
    
          {/* Footer Section */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center">
              <input type="checkbox" id="send-now" className="mr-2" />
              <label htmlFor="send-now" className="text-gray-700">
                Send Now
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="schedule" className="mr-2" />
              <label htmlFor="schedule" className="text-gray-700">
                Schedule
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="schedule-date-time" className="mr-2" />
              <label htmlFor="schedule-date-time" className="text-gray-700">
                Schedule date & time
              </label>
              <input
                type="datetime-local"
                className="ml-2 bg-gray-100 px-4 py-2 rounded-md border border-gray-300"
              />
            </div>
            <button className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition">
              Submit
            </button>
          </div>
        </div>
        </div>
      );
}

export default SMS