import { Database } from "@repo/db";
import {
  ProfileId,
  UserProfile,
  type UpdateProfileData,
  ProfileNotFoundError,
  Experience,
  Education,
  UserId,
  type CVUploadRequest,
  ParsedCVResult,
  CVParseError,
} from "@repo/domain";
import { Effect } from "effect";
import { FileStorage } from "./file-storage";
import { OCR } from "./ocr";
import { AI } from "./ai";
import {
  PERFECT_JOB_DESCRIPTION_SYSTEM_PROMPT,
  buildPerfectJobUserPrompt,
} from "../prompts/profile";

export class Profile extends Effect.Service<Profile>()("Profile", {
  effect: Effect.gen(function* () {
    const db = yield* Database;
    const fileStorage = yield* FileStorage;
    const ocr = yield* OCR;
    const ai = yield* AI;

    const get = (userId: string) =>
      Effect.fn("profile.get")(function* () {
        const profile = yield* db.use((client) =>
          client.userProfile.findUnique({
            where: { userId },
            include: {
              experience: true,
              education: true,
            },
          }),
        );

        if (!profile) {
          const newProfile = yield* db.use((client) =>
            client.userProfile.create({
              data: {
                userId,
                skills: [],
              },
              include: {
                experience: true,
                education: true,
              },
            }),
          );

          return UserProfile.make({
            id: ProfileId.make(newProfile.id),
            userId: UserId.make(newProfile.userId),
            fullName: newProfile.fullName ?? undefined,
            email: newProfile.email ?? undefined,
            phone: newProfile.phone ?? undefined,
            headline: newProfile.headline ?? undefined,
            summary: newProfile.summary ?? undefined,
            skills: newProfile.skills,
            experience: newProfile.experience.map((exp) =>
              Experience.make({
                id: exp.id,
                title: exp.title,
                company: exp.company,
                startDate: exp.startDate,
                endDate: exp.endDate ?? undefined,
                description: exp.description ?? undefined,
                current: exp.current,
              }),
            ),
            education: newProfile.education.map((edu) =>
              Education.make({
                id: edu.id,
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field,
                startDate: edu.startDate,
                endDate: edu.endDate ?? undefined,
                current: edu.current,
              }),
            ),
            cvFileUrl: newProfile.cvFileUrl ?? undefined,
            linkedinUrl: newProfile.linkedinUrl ?? undefined,
            createdAt: newProfile.createdAt,
            updatedAt: newProfile.updatedAt,
          });
        }

        return UserProfile.make({
          id: ProfileId.make(profile.id),
          userId: UserId.make(profile.userId),
          fullName: profile.fullName ?? undefined,
          email: profile.email ?? undefined,
          phone: profile.phone ?? undefined,
          headline: profile.headline ?? undefined,
          summary: profile.summary ?? undefined,
          skills: profile.skills,
          experience: profile.experience.map((exp) =>
            Experience.make({
              id: exp.id,
              title: exp.title,
              company: exp.company,
              startDate: exp.startDate,
              endDate: exp.endDate ?? undefined,
              description: exp.description ?? undefined,
              current: exp.current,
            }),
          ),
          education: profile.education.map((edu) =>
            Education.make({
              id: edu.id,
              institution: edu.institution,
              degree: edu.degree,
              field: edu.field,
              startDate: edu.startDate,
              endDate: edu.endDate ?? undefined,
              current: edu.current,
            }),
          ),
          cvFileUrl: profile.cvFileUrl ?? undefined,
          linkedinUrl: profile.linkedinUrl ?? undefined,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        });
      })();

    const update = (userId: string, data: typeof UpdateProfileData.Type) =>
      Effect.fn("profile.update")(function* () {
        const existingProfile = yield* db.use((client) =>
          client.userProfile.findUnique({
            where: { userId },
          }),
        );

        if (!existingProfile) {
          return yield* Effect.fail(
            new ProfileNotFoundError({ userId: UserId.make(userId) }),
          );
        }

        if (data.experience) {
          yield* db.use((client) =>
            client.experience.deleteMany({
              where: { profileId: existingProfile.id },
            }),
          );

          yield* db.use((client) =>
            client.experience.createMany({
              data: data.experience!.map((exp) => ({
                profileId: existingProfile.id,
                title: exp.title,
                company: exp.company,
                startDate: exp.startDate,
                endDate: exp.endDate ?? null,
                description: exp.description ?? null,
                current: exp.current,
              })),
            }),
          );
        }

        if (data.education) {
          yield* db.use((client) =>
            client.education.deleteMany({
              where: { profileId: existingProfile.id },
            }),
          );

          yield* db.use((client) =>
            client.education.createMany({
              data: data.education!.map((edu) => ({
                profileId: existingProfile.id,
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field,
                startDate: edu.startDate,
                endDate: edu.endDate ?? null,
                current: edu.current,
              })),
            }),
          );
        }

        const updated = yield* db.use((client) =>
          client.userProfile.update({
            where: { userId },
            data: {
              fullName: data.fullName ?? undefined,
              email: data.email ?? undefined,
              phone: data.phone ?? undefined,
              headline: data.headline ?? undefined,
              summary: data.summary ?? undefined,
              skills: data.skills ? [...data.skills] : undefined,
              linkedinUrl: data.linkedinUrl ?? undefined,
            },
            include: {
              experience: true,
              education: true,
            },
          }),
        );

        return UserProfile.make({
          id: ProfileId.make(updated.id),
          userId: UserId.make(updated.userId),
          fullName: updated.fullName ?? undefined,
          email: updated.email ?? undefined,
          phone: updated.phone ?? undefined,
          headline: updated.headline ?? undefined,
          summary: updated.summary ?? undefined,
          skills: updated.skills,
          experience: updated.experience.map((exp) =>
            Experience.make({
              id: exp.id,
              title: exp.title,
              company: exp.company,
              startDate: exp.startDate,
              endDate: exp.endDate ?? undefined,
              description: exp.description ?? undefined,
              current: exp.current,
            }),
          ),
          education: updated.education.map((edu) =>
            Education.make({
              id: edu.id,
              institution: edu.institution,
              degree: edu.degree,
              field: edu.field,
              startDate: edu.startDate,
              endDate: edu.endDate ?? undefined,
              current: edu.current,
            }),
          ),
          cvFileUrl: updated.cvFileUrl ?? undefined,
          linkedinUrl: updated.linkedinUrl ?? undefined,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        });
      })();

    const uploadCV = (userId: string, request: typeof CVUploadRequest.Type) =>
      Effect.fn("profile.uploadCV")(function* () {
        const cvUrl = yield* fileStorage.save(
          request.fileName,
          request.fileData,
          request.mimeType,
        );

        const parsedText = yield* ocr
          .parseDocument(request.fileData, request.mimeType)
          .pipe(
            Effect.mapError(
              (error) =>
                new CVParseError({
                  message: error.message,
                }),
            ),
          );

        yield* db.use((client) =>
          client.userProfile.update({
            where: { userId },
            data: {
              cvFileUrl: cvUrl,
              cvParsedText: parsedText,
            },
          }),
        );

        return ParsedCVResult.make({ text: parsedText });
      })();

    const generatePerfectJobDescription = (userId: string) =>
      Effect.fn("profile.generatePerfectJobDescription")(function* () {
        const profile = yield* db.use((client) =>
          client.userProfile.findUnique({
            where: { userId },
            include: {
              experience: true,
              education: true,
            },
          }),
        );

        if (!profile) {
          return yield* Effect.fail(
            new ProfileNotFoundError({ userId: UserId.make(userId) }),
          );
        }

        const userPrompt = buildPerfectJobUserPrompt({
          fullName: profile.fullName ?? undefined,
          headline: profile.headline ?? undefined,
          summary: profile.summary ?? undefined,
          skills: profile.skills,
          experience: profile.experience.map((exp) => ({
            title: exp.title,
            company: exp.company,
            startDate: exp.startDate,
            endDate: exp.endDate ?? undefined,
            description: exp.description ?? undefined,
            current: exp.current,
          })),
          education: profile.education.map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate ?? undefined,
            current: edu.current,
          })),
        });

        const perfectJobDescription = yield* ai.generate({
          system: PERFECT_JOB_DESCRIPTION_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        const embeddingVector = yield* ai.createEmbedding(
          perfectJobDescription,
        );

        yield* db.use(
          (client) =>
            client.$executeRaw`
              UPDATE user_profile
              SET perfect_job_description = ${perfectJobDescription},
                  perfect_job_embedding = ${JSON.stringify(embeddingVector)}::vector
              WHERE user_id = ${userId}
            `,
        );

        return true;
      })();

    return {
      get,
      update,
      uploadCV,
      generatePerfectJobDescription,
    };
  }),
}) {}
