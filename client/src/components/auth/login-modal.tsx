import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { login, socialLogin, clearError } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginModal({ isOpen, onClose, onRegisterClick }: LoginModalProps) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  const onSubmit = async (values: LoginFormValues) => {
    try {
      await dispatch(login(values));
      toast({
        title: "Giriş başarılı",
        description: "Hesabınıza giriş yaptınız",
      });
      onClose();
    } catch (error) {
      // Error is handled by the Redux action
    }
  };
  
  const handleSocialLogin = async (provider: string) => {
    try {
      await dispatch(socialLogin(provider));
      toast({
        title: "Giriş başarılı",
        description: "Hesabınıza giriş yaptınız",
      });
      onClose();
    } catch (error) {
      // Error is handled by the Redux action
    }
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          dispatch(clearError());
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Hesabınıza Giriş Yapın
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("google")}
            className="w-full"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google ile giriş yap
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("facebook")}
            className="w-full"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-blue-600">
              <path
                fill="currentColor"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
              />
            </svg>
            Facebook ile giriş yap
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("apple")}
            className="w-full"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
              <path
                fill="currentColor"
                d="M14.94 5.19A4.38 4.38 0 0 0 16 2.5a4.38 4.38 0 0 0-3 1.55 4.07 4.07 0 0 0-1.03 2.9 3.5 3.5 0 0 0 2.97-1.76zm2.94 14.44c.96-.76 1.32-1.45 2.13-2.76a9.89 9.89 0 0 1-1.25-1.97c-.77-1.55-1.15-3.1-1.15-4.53 0-2.23.9-3.89 2.68-5.03a4.44 4.44 0 0 0-2.2-.63c-.75 0-1.5.19-2.25.56-.73.36-1.21.53-1.45.53-.3 0-.8-.19-1.5-.57A4.77 4.77 0 0 0 10.5 5c-1.23 0-2.38.42-3.44 1.25a6.3 6.3 0 0 0-2.46 5.05c0 1.81.47 3.73 1.4 5.77.85 1.85 1.76 3.03 2.74 3.53.58.3 1.04.35 1.42.18.31-.13.75-.48 1.3-1.05.53-.56 1.1-.84 1.69-.84.58 0 1.17.27 1.77.84a4.4 4.4 0 0 0 3.2 1.14c1.12-.13 2.07-.74 2.82-1.74z"
              />
            </svg>
            Apple ile giriş yap
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("github")}
            className="w-full"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
              <path
                fill="currentColor"
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
              />
            </svg>
            GitHub ile giriş yap
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("twitter")}
            className="w-full"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-blue-400">
              <path
                fill="currentColor"
                d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
              />
            </svg>
            Twitter ile giriş yap
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                veya e-posta ile devam edin
              </span>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input placeholder="E-posta adresiniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Şifreniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="text-sm text-red-500">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>
        </div>
        
        <div className="mt-4 text-center text-sm">
          <p className="text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Button 
              variant="link" 
              className="p-0" 
              onClick={onRegisterClick}
            >
              Kaydolun
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
