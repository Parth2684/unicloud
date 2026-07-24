"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/user/useUserStore";
import { Status, TransferType } from "@/stores/user/types";
import { formatBytes, formatDuration } from "@/utils/format";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InfoPage() {
  const { userInfo, jobs, setUserInfo, setJobs, editJob } = useUserStore();
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    jobId: string;
    newStatus: Status;
  } | null>(null);

  useEffect(() => {
    if (userInfo == null) setUserInfo();
    setJobs();
  }, [setUserInfo, setJobs, userInfo]);

  if (!userInfo) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading user information…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">User Information</h1>

      <section className="mb-8 overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Profile Details</h2>
        </div>
        <div className="px-6 py-4">
          <div className="mb-6 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={userInfo.image}
              alt={userInfo.name}
              className="mr-4 size-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-medium text-foreground">{userInfo.name}</h3>
              <p className="text-muted-foreground">{userInfo.gmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Stat label="Member Since" value={formatDate(userInfo.created_at)} />
            <Stat label="Quota Type" value={String(userInfo.quota_type)} />
            <Stat label="Total Quota" value={formatBytes(Number(userInfo.total_quota))} />
            <Stat label="Used Quota" value={formatBytes(Number(userInfo.used_quota))} />
            <Stat label="Remaining Quota" value={formatBytes(Number(userInfo.remaining_quota))} />
            <Stat label="Free Quota" value={formatBytes(Number(userInfo.free_quota))} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Transfer Jobs</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Completed or failed jobs cannot have their status changed.
          </p>
        </div>
        <div className="px-4 py-4 sm:px-6">
          {!jobs || jobs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No jobs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "Name",
                      "Type",
                      "Size",
                      "Status",
                      "Created",
                      "Source",
                      "Destination",
                      "Finished In",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-surface-hover">
                      <td className="px-3 py-3 text-center font-medium">
                        {job.name}
                        <span className="ml-2 inline-flex rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {job.is_folder ? "Folder" : "File"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground">
                        {transferTypeLabel(job.transfer_type)}
                      </td>
                      <td className="px-3 py-3 text-center">{formatBytes(job.size)}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                            statusClass(job.status),
                          )}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-3 py-3 text-center">{job.source_email || "—"}</td>
                      <td className="px-3 py-3 text-center">{job.destination_email}</td>
                      <td className="px-3 py-3 text-center">{formatDuration(job.time)}</td>
                      <td className="px-3 py-3 text-center">
                        {canEditJob(job.status) ? (
                          editingJobId === job.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <select
                                className="rounded-md border border-input bg-surface px-2 py-1 text-sm"
                                defaultValue={job.status}
                                onChange={(e) =>
                                  setConfirmModal({
                                    jobId: job.id,
                                    newStatus: e.target.value as Status,
                                  })
                                }
                              >
                                <option value={job.status}>
                                  {job.status.toString().charAt(0).toUpperCase() +
                                    job.status.slice(1)}
                                </option>
                                <option value={Status.Complete}>Complete</option>
                                <option value={Status.Failed}>Failed</option>
                              </select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingJobId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => setEditingJobId(job.id)}
                            >
                              Edit
                            </Button>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Change Job Status?"
      >
        <p className="mb-6 text-sm text-muted-foreground">
          Are you sure you want to change this job status to{" "}
          <span className="font-medium text-foreground">{confirmModal?.newStatus}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setConfirmModal(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (!confirmModal) return;
              await editJob(confirmModal.jobId, confirmModal.newStatus);
              setConfirmModal(null);
              setEditingJobId(null);
              await setJobs();
            }}
          >
            Confirm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString();
}

function canEditJob(status: Status) {
  return status === Status.Pending || status === Status.Running;
}

function transferTypeLabel(type: TransferType) {
  switch (type) {
    case TransferType.GoogleToGoogle:
      return "Google → Google";
    case TransferType.MegaToGoogle:
      return "Mega → Google";
    default:
      return "Unknown";
  }
}

function statusClass(status: Status) {
  switch (status) {
    case Status.Pending:
      return "bg-warning/15 text-warning";
    case Status.Running:
      return "bg-primary/15 text-primary";
    case Status.Complete:
      return "bg-success/15 text-success";
    case Status.Failed:
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}
