import { adminApiRequest } from "./auth.service";

const createFriendlyWorkoutError = (error, fallbackMessage) => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const normalizedValue = typeof value === "string" ? value.trim() : value;
    if (normalizedValue === "") {
      return;
    }

    searchParams.set(key, String(normalizedValue));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const listAdminWorkouts = async ({ query = "", signal } = {}) => {
  try {
    return await adminApiRequest(`/admin/workouts${buildQueryString({ query })}`, { signal });
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to load workouts"));
  }
};

export const createAdminWorkout = async (payload) => {
  try {
    return await adminApiRequest("/admin/workouts", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to create workout"));
  }
};

export const updateAdminWorkout = async (workoutId, payload) => {
  try {
    return await adminApiRequest(`/admin/workouts/${workoutId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to update workout"));
  }
};

export const deleteAdminWorkout = async (workoutId) => {
  try {
    return await adminApiRequest(`/admin/workouts/${workoutId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to delete workout"));
  }
};

export const syncAdminWorkouts = async (payload = {}) => {
  try {
    return await adminApiRequest("/admin/workouts/sync", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to sync workouts"));
  }
};

export const previewAdminWorkoutSync = async (payload = {}) => {
  try {
    return await adminApiRequest("/admin/workouts/sync/preview", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to preview Vimeo workouts"));
  }
};

export const uploadAdminWorkoutVideo = async (file) => {
  const contentType = String(file?.type || "video/mp4").trim() || "video/mp4";
  const fileName = String(file?.name || "workout-video.mp4").trim() || "workout-video.mp4";

  try {
    const directUpload = await adminApiRequest("/admin/uploads/presign", {
      method: "POST",
      body: {
        uploadType: "WORKOUT_VIDEO",
        contentType,
        fileName,
      },
    });

    const uploadResponse = await fetch(directUpload.uploadUrl, {
      method: "PUT",
      headers: {
        ...(directUpload.headers || {}),
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
    }

    return directUpload.fileUrl;
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to upload workout video"));
  }
};

export const uploadAdminCommunityVideo = async (file) => {
  const contentType = String(file?.type || "video/mp4").trim() || "video/mp4";
  const fileName = String(file?.name || "community-video.mp4").trim() || "community-video.mp4";

  try {
    const directUpload = await adminApiRequest("/admin/uploads/presign", {
      method: "POST",
      body: {
        uploadType: "COMMUNITY_VIDEO",
        contentType,
        fileName,
      },
    });

    const uploadResponse = await fetch(directUpload.uploadUrl, {
      method: "PUT",
      headers: {
        ...(directUpload.headers || {}),
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
    }

    return directUpload.fileUrl;
  } catch (error) {
    throw new Error(createFriendlyWorkoutError(error, "Failed to upload community video"));
  }
};
