import BottomNav from "./BottomNav";

const PageContainer = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="w-full max-w-4xl mx-auto px-4 py-6 md:px-6">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default PageContainer;
