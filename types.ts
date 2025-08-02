export interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export enum ChatStep {
  NAME = 'name_step',
  BIRTH_DATE = 'birth_step',
  COMPLAINT = 'complaint_step',
  PHONE = 'phone_step',
  COMPLETED = 'completed',
}

export interface UserData {
  patient_name: string;
  birth_date: string;
  chief_complaint: string;
  phone_number: string;
}