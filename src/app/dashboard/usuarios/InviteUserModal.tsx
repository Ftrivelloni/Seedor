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
import { UserPlus, Mail, Phone } from 'lucide-react';
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

    async function handleSubmit(formData: FormData) {
        await inviteUserAction(formData);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                        Enviá una invitación por email para agregar un nuevo usuario.
                    </DialogDescription>
                </DialogHeader>
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
                                <SelectItem value="SUPERVISOR">Supervisor operativo</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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
            </DialogContent>
        </Dialog>
    );
}
