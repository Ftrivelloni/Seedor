import { EmpaqueLayoutClient } from './EmpaqueLayoutClient';

export default function EmpaqueLayout({ children }: { children: React.ReactNode }) {
  return <EmpaqueLayoutClient>{children}</EmpaqueLayoutClient>;
}
