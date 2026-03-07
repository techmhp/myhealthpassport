import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import WhatsAppButton from '@/components/marketing/WhatsAppButton';

export const metadata = {
  title: 'My Health Passport',
  description: 'A preventive health framework for children',
};

export default function PublicLayout({ children }) {
  return (
    <>
      {children}
      <WhatsAppButton />
    </>
  );
}
