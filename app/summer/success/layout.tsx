import Footer from '@/components/Footer';

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
