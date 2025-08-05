import { State } from './types';

export const initUserData = {
  id: 0,
  profilegrid_id: 0,
  username: '',
  email: '',
  birthdate: '',
  full_name: '',
  nickname: '',
  cover_photo: '',
  profile_picture: '',
  gender: '',
  department: '',
  country: '',
  position: '',
  city: '',
  about_me: '',
  employment: '',
  date_hired: '',
  regularization_date: '',
  date_created: '',
  date_deleted: '',
  active: false,
};

export const initialState: State = {
  userData: initUserData,
  setUserData: () => {},
  logout: () => {},
  toolsAccess: [],
  handleSetToolsAccess: () => {},
  loadingGetTools: false,
};
