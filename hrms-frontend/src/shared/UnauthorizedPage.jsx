import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-6">
    <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
      <div className="text-sm font-semibold text-primary-600 mb-2">403</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Unauthorized</h1>
      <p className="text-gray-600 mb-6">
        Your account does not have permission to open this area.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
