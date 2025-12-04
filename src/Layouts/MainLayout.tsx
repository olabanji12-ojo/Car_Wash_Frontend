import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Outlet /> {/* Child route renders here */}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;
