import { PrismaUserRepository } from "../../adapters/repositories/PrismaUserRepository.js";
import { PrismaOpeningRepository } from "../../adapters/repositories/PrismaOpeningRepository.js";
import { PrismaCandidateRepository } from "../../adapters/repositories/PrismaCandidateRepository.js";
import { PrismaNoteRepository } from "../../adapters/repositories/PrismaNoteRepository.js";
import { PrismaTenantRepository } from "../../adapters/repositories/PrismaTenantRepository.js";
import { KeycloakAuthService } from "../../adapters/services/KeycloakAuthService.js";
import { NodemailerEmailService } from "../../adapters/services/NodemailerEmailService.js";
import { getStorageService } from "../../adapters/services/StorageServiceAdapter.js";

import { ListOpenings, GetOpeningDetails } from "../../usecases/opening/ListOpenings.js";
import { SubmitProfile, GeneratePresignedUrl, DeleteProfile } from "../../usecases/candidate/SubmitProfile.js";
import { ShortlistProfile, RejectProfile, UpdateProfileStatus } from "../../usecases/candidate/ShortlistProfile.js";
import { GetNotes, AddNote, DeleteNote } from "../../usecases/candidate/ManageNotes.js";
import { GetDashboardStats } from "../../usecases/analytics/GetDashboardStats.js";

import { AuthController } from "../../controllers/express/AuthController.js";
import { VendorController } from "../../controllers/express/VendorController.js";
import { ProfileController } from "../../controllers/express/ProfileController.js";
import { HiringManagerController } from "../../controllers/express/HiringManagerController.js";
import { AIController } from "../../controllers/express/AIController.js";
import { AnalyticsController } from "../../controllers/express/AnalyticsController.js";

// ─── Repositories ────────────────────────────────────────────────
const userRepo = new PrismaUserRepository();
const openingRepo = new PrismaOpeningRepository();
const candidateRepo = new PrismaCandidateRepository();
const noteRepo = new PrismaNoteRepository();
const tenantRepo = new PrismaTenantRepository();

// ─── Services ────────────────────────────────────────────────────
const authService = new KeycloakAuthService();
const emailService = new NodemailerEmailService();
const storageService = getStorageService();

// ─── Use Cases ───────────────────────────────────────────────────
const listOpenings = new ListOpenings(openingRepo, candidateRepo);
const getOpeningDetails = new GetOpeningDetails(openingRepo, candidateRepo, userRepo);
const submitProfile = new SubmitProfile(candidateRepo, openingRepo, storageService);
const generatePresignedUrl = new GeneratePresignedUrl(openingRepo);
const deleteProfile = new DeleteProfile(candidateRepo, openingRepo);
const shortlistProfile = new ShortlistProfile(candidateRepo, openingRepo, userRepo, emailService);
const rejectProfile = new RejectProfile(candidateRepo, openingRepo, userRepo, emailService);
const updateProfileStatus = new UpdateProfileStatus(candidateRepo, openingRepo);
const getNotes = new GetNotes(noteRepo);
const addNote = new AddNote(noteRepo);
const deleteNote = new DeleteNote(noteRepo);
const getDashboardStats = new GetDashboardStats(openingRepo, candidateRepo);

// ─── Controllers ─────────────────────────────────────────────────
export const authController = new AuthController(userRepo, authService, tenantRepo);
export const vendorController = new VendorController(listOpenings, getOpeningDetails);
export const profileController = new ProfileController(submitProfile, generatePresignedUrl, deleteProfile);
export const hiringManagerController = new HiringManagerController(
  listOpenings, getOpeningDetails, shortlistProfile, rejectProfile,
  updateProfileStatus, getNotes, addNote, deleteNote,
  candidateRepo, storageService
);
export const aiController = new AIController(openingRepo);
export const analyticsController = new AnalyticsController(getDashboardStats);

// ─── Repositories (exposed for middleware) ───────────────────────
export { userRepo, openingRepo, candidateRepo, noteRepo, tenantRepo };
