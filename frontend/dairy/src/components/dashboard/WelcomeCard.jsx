const WelcomeCard = () => {
  const ownerName = "Rajesh Ji";
  const dairyName = "MilkFlow";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 text-white shadow-lg">
      <p className="text-sm opacity-90">👋 Good Morning</p>

      <h2 className="text-2xl font-bold mt-1">
        {ownerName}
      </h2>

      <p className="text-sm mt-1 opacity-90">
        {dairyName}
      </p>

      <p className="text-xs mt-3 opacity-80">
        {today}
      </p>

      <div className="mt-5 border-t border-green-300 pt-3 flex justify-between">
        <div>
          <p className="text-xs">Today's Collection</p>
          <h3 className="text-xl font-bold">
            0 L
          </h3>
        </div>

        <div className="text-4xl">
          🥛
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;