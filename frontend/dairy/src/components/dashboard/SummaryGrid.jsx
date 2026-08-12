import {
  FaGlassWhiskey,
  FaUsers,
  FaUserFriends,
  FaRupeeSign,
} from "react-icons/fa";

import SummaryCard from "./SummaryCard";

const SummaryGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-5">

      <SummaryCard
        title="Milk"
        value="0 L"
        icon={<FaGlassWhiskey className="text-green-700" />}
      />

      <SummaryCard
        title="Customers"
        value="0"
        icon={<FaUsers className="text-blue-700" />}
      />

      <SummaryCard
        title="Suppliers"
        value="0"
        icon={<FaUserFriends className="text-orange-700" />}
      />

      <SummaryCard
        title="Income"
        value="₹0"
        icon={<FaRupeeSign className="text-purple-700" />}
      />

    </div>
  );
};

export default SummaryGrid;