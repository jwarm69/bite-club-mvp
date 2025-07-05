import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentHome from '../components/StudentHome';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminView = adminImpersonation && JSON.parse(adminImpersonation).type === 'student';

  const exitAdminView = () => {
    localStorage.removeItem('adminImpersonation');
    navigate('/admin');
  };

  return (
    <div>
      {/* Admin Impersonation Banner */}
      {isAdminView && (
        <div className="bg-blue-600 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Admin View: Viewing Student Experience</span>
              <span className="bg-blue-700 px-2 py-1 rounded text-sm">Student Perspective</span>
            </div>
            <button
              onClick={exitAdminView}
              className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded transition-colors"
            >
              <span className="text-sm">Exit Admin View</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <StudentHome />
    </div>
  );
};

export default StudentDashboard;