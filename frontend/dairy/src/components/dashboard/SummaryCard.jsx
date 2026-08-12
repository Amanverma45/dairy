const SummaryCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
        {icon}
      </div>

      <div>
        <p className="text-sm text-gray-500">{title}</p>

        <h2 className="text-xl font-bold text-gray-800">
          {value}
        </h2>
      </div>
    </div>
  );
};

export default SummaryCard;