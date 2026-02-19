"use client";

import { Key, useEffect } from "react";
import { useUserStore } from "../../../stores/user/useUserStore";
import { Status, TransferType } from "../../../stores/user/types";
import { formatBytes } from '../../../utils/format';

export default function InfoPage() {
  const { userInfo, jobs, setUserInfo, setJobs } = useUserStore();

  useEffect(() => {
    setUserInfo();
    setJobs();
  }, [setUserInfo, setJobs]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.Pending:
        return "text-yellow-600 bg-yellow-50";
      case Status.Running:
        return "text-blue-600 bg-blue-50";
      case Status.Complete:
        return "text-green-600 bg-green-50";
      case Status.Failed:
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case Status.Pending:
        return "Pending";
      case Status.Running:
        return "Running";
      case Status.Complete:
        return "Complete";
      case Status.Failed:
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const getTransferTypeText = (type: TransferType) => {
    switch (type) {
      case TransferType.GoogleToGoogle:
        return "Google → Google";
      case TransferType.MegaToGoogle:
        return "Mega → Google";
      default:
        return "Unknown";
    }
  };



  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading user information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Information</h1>
        
        {/* User Info Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Profile Details</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center mb-6">
              <img
                src={userInfo.image}
                alt={userInfo.name}
                className="h-16 w-16 rounded-full mr-4"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{userInfo.name}</h3>
                <p className="text-gray-600">{userInfo.gmail}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-lg font-medium text-gray-900">{formatDate(userInfo.created_at)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500">Quota Type</p>
                <p className="text-lg font-medium text-gray-900">{userInfo.quota_type}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500">Total Quota</p>
                <p className="text-lg font-medium text-gray-900">{formatBytes(Number(userInfo.total_quota))}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500">Used Quota</p>
                <p className="text-lg font-medium text-gray-900">{formatBytes(Number(userInfo.used_quota))}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500">Remaining Quota</p>
                <p className="text-lg font-medium text-gray-900">{formatBytes(Number(userInfo.remaining_quota))}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500">Free Quota</p>
                <p className="text-lg font-medium text-gray-900">{formatBytes(Number(userInfo.free_quota))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Transfer Jobs</h2>
          </div>
          <div className="px-6 py-4">
            {!jobs || jobs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No jobs found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id as Key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.name}
                          {job.is_folder && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Folder
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getTransferTypeText(job.transfer_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(job.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.source_email || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.destination_email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
