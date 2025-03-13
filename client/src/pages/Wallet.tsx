import BalanceCard from "@/components/BalanceCard";
import QRDeposit from "@/components/QRDeposit";
import RecentTransactions from "@/components/RecentTransactions";

const Wallet = () => {
  return (
    <div>
      <BalanceCard />
      <QRDeposit />
      <RecentTransactions />
    </div>
  );
};

export default Wallet;
