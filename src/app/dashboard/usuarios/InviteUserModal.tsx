'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/dashboard/ui/select';
import { UserPlus, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { inviteUserAction } from './actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
            {pending ? 'Enviando...' : 'Enviar invitación'}
        </Button>
    );
}

export function InviteUserModal() {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        setStatus('idle');
        setErrorMessage('');
        const result = await inviteUserAction(formData);
        if (result.success) {
            setStatus('success');
            setTimeout(() => {
                setOpen(false);
                setStatus('idle');
            }, 2000);
        } else {
            setStatus('error');
            setErrorMessage(result.error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStatus('idle'); setErrorMessage(''); } }}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invitar usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invitar usuario</DialogTitle>
                    <DialogDescription>
                        Se enviará un email de invitación para que el usuario cree su cuenta.
                    </DialogDescription>
                </DialogHeader>

                {status === 'success' ? (
                    <div className="flex flex-col items-center py-6 gap-3">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="text-sm font-medium text-green-700">
                            ¡Invitación enviada exitosamente!
                        </p>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="usuario@empresa.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Teléfono <span className="text-gray-400">(opcional)</span>
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+54 9 11 1234-5678"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">
                                Rol <span className="text-red-500">*</span>
                            </Label>
                            <Select name="role" defaultValue="SUPERVISOR">
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUPERVISOR">
                                        Operativo — acceso a campo, inventario, trabajadores
                                    </SelectItem>
                                    <SelectItem value="ADMIN">
                                        Administrador — acceso completo incluyendo config y ventas
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Los usuarios operativos no tienen acceso a configuración, ventas ni gestión de usuarios.
                            </p>
                        </div>

                        {status === 'error' && (
                            <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <SubmitButton />
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
