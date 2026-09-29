import { adminApiRequest } from "./auth.service";

export const listNotificationTemplates = async ({ signal } = {}) => {
  return adminApiRequest("/admin/notification-templates", { signal });
};

export const saveNotificationTemplates = async (items) => {
  return adminApiRequest("/admin/notification-templates", {
    method: "PUT",
    body: items,
  });
};
