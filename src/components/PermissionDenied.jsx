import React from 'react';
import { MdBlock } from 'react-icons/md';

const PermissionDenied = ({
  message = "You don't have permission to access this page.",
  description = "Please contact your administrator if you believe this is a mistake.",
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <MdBlock className="text-red-600 text-6xl" />
        </div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Permission Denied</h2>
        <p className="text-gray-700 text-base mb-4">{message}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default PermissionDenied;
