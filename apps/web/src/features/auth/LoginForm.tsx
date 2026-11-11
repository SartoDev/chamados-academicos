import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { CurrentUser } from '@/app/api/types';
import { FieldError, FormAlert } from '@/app/components/form-parts';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from './auth-api';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (user: CurrentUser) => void;
}

/**
 * Tela 1: e-mail and password with visible labels, validation on blur, a single message for
 * refused credentials (BR1.2) and no password recovery link (BR1.9).
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({ mutationFn: login, onSuccess });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });
  const [email, password] = useWatch({ control, name: ['email', 'password'] });
  const submitting = mutation.isPending;
  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      aria-busy={submitting}
      data-testid="login-form"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <div aria-live="polite">
        {mutation.isError && (
          <FormAlert message={messageForError(mutation.error)} testId="login-form-error-alert" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          autoFocus
          readOnly={submitting}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          data-testid="login-form-email-input"
          {...register('email')}
        />
        <FieldError id="login-email-error" message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="flex gap-2">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            readOnly={submitting}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            data-testid="login-form-password-input"
            {...register('password')}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
            data-testid="login-form-toggle-password-button"
          >
            {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        </div>
        <FieldError id="login-password-error" message={errors.password?.message} />
      </div>

      <Button type="submit" disabled={!canSubmit} data-testid="login-form-submit-button">
        {submitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
