// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Loader2 } from 'lucide-react';
// import { useAuthStore } from '@/stores/authStore';
// import { useLogin } from '@/hooks/useLogin';
// import { loginSchema, type LoginFormData } from '@/types/authSchema';

// export function Login() {
//   const { isLoading, error } = useAuthStore();
//   const { handleLogin } = useLogin();
//   const form = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: { username: '', password: '' }, // เปลี่ยนจาก email เป็น username
//   });

//   const onSubmit = async (data: LoginFormData) => {
//     await handleLogin(data.username, data.password); // เปลี่ยนจาก email
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-2xl">Login</CardTitle>
//           <CardDescription>Enter your credentials to access your account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="username">Username</Label> {/* เปลี่ยนจาก Email */}
//               <Input
//                 id="username"
//                 type="text" // หรือ type="email" ถ้า username เป็น email
//                 placeholder="e.g., aphinet.dam"
//                 {...form.register('username')} // เปลี่ยนจาก email
//               />
//               {form.formState.errors.username && (
//                 <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Your password"
//                 {...form.register('password')}
//               />
//               {form.formState.errors.password && (
//                 <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
//               )}
//             </div>
//             {error && <p className="text-sm text-destructive text-center">{error}</p>}
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               {isLoading ? 'Signing in...' : 'Sign in'}
//             </Button>
//           </form>
//           <div className="mt-4 text-center text-sm">
//             Don't have an account?{' '}
//             <Button variant="link" asChild className="p-0">
//               <a href="/register">Sign up</a>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogin } from '@/hooks/useLogin';
import { loginSchema, type LoginFormData } from '@/types/authSchema';


export function Login() {
  const { isLoading, error } = useAuthStore();
  const { handleLogin } = useLogin();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    await handleLogin(data.username, data.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50" />

      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl shadow-purple-500/10">
          <CardContent className="pt-8 pb-8 px-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src="/synergy-logo.svg" alt="Synergy Logo" className="w-64 h-auto" />
            </div>

            {/* Welcome text */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h1>
              <p className="text-gray-500 text-sm">Sign in to continue to your workspace</p>
            </div>

            {/* Login form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10 h-11 bg-white/50 border-gray-200 focus:border-violet-400 focus:ring-violet-400 transition-colors"
                    {...form.register('username')}
                  />
                </div>
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-11 bg-white/50 border-gray-200 focus:border-violet-400 focus:ring-violet-400 transition-colors"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Forgot password link */}
              {/* <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-sm text-violet-600 hover:text-violet-700 hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div> */}

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-700 hover:via-purple-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>


          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Synergy by CureConnect. All rights reserved.
        </p>
      </div>
    </div>
  );
}