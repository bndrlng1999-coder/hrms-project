import React, { useState, useEffect } from 'react';
import { employeeAPI, payslipAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { PERMISSIONS, hasPermission } from '../auth/authorization';

const PayslipPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const canGeneratePayslip = hasPermission(user, [PERMISSIONS.PAYSLIP_GENERATE, PERMISSIONS.PAYROLL_MANAGE]);

  useEffect(() => {
    if (user?.id) {
      fetchPayslips();
    }
  }, [user]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      let res;
      if (user.role === 'EMPLOYEE') {
        const employeeRes = await employeeAPI.getByUserId(user.id);
        res = await payslipAPI.getByEmployee(employeeRes.data.data.id);
      } else {
        res = await payslipAPI.getAll();
      }
      setPayslips(res.data.data || []);
    } catch (error) {
      showError('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const generatePayslips = async () => {
    if (generating) return;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    if (!window.confirm(`Generate payslips for ${month}/${year}?`)) return;
    try {
      setGenerating(true);
      await payslipAPI.generate({ month, year });
      showSuccess('Payslip generation request recorded');
      await fetchPayslips();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to generate payslips');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading payslips...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Payroll</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Payslips</h1>
        </div>
        {canGeneratePayslip && (
          <button type="button" onClick={generatePayslips} disabled={generating} className="btn btn-primary">
            {generating ? <span className="btn-spinner" /> : null}
            Generate Payslips
          </button>
        )}
      </div>

      <div className="card">
        {payslips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No payslips available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Employee</th>
                  <th className="table-cell">Month/Year</th>
                  <th className="table-cell">Issued Date</th>
                  <th className="table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="table-row">
                    <td className="table-cell">{payslip.employeeName}</td>
                    <td className="table-cell">{payslip.month}/{payslip.year}</td>
                    <td className="table-cell">{payslip.issuedDate}</td>
                    <td className="table-cell">
                      <a href="#" className="text-primary-600 hover:text-primary-800 font-medium">
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayslipPage;
