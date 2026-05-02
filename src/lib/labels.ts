import type { OrderStatus, InventoryLogType } from "@prisma/client";

export const orderStatusLabel: Record<OrderStatus, string> = {
  OPEN: "発注済み",
  PARTIALLY_RECEIVED: "一部入荷",
  RECEIVED: "入荷完了",
  CANCELLED: "取消",
};

export const orderLineStatusLabel = {
  ORDERED: "未入荷",
  PARTIALLY_RECEIVED: "一部入荷",
  RECEIVED: "入荷済",
} as const;

export const inventoryLogLabel: Record<InventoryLogType, string> = {
  PURCHASE_IN: "購買入荷",
  USAGE_OUT: "使用出庫",
  ADJUSTMENT: "棚卸・調整",
};
