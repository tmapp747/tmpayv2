
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TransactionDetails() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/transactions/${id}`);
        const data = await response.json();
        if (data.success) {
          setTransaction(data.transaction);
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!transaction) {
    return <div>Transaction not found</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details #{transaction.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Amount</h3>
              <p>₱{transaction.amount}</p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <p>{transaction.status}</p>
            </div>
            <div>
              <h3 className="font-semibold">Type</h3>
              <p>{transaction.type}</p>
            </div>
            <div>
              <h3 className="font-semibold">Method</h3>
              <p>{transaction.method}</p>
            </div>
            <div>
              <h3 className="font-semibold">Created At</h3>
              <p>{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Reference</h3>
              <p>{transaction.paymentReference}</p>
            </div>
          </div>

          {transaction.statusHistory && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Status History</h3>
              <div className="space-y-2">
                {transaction.statusHistory.map((history: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{history.status}</span>
                    <span>{new Date(history.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
