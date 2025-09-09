export type Status = 'pending' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: Status;
}
