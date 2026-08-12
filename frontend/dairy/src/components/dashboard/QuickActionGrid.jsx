import {
  FaUserPlus,
  FaUsers,
  FaGlassWhiskey,
  FaMoneyBillWave,
  FaChartBar,
  FaBoxOpen,
} from "react-icons/fa";

import QuickActionCard from "./QuickActionCard";

const QuickActionGrid = () => {
  return (
    <div className="mt-6">

      <h2 className="text-lg font-bold mb-3">
        Quick Actions
      </h2>

      <div className="grid grid-cols-3 gap-3">

        <QuickActionCard title="Supplier" icon={<FaUserPlus />} />

        <QuickActionCard title="Customer" icon={<FaUsers />} />

        <QuickActionCard title="Milk" icon={<FaGlassWhiskey />} />

        <QuickActionCard title="Payment" icon={<FaMoneyBillWave />} />

        <QuickActionCard title="Reports" icon={<FaChartBar />} />

        <QuickActionCard title="Products" icon={<FaBoxOpen />} />

      </div>

    </div>
  );
};

export default QuickActionGrid;