"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  MessageSquare,
  Send,
  Trash2,
  Clock,
  Brain,
  AlertTriangle,
  Eye,
  User,
  Loader2,
} from "lucide-react";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import { toast } from "sonner";
import ConfirmDialog from "@/components/UI/ConfirmDialog";

const statusColors = {
  OPEN: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400",
  CLOSED: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-400",
  ON_HOLD: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400",
};

const profileStatusColors = {
  SUBMITTED: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-400",
  SHORTLISTED: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-400",
};

const recommendationBadge = (score) => {
  if (score === null || score === undefined) return null;
  if (score >= 0.75)
    return { label: "Recommended", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
  if (score >= 0.5)
    return { label: "Borderline", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" };
  return { label: "Not Recommended", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
};

function getFileName(s3Key) {
  if (!s3Key) return "Unknown file";
  const parts = s3Key.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.replace(/^\d+_/, "").replace(/\.[^.]+$/, "") || fileName;
}

function SkeletonCard() {
  return (
    <div className="border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-muted rounded" />
          <div>
            <div className="h-4 w-32 bg-muted rounded mb-2" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-6 w-6 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonOpening() {
  return (
    <div className="animate-pulse">
      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-8 w-64 bg-muted rounded mb-3" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="border border-border rounded-lg p-6">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function ManagerOpeningDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState(null);
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null);

  const fetchOpeningDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/hiring-manager/openings/${params.id}`);
      setOpening(response.data);
    } catch (err) {
      console.error("Error fetching opening details:", err);
      setError("Failed to load opening details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOpeningDetails();
  }, [fetchOpeningDetails]);

  const fetchNotes = async (profileId) => {
    try {
      setNotesLoading(true);
      setSelectedProfileId(profileId);
      const response = await axiosInstance.get(`/hiring-manager/profiles/${profileId}/notes`);
      setNotes(response.data.notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedProfileId) return;
    try {
      setAddingNote(true);
      await axiosInstance.post(`/hiring-manager/profiles/${selectedProfileId}/notes`, { content: newNote });
      setNewNote("");
      fetchNotes(selectedProfileId);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    setDeleteNoteTarget(noteId);
  };

  const confirmDeleteNote = async () => {
    if (!deleteNoteTarget) return;
    try {
      await axiosInstance.delete(`/hiring-manager/profiles/${selectedProfileId}/notes/${deleteNoteTarget}`);
      toast.success("Note deleted");
      fetchNotes(selectedProfileId);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleteNoteTarget(null);
    }
  };

  const handleShortlist = async (profileId) => {
    try {
      setActionLoading(profileId);
      await axiosInstance.patch(`/hiring-manager/openings/${params.id}/profiles/${profileId}/shortlist`);
      toast.success("Profile shortlisted");
      fetchOpeningDetails();
    } catch (error) {
      console.error("Error shortlisting profile:", error);
      toast.error("Failed to shortlist profile");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (profileId) => {
    try {
      setActionLoading(profileId);
      await axiosInstance.patch(`/hiring-manager/openings/${params.id}/profiles/${profileId}/reject`);
      toast.success("Profile rejected");
      fetchOpeningDetails();
    } catch (error) {
      console.error("Error rejecting profile:", error);
      toast.error("Failed to reject profile");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = async (profileId) => {
    try {
      const response = await axiosInstance.get(`/hiring-manager/profiles/${profileId}/view`);
      const { url } = response.data;
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("File not available. The profile may need to be re-uploaded.");
      }
    } catch (error) {
      console.error("Error viewing profile:", error);
      if (error.response?.status === 404) {
        toast.error("File not found. The profile may need to be re-uploaded.");
      } else {
        toast.error("Failed to load profile");
      }
    }
  };

  const filteredProfiles =
    opening?.hiringProfiles?.filter((profile) => {
      if (filterStatus === "ALL") return true;
      return profile.status === filterStatus;
    }) || [];

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <button onClick={fetchOpeningDetails} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background px-2">
        <div className="flex-1 overflow-y-auto transition-all duration-300">
          <div className="p-4 max-w-4xl mx-auto">
            <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
            <SkeletonOpening />
          </div>
        </div>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted-foreground">Opening not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background px-2">
      <div className="flex-1 overflow-y-auto transition-all duration-300">
        <div className="p-4 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to openings
          </button>

          <div className="border border-border rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{opening.title}</h1>
                <p className="mt-2 text-muted-foreground">{opening.description}</p>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${statusColors[opening.status] || "bg-gray-50 text-gray-700"}`}>
                {opening.status}
              </span>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" /> {opening.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" /> {opening.contractType}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" /> {opening.experienceMin}-{opening.experienceMax} years experience
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Submitted Profiles ({opening.hiringProfiles?.length || 0})
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {filteredProfiles.length === 0 ? (
              <p className="text-muted-foreground text-sm">No profiles match the selected filter.</p>
            ) : (
              <div className="space-y-3">
                {filteredProfiles.map((profile) => {
                  const badge = recommendationBadge(profile.recommendationScore);
                  return (
                    <div key={profile.id} className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {getFileName(profile.s3Key)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(profile.submittedAt).toLocaleDateString()}
                            </p>
                            {(profile.uploaderName || profile.uploadedBy) && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3" />
                                {profile.uploaderName || profile.uploadedBy}
                              </p>
                            )}
                            {profile.recommendationScore !== null && (
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-blue-600 flex items-center gap-1">
                                  <Brain className="w-3 h-3" />
                                  Score: {(profile.recommendationScore * 100).toFixed(1)}%
                                </p>
                                {profile.recommendationConfidence !== null && (
                                  <p className="text-xs text-purple-600">
                                    Confidence: {(profile.recommendationConfidence * 100).toFixed(0)}%
                                  </p>
                                )}
                                {profile.recommendationLatencyMs !== null && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {profile.recommendationLatencyMs}ms
                                  </p>
                                )}
                              </div>
                            )}
                            {profile.recommendationReason && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-lg truncate" title={profile.recommendationReason}>
                                {profile.recommendationReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {badge && (
                            <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                              {badge.label}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${profileStatusColors[profile.status] || "bg-gray-50"}`}>
                            {profile.status}
                          </span>
                          <button
                            onClick={() => handleViewProfile(profile.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => fetchNotes(profile.id)}
                            className={`p-2 rounded-md transition-colors ${
                              selectedProfileId === profile.id
                                ? "bg-blue-100 text-blue-600"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                            title="View Notes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {profile.status === "SUBMITTED" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleShortlist(profile.id)}
                                disabled={actionLoading === profile.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50 transition-colors"
                                title="Shortlist"
                              >
                                {actionLoading === profile.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(profile.id)}
                                disabled={actionLoading === profile.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                                title="Reject"
                              >
                                {actionLoading === profile.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedProfileId === profile.id && (
                        <div className="border-t border-border bg-muted/30 p-4">
                          <h3 className="text-sm font-medium text-foreground mb-3">Notes</h3>
                          {notesLoading ? (
                            <p className="text-xs text-muted-foreground">Loading notes...</p>
                          ) : (
                            <>
                              {notes.length === 0 ? (
                                <p className="text-xs text-muted-foreground mb-3">No notes yet. Add the first note below.</p>
                              ) : (
                                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                  {notes.map((note) => (
                                    <div key={note.id} className="bg-background border border-border rounded-md p-3">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-sm text-foreground">{note.content}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {note.authorName || "Unknown"} • {new Date(note.createdAt).toLocaleString()}
                                          </p>
                                        </div>
                                        <button onClick={() => handleDeleteNote(note.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newNote}
                                  onChange={(e) => setNewNote(e.target.value)}
                                  placeholder="Add a note..."
                                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                                />
                                <button
                                  onClick={handleAddNote}
                                  disabled={!newNote.trim() || addingNote}
                                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteNoteTarget}
        onOpenChange={(open) => { if (!open) setDeleteNoteTarget(null); }}
        title="Delete Note"
        description="Are you sure you want to delete this note?"
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteNote}
      />
    </div>
  );
}
