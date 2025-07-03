import React from "react";

const FeeForm = ({ title, fields, onSubmit,buttonText }) => {
  return (
    <div className="bg-blue-100 p-8 rounded-lg shadow-md w-full max-w-md mx-auto mb-9">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>
      <form
        className="space-y-4 "
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {fields.map(({ id, label, type, options }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
              {label}:
            </label>
            {type === "select" ? (
              <select
                id={id}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>
                  Select {label}
                </option>
                {options.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                id={id}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}

        <div className="flex justify-center mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
          >
             {buttonText}
          </button>

        </div>
      </form>
    </div>
  );
};

export default FeeForm;
