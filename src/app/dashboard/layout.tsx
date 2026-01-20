'use client';

import { AppLayout } from '@/components/dashboard/AppLayout';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from '@/components/dashboard/ui/sonner';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
        </AppProvider>
    );
}
