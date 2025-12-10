import React, { useEffect, useState } from 'react';
import { apiGetAuditLogs } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiGetAuditLogs(p, limit);

      // apiRequest helper returns `data.data` in many responses.
      // Backend sends { success: true, data: [...], pagination: {...} }
      // Handle both shapes: either res is an array, or an object with .data and .pagination
      let items: any[] = [];
      let totalCount = 0;

      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray((res as any).data)) {
        items = (res as any).data;
        totalCount = (res as any).pagination?.total || items.length;
      } else if (res && Array.isArray((res as any).logs)) {
        items = (res as any).logs;
        totalCount = (res as any).total || items.length;
      } else if (res && (res as any).length) {
        items = res as any;
      }

      setLogs(items);
      setTotal(totalCount || items.length);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div>
          <button
            className="btn-secondary mr-2"
            onClick={() => { setPage(1); fetchLogs(1); }}
          >Refresh</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {logs.map((log: any) => (
                <motion.div key={log._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="p-3 border rounded-md hover:shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-gray-600">{log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'System'}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${log.level === 'Error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{log.level}</span>
                    </div>
                  </div>

                  <details className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <summary className="cursor-pointer">Details</summary>
                    <pre className="whitespace-pre-wrap mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded">{JSON.stringify(log.details, null, 2)}</pre>
                  </details>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Showing page {page} — {total} total</div>
              <div className="space-x-2">
                <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <button className="btn-primary" onClick={() => setPage(p => p + 1)} disabled={logs.length < limit}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuditLogsPage;
