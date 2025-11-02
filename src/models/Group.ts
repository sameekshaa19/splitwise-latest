import { ObjectId } from 'mongodb';

export interface IGroupMember {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
}

export interface IGroup {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdBy: string; // User ID
  members: IGroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

export const createGroup = (group: Omit<IGroup, '_id' | 'createdAt' | 'updatedAt'>): IGroup => {
  return {
    ...group,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
