"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import axiosInstance from "@/utils/Axios/AxiosInstance";

const statusColors = {
  OPEN: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400",
  CLOSED: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-400",
  ON_HOLD: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400",
};

const profileStatusColors = {
  SUBMITTED: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-400",
  SHORTLISTED:
    "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-400",
};

export default function OpeningDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchOpeningDetails();
  }, [params.id]);

  const fetchOpeningDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/vendor/openings/${params.id}`);
      setOpening(response.data);
    } catch (error) {
      console.error("Error fetching opening details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF and DOCX files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadSuccess(false);

      // Step 1: Get presigned URL
      const presignResponse = await axiosInstance.post(
        `/vendor/openings/${params.id}/profiles/presign`,
        {
          fileName: selectedFile.name,
          contentType: selectedFile.type,
        }
      );

      const { presignedUrl, s3Key } = presignResponse.data;

      // Step 2: Upload directly to S3
      await fetch(presignedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      // Step 3: Confirm upload with backend
      await axiosInstance.post(
        `/vendor/openings/${params.id}/profiles/upload`,
        { s3Key }
      );

      setUploadSuccess(true);
      setSelectedFile(null);
      fetchOpeningDetails();

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading profile:", error);
      alert("Failed to upload profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    try {
      await axiosInstance.delete(
        `/vendor/openings/${params.id}/profiles/${profileId}`
      );
      fetchOpeningDetails();
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("Failed to delete profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <h1 className="text-2xl font-bold text-foreground">
                  {opening.title}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {opening.description}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  statusColors[opening.status] || "bg-gray-50 text-gray-700"
                }`}
              >
                {opening.status}
              </span>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {opening.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                {opening.contractType}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {opening.experienceMin}-{opening.experienceMax} years experience
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Upload Profile
            </h2>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  {selectedFile ? (
                    <div className="text-center">
                      <FileText className="mx-auto h-8 w-8 text-primary" />
                      <p className="mt-2 text-sm text-foreground">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Click to select a file
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF or DOCX, max 10MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </label>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadSuccess && (
              <div className="flex items-center gap-2 mt-4 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Profile uploaded successfully!</span>
              </div>
            )}
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Submitted Profiles ({opening.hiringProfiles?.length || 0})
            </h2>
            {opening.hiringProfiles?.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No profiles submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {opening.hiringProfiles?.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Profile #{profile.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted{" "}
                          {new Date(profile.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          profileStatusColors[profile.status] || "bg-gray-50"
                        }`}
                      >
                        {profile.status}
                      </span>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                      >
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
    </div>
  );
}
