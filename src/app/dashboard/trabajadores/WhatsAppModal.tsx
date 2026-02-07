'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Textarea } from '@/components/dashboard/ui/textarea';
import { Label } from '@/components/dashboard/ui/label';
import { Alert, AlertDescription } from '@/components/dashboard/ui/alert';
import { MessageCircle, Info } from 'lucide-react';
import type { SerializedWorker } from './types';

interface WhatsAppModalProps {
  worker: SerializedWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppModal({ worker, open, onOpenChange }: WhatsAppModalProps) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!worker) return null;

  function handleSend() {
    // Placeholder: In production, this would call a WhatsApp Business API
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage('');
      onOpenChange(false);
    }, 1500);
  }

  const defaultMessage = `Hola ${worker.firstName}, te notificamos desde Seedor.`;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setMessage('');
          setSent(false);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Se enviará al número {worker.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-message">Mensaje</Label>
            <Textarea
              id="wa-message"
              placeholder={defaultMessage}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-xs">
              Esta funcionalidad simula el envío de mensajes de WhatsApp. En producción se 
              integraría con la API de WhatsApp Business.
            </AlertDescription>
          </Alert>

          {sent && (
            <p className="text-sm text-green-600 font-medium text-center">
              ✓ Mensaje enviado (simulación)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sent}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {sent ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
