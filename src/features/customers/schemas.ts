import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(1),
  municipality: z.string().min(1),
});

export const ownedMachineSchema = z.object({
  customerId: z.string().min(1),
  modelName: z.string().min(1),
  unitNo: z.string().min(1),
  engineNo: z.string().optional(),
});

export const machineUpdateSchema = z.object({
  machineId: z.string().min(1),
  customerId: z.string().min(1).optional(),
  modelName: z.string().min(1),
  unitNo: z.string().min(1),
  engineNo: z.string().optional(),
});
