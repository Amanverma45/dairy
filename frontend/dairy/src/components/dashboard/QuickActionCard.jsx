const QuickActionCard = ({ title, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition"
    >
      <div className="text-3xl">{icon}</div>

      <p className="text-sm font-medium text-center">
        {title}
      </p>
    </button>
  );
};

export default QuickActionCard;