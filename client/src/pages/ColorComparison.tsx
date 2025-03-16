import { useEffect } from "react";
import { motion } from "framer-motion";
import PurpleBalanceCard from "@/components/wallet/PurpleBalanceCard";
import BlueBalanceCard from "@/components/wallet/BlueBalanceCard";
import TransactionTable from "@/components/wallet/TransactionTable";
import DepositForm from "@/components/wallet/DepositForm";

const ColorComparison = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-6 space-y-8"
    >
      <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-slate-800/50">
        <h1 className="text-2xl font-bold mb-6 text-white">Color Scheme Comparison</h1>
        
        <div className="space-y-10">
          {/* Balance Cards Comparison */}
          <section>
            <h2 className="text-xl font-medium mb-4 text-slate-300">Balance Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-400">Deep Purple/Magenta with Silver</h3>
                <PurpleBalanceCard />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-400">Dark Blue/Cyan with White</h3>
                <BlueBalanceCard />
              </div>
            </div>
          </section>
          
          {/* Forms Comparison */}
          <section>
            <h2 className="text-xl font-medium mb-4 text-slate-300">Deposit Form</h2>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-medium mb-2 text-slate-400">Multiple Color Schemes Mixed</h3>
              <DepositForm />
            </div>
          </section>
          
          {/* Transaction Table Comparison */}
          <section>
            <h2 className="text-xl font-medium mb-4 text-slate-300">Transaction Table</h2>
            <div>
              <h3 className="text-sm font-medium mb-2 text-slate-400">Slate/Azure with Gold Accents</h3>
              <TransactionTable />
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default ColorComparison;