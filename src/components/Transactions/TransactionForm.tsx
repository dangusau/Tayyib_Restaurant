import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import Button from '../Common/Button';
import type { PurchaseItem, Expense, UnitType } from '../../types';

interface FormData {
  transaction_date: string;
  pos_total: number;
  meal_tickets: number;
  cash_received: number;
  previous_balance: number;
  notes: string;
  purchase_items: PurchaseItem[];
  expenses: Expense[];
  cash_balance: number;
}

const UNITS: UnitType[] = ['pieces', 'kg', 'carton', 'dozen', 'pack'];

export default function TransactionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isEdit = Boolean(id);
  const isMD = user?.role === 'MD';

  const [initialLoading, setInitialLoading] = useState(true);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      transaction_date: new Date().toISOString().slice(0, 10),
      pos_total: 0,
      meal_tickets: 0,
      cash_received: 0,
      previous_balance: 0,
      notes: '',
      purchase_items: [],
      expenses: [],
      cash_balance: 0,
    },
  });

  const { fields: itemFields, append: addItem, remove: removeItem, replace: replaceItems } = useFieldArray({ control, name: 'purchase_items' });
  const { fields: expenseFields, append: addExpense, remove: removeExpense, replace: replaceExpenses } = useFieldArray({ control, name: 'expenses' });

  const loadLastBalance = useCallback(async () => {
    if (!user?.restaurant_id) return;
    const { data } = await supabase
      .from('transactions')
      .select('cash_balance')
      .eq('restaurant_id', user.restaurant_id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);
    const lastBalance = (data as any)?.[0]?.cash_balance ?? 0;
    setValue('previous_balance', lastBalance);
    setValue('cash_balance', lastBalance);
  }, [user?.restaurant_id, setValue]);

  useEffect(() => {
    async function init() {
      if (isEdit && id) {
        const { data: txn, error } = await supabase
          .from('transactions')
          .select('*, purchase_items(*), expenses(*)')
          .eq('id', id)
          .single();

        if (error || !txn) {
          toast.error('Transaction not found');
          navigate('/transactions');
          return;
        }

        const t = txn as any;
        reset({
          transaction_date: t.transaction_date,
          pos_total: t.pos_total,
          meal_tickets: t.meal_tickets,
          cash_received: t.cash_received,
          previous_balance: t.previous_balance,
          notes: t.notes || '',
          purchase_items: t.purchase_items || [],
          expenses: t.expenses || [],
          cash_balance: t.cash_balance,
        });
        replaceItems(t.purchase_items || []);
        replaceExpenses(t.expenses || []);
      } else {
        if (!isMD) addItem({ item_name: '', quantity: 0, unit: 'pieces', unit_price: 0 });
        addExpense({ description: '', amount: 0, category: 'supplies' });
        await loadLastBalance();
      }
      setInitialLoading(false);
    }
    init();
  }, [id, isEdit, reset, navigate, isMD, addItem, addExpense, replaceItems, replaceExpenses, loadLastBalance]);

  const purchaseTotal = watch('purchase_items').reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
  const expenseTotal = watch('expenses').reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalSpent = purchaseTotal + expenseTotal;

  const prevBal = watch('previous_balance');
  const cashReceivedVal = watch('cash_received');

  // Update cash balance when fields change
  useEffect(() => {
    if (isMD) {
      setValue('cash_balance', prevBal);
    } else {
      setValue('cash_balance', prevBal + (cashReceivedVal || 0));
    }
  }, [prevBal, cashReceivedVal, isMD, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const posTotal = isMD ? -totalSpent : data.pos_total;
      const cashReceived = isMD ? 0 : data.cash_received;   // <-- key change

      const transactionData = {
        restaurant_id: user.restaurant_id,
        transaction_date: data.transaction_date,
        pos_total: posTotal,
        meal_tickets: isMD ? 0 : data.meal_tickets,
        cash_received: cashReceived,
        previous_balance: data.previous_balance,
        total_spent: totalSpent,
        notes: data.notes,
        cash_balance: data.cash_balance,
        created_by: user.id,
      };

      let txnId: string | undefined = id;

      if (isEdit && txnId) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData as any)
          .eq('id', txnId);
        if (error) throw error;
      } else {
        const { data: newTxn, error } = await supabase
          .from('transactions')
          .insert(transactionData as any)
          .select()
          .single();
        if (error) throw error;
        txnId = (newTxn as any)?.id;
      }

      if (!txnId) throw new Error('Could not determine transaction ID');

      if (isEdit) {
        await supabase.from('purchase_items').delete().eq('transaction_id', txnId);
        await supabase.from('expenses').delete().eq('transaction_id', txnId);
      }

      if (!isMD) {
        const items = data.purchase_items
          .filter(i => i.item_name && i.quantity > 0 && i.unit_price > 0)
          .map(i => ({
            transaction_id: txnId,
            item_name: i.item_name,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
          }));
        if (items.length > 0) await supabase.from('purchase_items').insert(items as any);
      }

      const expenses = data.expenses
        .filter(e => e.description && e.amount > 0)
        .map(e => ({
          transaction_id: txnId,
          description: e.description,
          amount: e.amount,
          category: e.category,
        }));
      if (expenses.length > 0) await supabase.from('expenses').insert(expenses as any);

      toast.success(isEdit ? 'Transaction updated!' : 'Transaction saved!');
      navigate('/transactions');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        {isEdit ? 'Edit' : 'New'} {isMD ? 'Expense' : 'Transaction'}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm">Date</label>
            <input type="date" {...register('transaction_date', { required: true })} className="border rounded px-2 py-1 w-full" />
          </div>

          {!isMD && (
            <>
              <div>
                <label className="block text-sm">POS Total (Card/Transfer)</label>
                <input type="number" step="1" min="0" {...register('pos_total', { valueAsNumber: true, required: true })} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm">Meal Tickets</label>
                <input type="number" step="1" min="0" {...register('meal_tickets', { valueAsNumber: true })} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm">Cash Received (Physical Cash)</label>
                <input type="number" step="1" min="0" {...register('cash_received', { valueAsNumber: true })} className="border rounded px-2 py-1 w-full" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm">Previous Balance</label>
            <input
              type="number"
              step="1"
              {...register('previous_balance', { valueAsNumber: true })}
              className="border rounded px-2 py-1 w-full bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm">Notes</label>
            <input {...register('notes')} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm">Cash Balance (Till After Entry)</label>
            <input
              type="number"
              step="1"
              {...register('cash_balance', { valueAsNumber: true })}
              className="border rounded px-2 py-1 w-full bg-gray-100"
              readOnly
            />
          </div>
        </div>

        {!isMD && (
          <div>
            <h3 className="font-semibold">Purchase Items</h3>
            {itemFields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap gap-2 mb-2 items-end">
                <input {...register(`purchase_items.${index}.item_name`, { required: true })} placeholder="Item name" className="border rounded px-2 py-1 flex-1 min-w-[120px]" />
                <input type="number" step="0.001" min="0" {...register(`purchase_items.${index}.quantity`, { valueAsNumber: true, required: true })} placeholder="Qty" className="border rounded px-2 py-1 w-20" />
                <select {...register(`purchase_items.${index}.unit`)} className="border rounded px-2 py-1">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input type="number" step="1" min="0" {...register(`purchase_items.${index}.unit_price`, { valueAsNumber: true, required: true })} placeholder="Price" className="border rounded px-2 py-1 w-24" />
                <span className="text-sm text-gray-600">Total: ₦{((field.quantity || 0) * (field.unit_price || 0)).toLocaleString()}</span>
                <button type="button" onClick={() => removeItem(index)} className="text-red-500">&times;</button>
              </div>
            ))}
            <button type="button" onClick={() => addItem({ item_name: '', quantity: 0, unit: 'pieces', unit_price: 0 })} className="text-primary text-sm hover:underline">+ Add Item</button>
          </div>
        )}

        <div>
          <h3 className="font-semibold">{isMD ? 'Expenses' : 'Other Expenses'}</h3>
          {expenseFields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap gap-2 mb-2 items-end">
              <input {...register(`expenses.${index}.description`, { required: true })} placeholder="Description" className="border rounded px-2 py-1 flex-1" />
              <input
                type="number"
                step="1"
                min="0"
                {...register(`expenses.${index}.amount`, { valueAsNumber: true, required: true })}
                placeholder="Amount"
                className="border rounded px-2 py-1 w-24"
              />
              <select {...register(`expenses.${index}.category`)} className="border rounded px-2 py-1">
                <option value="supplies">Supplies</option>
                <option value="utilities">Utilities</option>
                <option value="maintenance">Maintenance</option>
                <option value="staff">Staff</option>
                <option value="other">Other</option>
              </select>
              <button type="button" onClick={() => removeExpense(index)} className="text-red-500">&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => addExpense({ description: '', amount: 0, category: 'supplies' })} className="text-primary text-sm hover:underline">+ Add Expense</button>
        </div>

        <div className="text-right space-y-1">
          <div className="font-bold">Total Spent: ₦{totalSpent.toLocaleString()}</div>
          <div className="text-sm text-gray-600">
            {isMD
              ? 'Cash balance unchanged (expense deducted from POS)'
              : `Cash Balance = Previous Balance + Cash Received`}
          </div>
        </div>

        <Button type="submit" className="w-full">
          {isEdit ? 'Update' : 'Save'} {isMD ? 'Expense' : 'Transaction'}
        </Button>
      </form>
    </div>
  );
}
