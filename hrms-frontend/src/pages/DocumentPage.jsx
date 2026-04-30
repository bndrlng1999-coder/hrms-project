import React, { useEffect, useState } from 'react';
import { documentAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const fallbackDocuments = [
  { id: 'policy', name: 'Company Policy 2024', type: 'PDF Document', size: '2.5 MB' },
  { id: 'handbook', name: 'Employee Handbook', type: 'PDF Document', size: '1.8 MB' },
  { id: 'conduct', name: 'Code of Conduct', type: 'PDF Document', size: '1.2 MB' },
];

const DocumentPage = () => {
  const [documents, setDocuments] = useState([]);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await documentAPI.getAll();
      const apiDocuments = res.data.data?.documents || [];
      setDocuments(apiDocuments.length > 0 ? apiDocuments : fallbackDocuments);
    } catch (error) {
      showError('Failed to load documents');
      setDocuments(fallbackDocuments);
    }
  };

  const handleDownload = (name) => {
    showSuccess(`${name} is ready to download when a file is attached`);
  };

  return (
    <div className="page-shell">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Documents</h1>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Company Documents</h2>

        <div className="space-y-4">
          {documents.map((document) => (
            <div key={document.id || document.name} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-3xl mr-4">DOC</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{document.name}</h3>
                    <p className="text-sm text-gray-500">
                      {document.type || document.documentType || 'Document'} - {document.size || 'No file attached'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDownload(document.name)} className="btn btn-primary">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
