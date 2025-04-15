import { createContext , useEffect, useState} from "react";

interface UserData {
  id : number;
  profilegrid_id : number;
  username : string;
  email : string;
  birthdate : string;
  full_name : string;
  nickname : string;
  cover_photo : string;
  profile_picture : string;
  gender : string;
  department : string;
  country : string;
  position : string;
  city : string;
  about_me : string;
  employment : string;
  date_hired : string;
  regularization_date : string;
  date_created : string;
  date_deleted: string;
  active : boolean;
}

const initUserData = {
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
  active: false
}

interface UserContextProps {
  userData: UserData;
  setUserData: Function;
}

export const UserContext = createContext<UserContextProps>({
  userData: initUserData,
  setUserData: Function
});

//@todo: remove any, use proper typing for children
export const Provider = ({ children }: any) => {
  const [ userData, setUserData ] = useState<UserData>(initUserData);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;