import { ObjectId } from "mongodb";

export interface IExpense {
  _id?: ObjectId;
  amount: number;
  description: string;
  paidBy: string; // User ID
  groupId?: string;
  splitType: "EQUAL" | "PERCENTAGE" | "EXACT";
  split: Array<{
    userId: string;
    amount: number;
    percentage?: number;
    settled: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export const createExpense = (
  expense: Omit<IExpense, "_id" | "createdAt" | "updatedAt">
): IExpense => {
  return {
    ...expense,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
