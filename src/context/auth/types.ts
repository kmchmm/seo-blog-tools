export interface UserData {
  id: number;
  profilegrid_id: number;
  username: string;
  email: string;
  birthdate: string;
  full_name: string;
  nickname: string;
  cover_photo: string;
  profile_picture: string;
  gender: string;
  department: string;
  country: string;
  position: string;
  city: string;
  about_me: string;
  employment: string;
  date_hired: string;
  regularization_date: string;
  date_created: string;
  date_deleted: string;
  active: boolean;
}

export type State = {
  userData: UserData;
  setUserData: (userData: UserData) => void;
  logout: () => void;
  toolsAccess: string[];
  handleSetToolsAccess: (tools: string[]) => void;
  loadingGetTools: boolean;
};

export interface ToolsResults {
  id: number;
  created_at: string;
  department: string;
  tool_access: {
    access: string[];
  };
}
