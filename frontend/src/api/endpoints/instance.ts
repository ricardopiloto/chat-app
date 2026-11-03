import { http } from "../http";

export interface InstanceStatus {
  initial_setup: boolean;
}

export const instance = {
  status: () => http.get<InstanceStatus>("/api/instance/status"),
};
