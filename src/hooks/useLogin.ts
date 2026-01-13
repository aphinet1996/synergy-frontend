// import { useAuthStore } from '@/stores/authStore';
// import { useNavigate } from 'react-router';
// import { useEffect } from 'react';

// export const useLogin = () => {
//   const { login, user } = useAuthStore();
//   const navigate = useNavigate();

//   const handleLogin = async (username: string, password: string) => {
//     await login(username, password);
//   };

//   useEffect(() => {
//     if (user) navigate('/task');
//   }, [user, navigate]);

//   return { handleLogin };
// };

// src/hooks/useLogin.ts
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

export const useLogin = () => {
  const { login } = useAuthStore();
  const { user: userFromUserStore } = useUserStore();  // ← ใช้จาก userStore (full user)
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);  // await จนเสร็จ (รวม fetchUser)
  };

  useEffect(() => {
    if (userFromUserStore) {  // ← watch userStore.user (รอ full user)
      navigate('/task');
    }
  }, [userFromUserStore, navigate]);

  return { handleLogin };
};