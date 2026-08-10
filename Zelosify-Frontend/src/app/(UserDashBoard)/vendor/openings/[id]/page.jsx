"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/utils/Axios/AxiosInstance";
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

function getFileName(s3Key) {
  if (!s3Key) return "Unknown file";
  const parts = s3Key.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.replace(/^\d+_/, "").replace(/\.[^.]+$/, "") || fileName;
}

function SkeletonCard() {
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted rounded" />
        <div>
          <div className="h-4 w-32 bg-muted rounded mb-1" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-16 bg-muted rounded-full" />
        <div className="h-6 w-6 bg-muted rounded" />
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
      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-32 bg-muted rounded border-2 border-dashed" />
      </div>
      <div className="border border-border rounded-lg p-6">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function OpeningDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  const fetchOpeningDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/vendor/openings/${params.id}`);
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

  const validateFile = (file) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, PPTX, and DOCX files are allowed");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(validateFile);
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setUploading(true);
      for (const file of selectedFiles) {
        const presignResponse = await axiosInstance.post(`/vendor/openings/${params.id}/profiles/presign`, {
          fileName: file.name,
          contentType: file.type,
        });
        const { presignedUrl } = presignResponse.data;
        await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        await axiosInstance.post(`/vendor/openings/${params.id}/profiles/upload`, { s3Key: presignResponse.data.s3Key });
      }
      setUploadSuccess(true);
      setSelectedFiles([]);
      fetchOpeningDetails();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading profiles:", error);
      toast.error("Failed to upload profiles. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    setDeleteTarget(profileId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/vendor/openings/${params.id}/profiles/${deleteTarget}`);
      toast.success("Profile deleted successfully");
      fetchOpeningDetails();
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    } finally {
      setDeleteTarget(null);
    }
  };

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
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to openings
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

          <div className="border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upload Profiles</h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-border hover:bg-muted"
              }`}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop files here or click to select</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, or DOCX — max 10MB each — multiple files supported</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.pptx,.doc,.docx" onChange={handleFileSelect} />

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {uploading ? `Uploading ${selectedFiles.length} file(s)...` : `Upload ${selectedFiles.length} file(s)`}
                </button>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 mt-4 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Profiles uploaded successfully!</span>
              </div>
            )}
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Submitted Profiles ({opening.hiringProfiles?.length || 0})
            </h2>
            {opening.hiringProfiles?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No profiles submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {opening.hiringProfiles?.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{getFileName(profile.s3Key)}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(profile.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${profileStatusColors[profile.status] || "bg-gray-50"}`}>
                        {profile.status}
                      </span>
                      <button onClick={() => handleDeleteProfile(profile.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Profile"
        description="Are you sure you want to delete this profile? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
