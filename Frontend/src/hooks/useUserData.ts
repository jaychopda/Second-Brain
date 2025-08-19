import { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface UserData {
  username: string;
  name: string;
  avatar: string;
  googleId: string;
}

export const useUserData = () => {
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [userAvatar, setUserAvatar] = useState('');
  const [userInitial, setUserInitial] = useState('U');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/v1/me`, {
            headers: {
              token: token
            }
          });
          
          const userData: UserData = response.data.user;
          setUserName(userData.name || 'User');
          setUserEmail(userData.username);
          setUserAvatar(userData.avatar || '');
          setUserInitial((userData.name || userData.username || 'U').charAt(0).toUpperCase());
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // Keep default values on error
        }
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, []);

  return {
    userName,
    userEmail,
    userAvatar,
    userInitial,
    loading
  };
};
